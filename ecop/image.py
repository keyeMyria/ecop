import io
import hashlib
from base64 import b64decode
from urllib.parse import urljoin

import PIL.Image
from psd_tools import PSDImage

from pyramid_rpc.jsonrpc import jsonrpc_method
from pyramid.response import Response
from pyramid.view import view_config

from hm.lib.config import siteConfig

from webmodel import Image
from weblibs.jsonrpc import RPCUserError
from weblibs.oss import getBucket

from .base import RpcBase


def extractTextFromPSD(psd):
    """ Extract text from recursively from all visible layers of the psd file
    as one concatenated string """
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
        """ See if the image already exists in the dababase based on the md5
        finger print of the image data.

          - `data`: Binary data of the image

        Returns an `Image` object if the same image already exists, none
        otherwise.
        """
        fingerprint = hashlib.md5(data).digest()

        return self.sess.query(Image).filter_by(
            fingerPrint=fingerprint).one_or_none()

    def updateImageAttr(self, image, img, data):
        """ image: DB image, img: PIL image, data: binary image data """
        image.width, image.height = img.size
        image.format = 'jpg' if img.format == 'JPEG' else img.format.lower()
        image.fingerPrint = hashlib.md5(data).digest()

    def checkAndConvertImage(self, data, fname, imgType):
        """ Helper function that returns a **PIL.Image** object and the binary
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
                img = img.resize((w , h), PIL.Image.LANCZOS)
                out_img = PIL.Image.new('RGB', (out_size, out_size), 'white')
                out_img.paste(img, ((out_size - w) // 2, (out_size - h) // 2))
                modified = True
                img = out_img

        else:  # this is image for description
            if img.width < 790:
                raise RPCUserError('商品描述图片宽度最小为790。')
            if not (0.3 <= img.height / img.width <= 2):
                raise RPCUserError('商品描述图片高宽比(高度/宽度)必须在0.3-2之间。')
            if img.width > 790:
                img = img.resize((790, int(790 / img.width * img.height)),
                                 PIL.Image.LANCZOS)
                modified = True

        if modified:
            img.format = 'JPEG'
            stream = io.BytesIO()
            img.save(stream, img.format, quality=95)
            data = stream.getvalue()

        if len(data) > 2 * 1024 * 1024:
            raise RPCUserError('图片大小不能超过2MB。')

        return img, data, content

    @jsonrpc_method(endpoint='rpc', method='image.get.md5')
    def getImageByMd5(self, md5):
        """ Checks if an image with the given md5 already exists. If found,
        returns the found image, otherwise returns None """
        image = self.sess.query(Image).filter_by(
            fingerPrint=b64decode(md5)).one_or_none()
        return self.toJson(image) if image else None

    @jsonrpc_method(endpoint='rpc', method='image.add')
    def addImage(self, data, fname, imgType):
        """ Adds an image to the system.

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
            if fname:
                image.title = fname.split('.')[0]
            image.content = content
            self.sess.add(image)
            self.sess.flush()  # flush to get the image id

            bucket = getBucket(siteConfig.image_bucket)
            bucket.put_object(image.fileName, data)

        return self.toJson(image)

    @jsonrpc_method(endpoint='rpc', method='image.update')
    def updateImage(self, data, fname, imgType, imageId):
        """ Updates the **content** of an item image to the system.

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


upload_template = """
<script type="text/javascript">
    window.parent.CKEDITOR.tools.callFunction("{funcNum}", "{fileUrl}", "{data}");
</script>"""

@view_config(route_name='upload', renderer='upload.pt')
def uploadImage(request):
    """ This handler accepts image upload from CKEditor for use in articles """
    f = request.params['upload']
    ret = {
        'funcNum': request.params['CKEditorFuncNum'],
        'fileUrl': '',
        'data': ''
    }

    try:
        img = PIL.Image.open(f.file)

        if img.format in ('JPEG', 'PNG', 'GIF'):
            bucket = getBucket(siteConfig.image_bucket)
            md5 = hashlib.md5(f.value).hexdigest()
            fname = 'upload/%s.%s' % (md5, img.format.lower())
            if not bucket.object_exists(fname):
                bucket.put_object(fname, f.value)
            ret['fileUrl'] = urljoin(siteConfig.image_url, fname)
        else:
            ret['data'] = '只支持jpg、png、gif格式的图片。'
    except OSError:
        ret['data'] = '无法识别图片格式。'

    body = upload_template.format(**ret)
    return Response(
        body=body
    )
