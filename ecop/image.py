import io
import hashlib
from base64 import b64decode
from urllib.parse import urljoin

import shortuuid
import PIL.Image
from psd_tools import PSDImage

from pyramid_rpc.jsonrpc import jsonrpc_method
from pyramid.response import Response
from pyramid.view import view_config

from hm.lib.config import siteConfig

from webmodel.resource import Image
from webmodel.esweb import FileObject

from weblibs.jsonrpc import RPCUserError
from weblibs.oss import getBucket

from .base import RpcBase


def extractTextFromPSD(psd):
    """
    Extract text from recursively from all visible layers of the psd file
    as one concatenated string
    """
    w, h = psd.header.width, psd.header.height

    def processLayer(layer):
        content = ''
        for l in layer.layers:
            if not l.visible or '':
                continue
            if not l.bbox:
                continue
            # if the layer is completely outside of the export area
            x1, y1, x2, y2 = l.bbox
            if x2 <= 0 or w <= x1 or y2 <= 0 or h <= y1:
                continue
            if hasattr(l, 'layers'):
                content = content + ' ' + processLayer(l)
            elif l.text_data:
                content = content + ' ' + l.text_data.text
        return content

    return processLayer(psd).strip()


class ImageJSON(RpcBase):
    """
    Note: ONLY operations relating to ITEM images and ITEM description images
    are handled here.
    """
    def toJson(self, image):
        return {
            'imageId': image.imageId,
            'title': image.title,
            'format': image.format,
            'width': image.width,
            'height': image.height,
            'url': image.url
        }

    def findImage(self, data):
        """
        See if the image already exists in the dababase based on the md5
        finger print of the image data.

          - `data`: Binary data of the image

        Returns an `Image` object if the same image already exists, none
        otherwise.
        """
        md5 = hashlib.md5(data).digest()

        return self.sess.query(Image).filter_by(md5=md5).one_or_none()

    def updateImageAttr(self, image, img, data):
        """ image: DB image, img: PIL image, data: binary image data """
        image.width, image.height = img.size
        image.format = 'jpg' if img.format == 'JPEG' else img.format.lower()
        image.md5 = hashlib.md5(data).digest()

    def checkAndConvertImage(self, data, fname, imgType):
        """
        Helper function that returns a **PIL.Image** object and the binary
        image data of subject to the following transformations:

        *  if the images is in PSD format, convert it to PNG and extract text
           content from the file

        *  for item image, image are sized down to 800x800 or 1200x1200
           depending on the original size. If the input image is not square,
           it will be centered appropriately vertically or horizontally.

        *  for description image, if the image width exceeds 790, it is resized
           to 790 while keeping the image aspect ratio
        """
        data = b64decode(data)

        if fname.endswith('.psd'):
            psd = PSDImage.from_stream(io.BytesIO(data))
            content = extractTextFromPSD(psd)
            img = psd.as_PIL()
        else:
            try:
                img = PIL.Image.open(io.BytesIO(data))
            except OSError:
                raise RPCUserError('该文件不是图片格式。')

            if img.format not in ('JPEG', 'PNG', 'GIF'):
                raise RPCUserError('只支持jpg、png、gif格式的图片。')
            content = None

        modified = False
        if imgType == 'item':
            if img.width < 800 and img.height < 800:
                raise RPCUserError('商品主图宽度和高度必须至少有一个超过800。')
            if len(data) > 500 * 1024:
                raise RPCUserError('商品主图大小不能超过500KB。')

            out_size = 1200 if img.width >= 1200 or img.height >= 1200 else 800
            ratio = min(out_size / img.width, out_size / img.height)

            w, h = int(img.width * ratio), int(img.height * ratio)
            if w != out_size or h != out_size:
                img = img.resize((w, h), PIL.Image.LANCZOS)
                out_img = PIL.Image.new('RGB', (out_size, out_size), 'white')
                out_img.paste(img, ((out_size - w) // 2, (out_size - h) // 2))
                modified = True
                img = out_img

        else:  # this is image for description
            if img.width < 790:
                raise RPCUserError('商品描述图片宽度最小为790。')
            if not 0.3 <= img.height / img.width <= 2:
                raise RPCUserError('商品描述图片高宽比(高度/宽度)必须在0.3-2之间。')
            if img.width > 790:
                img = img.resize((790, int(790 / img.width * img.height)),
                                 PIL.Image.LANCZOS)
                modified = True

        if modified:
            img.format = 'JPEG'
            stream = io.BytesIO()
            img.save(stream, img.format, optimize=True, quality=95)
            data = stream.getvalue()

        if len(data) > 2 * 1024 * 1024:
            raise RPCUserError('图片大小不能超过2MB。')

        return img, data, content

    @jsonrpc_method(endpoint='rpc', method='image.get.md5')
    def getImageByMd5(self, md5):
        """
        Checks if an image with the given md5 already exists. If found,
        returns the found image, otherwise returns None
        """
        image = self.sess.query(Image).filter_by(
            md5=b64decode(md5)
        ).one_or_none()
        return self.toJson(image) if image else None

    @jsonrpc_method(endpoint='rpc', method='image.add')
    def addImage(self, data, fname, imgType):
        """
        Add an item image to the system.

          - `image`: Content of the image to add as base64 encoded binary
          - `imgType`: If the image is intended to be used as item image, which
             is subject to special requirement, set this to 'item'. For image
             uploaded in description, use 'desc'

        Returns the image id regardless of if the image is added successfully
        or the same image already exists.
        """
        img, data, content = self.checkAndConvertImage(data, fname, imgType)

        image = self.findImage(data)
        if not image:
            image = Image(content=content)
        self.updateImageAttr(image, img, data)

        if not image.imageId:  # for new image
            image.content = content
            self.sess.add(image)
            self.sess.flush()  # flush to get the image id

            bucket = getBucket(siteConfig.image_bucket)
            bucket.put_object(image.fileName, data)

        return self.toJson(image)

    @jsonrpc_method(endpoint='rpc', method='image.update')
    def updateImage(self, data, fname, imgType, imageId):
        """
        Updates the **content** of an item image to the system.

        if data belongs to another existing image, the call does nothing and
        simply returns the found image. Otherwise the image is updated and
        the updated image is returned.

        Note on the client side, the call is now only used on item image, not
        description images. So image check is performed accordingly.
        """
        img, data, content = self.checkAndConvertImage(data, fname, imgType)
        image = self.findImage(data)

        if not image:
            image = self.sess.query(Image).get(imageId)
            assert image, 'Image %d does not exist' % imageId

            self.updateImageAttr(image, img, data)
            image.content = content
            if fname:
                image.title = fname.split('.')[0]
            bucket = getBucket(siteConfig.image_bucket)
            bucket.put_object(image.fileName, data)

        return self.toJson(image)


class FileObjectBase(object):
    def getByMd5(self, md5):
        """
        Check if a file object with the md5 is present. Returns the file object
        name or None if not found
        """
        hits = FileObject.search().filter('term', md5=md5).execute()
        return hits[0].name if hits else None

    def addImage(self, img, optimize=True):
        # Lets perform image optimization here, some say quality=85 is good
        # enough. We use 90. Since resizing is better performed by OSS image
        # service, we do not do it here.
        if optimize:
            if img.format == 'GIF':
                img.format = 'JPEG'
            stream = io.BytesIO()
            img.save(stream, img.format, optimize=True, quality=90)
            data = stream.getvalue()

        # check duplication again on the optimized file
        md5 = hashlib.md5(data).hexdigest()
        fname = self.getByMd5(md5)
        if fname:
            return fname

        suffix = 'jpg' if img.format == 'JPEG' else img.format.lower()
        fname = '%s.%s' % (shortuuid.uuid(), suffix)

        bucket = getBucket(siteConfig.image_bucket)
        bucket.put_object(fname, data)

        fo = FileObject(
            name=fname,
            size=len(data),
            width=img.width,
            height=img.height,
            md5=md5)
        fo.save()
        return fname


class FileOjbectJSON(RpcBase, FileObjectBase):
    @jsonrpc_method(endpoint='rpc', method='fileobject.get.md5')
    def getFileObjectByMd5(self, md5):
        return self.getByMd5(b64decode(md5).hex())

    @jsonrpc_method(endpoint='rpc', method='fileobject.add')
    def addFileObject(self, data):
        """
        Upload the file object to OSS. For now we only accept images.

        - `data`: Content of the data to add as base64 encoded binary

        Returns the name of the uploaded object.
        """
        data = b64decode(data)
        md5 = hashlib.md5(data).hexdigest()

        # first check duplication on the original file
        fname = self.getFileObjectByMd5(md5)
        if fname:
            return fname

        try:
            img = PIL.Image.open(io.BytesIO(data))
        except OSError:
            raise RPCUserError('该文件不是图片格式。')

        if img.format not in ('JPEG', 'PNG', 'GIF'):
            raise RPCUserError('只支持jpg、png、gif格式的图片。')

        return self.addImage(img)


@view_config(route_name='upload')
class CKEImageUploader(FileObjectBase):
    """
    This handler accepts image upload from CKEditor for use in articles.　The
    image is looked up and store the same as images used in order attachments
    and case libraries.
    """

    __template__ = """
<script type="text/javascript">
    window.parent.CKEDITOR.tools.callFunction("{funcNum}", "{fileUrl}", "{data}");
</script>"""

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def _doUpload(self, file, ret):
        try:
            img = PIL.Image.open(file.file)
        except OSError:
            ret['data'] = '无法识别图片格式。'
            return

        if img.format not in ('JPEG', 'PNG', 'GIF'):
            ret['data'] = '只支持jpg、png、gif格式的图片。'
            return

        fname = FileObjectBase.addImage(self, img)
        ret['fileUrl'] = urljoin(siteConfig.image_url, fname)

    def __call__(self):
        f = self.request.params['upload']
        ret = {
            'funcNum': self.request.params['CKEditorFuncNum'],
            'fileUrl': '',
            'data': ''
        }

        # Note the return result is changed in the function!!!
        self._doUpload(f, ret)

        return Response(
            body=self.__template__.format(**ret)
        )
