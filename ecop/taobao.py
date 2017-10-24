""" The module supports importing the item images and item descriptions from
an existing tmall item into an existing homemaster item.

Since existing tmall items have widely varying quality standards, the
restrictions applied to acceptable images are somewhat relaxed:

 * For item images, the minimal size is lowered to 600x600. Images smaller than
   this are simply omitted.
 * For description images, only the lower bound of the height / width ratio
   is checked
 * Description images of width 750px are accepted and are automatically resized
   to 790px

When importing item description, the following rules apply:

 * Only description images are imported. Html is omitted
 * Any module not in __desc_module_order__ are discarded

"""
import io
import re
from urllib.parse import urlparse
from json import loads
import requests
import PIL.Image
from bs4 import BeautifulSoup

from pyramid_rpc.jsonrpc import jsonrpc_method

from hm.lib.config import siteConfig

from webmodel.item import Item, __desc_module_order__
from webmodel.resource import Image
from weblibs.jsonrpc import RPCUserError
from weblibs.oss import getBucket

from .image import ImageJSON
from .item import ItemJSON


def parseTmall(html):
    """ Helper function that parses the html body of the item url and returns
    a list of item images and item description modules as:

      {
        images: [url, url ...],
        modules: {
            mid1: [(name, url), (name, url) ...]
            mid2: ...
        }
      }
    """

    soup = BeautifulSoup(html, 'lxml')
    item_images = ['http:' + img['src'].split('_60x')[0]
                   for img in soup.select('ul.tb-thumb li img')]

    anchors = dict(
        [(m['anchorId'], m['moduleId']) for m in
         loads(re.search(r'"descAnchors":(\[.+\])', html).group(1))
         if m['type'] == 'cat_mod']
    )

    descUrl = 'http:' + re.search(r'"descUrl":"(.+?)"', html).group(1)
    ret = requests.get(descUrl)
    soupDesc = BeautifulSoup(
        re.search(r"var desc='(.+)';", ret.text).group(1), 'lxml')

    modules = {}
    mid = None
    module_images = []

    for el in soupDesc.body.children:
        # a new module starts
        if el.name == 'img' and \
                el.attrs.get('id', '').startswith('desc-module'):
            if module_images:
                modules[mid] = module_images
                module_images = []
            mid = anchors.get(el.attrs['id'])

            # we are encountering usr_mod which indicates the end
            # of standard category modules
            if not mid:
                break
            continue

        images = None
        if el.name == 'img':
            images = [el]
        elif hasattr(el, 'select'):
            images = el.select('img')

        if images:
            module_images.extend(
                [(img.attrs.get('alt'), img.attrs['src']) for img in images])

    if module_images:
        modules[mid] = module_images

    return {
        'images': item_images,
        'modules': modules
    }


class ImportExportJSON(ImageJSON, ItemJSON):
    def __init__(self, request):
        ImageJSON.__init__(self, request)

    def _uploadImage(self, img, data, title=None):
        if title:
            title = title[:30]
        image = Image(title=title)
        self.updateImageAttr(image, img, data)
        self.sess.add(image)
        self.sess.flush()  # flush to get the image id

        bucket = getBucket(siteConfig.image_bucket)
        bucket.put_object(image.fileName, data)
        return image

    @jsonrpc_method(endpoint='rpc', method='item.download.taobao')
    def download(self, itemId, url):
        host = urlparse(url).netloc
        if host == 'item.taobao.com':
            raise RPCUserError('不支持从集市店铺导入商品描述。')
        elif host != 'detail.tmall.com':
            raise RPCUserError('商品链接不正确。')

        item = self.sess.query(Item).get(itemId)
        assert item, 'Invalid itemId'

        ret = requests.get(url)
        if not ret.ok:
            raise RPCUserError('链接访问失败，请确定商品链接是否正确。')

        itemInfo = parseTmall(ret.text)
        #
        # Processing item image
        #
        imageIds = []
        for imgurl in itemInfo['images']:
            image = None
            ret = requests.get(imgurl)
            data = ret.content
            if not ret.ok or ret.headers['Content-Type'] not in \
                    ('image/jpeg', 'image/png', 'image/gif'):
                continue

            image = self.findImage(data)
            if not image:
                img = PIL.Image.open(io.BytesIO(data))
                if img.width < 600 and img.height < 600:
                    continue
                image = self._uploadImage(img, data)
            imageIds.append(image.imageId)

        if imageIds:
            self.setImages(item, imageIds)

        modules = {}
        for (mid, mimages) in itemInfo['modules'].items():
            if mid not in __desc_module_order__:
                continue

            imageIds = []
            for (title, url) in mimages:
                image = None
                ret = requests.get(url)
                data = ret.content
                if not ret.ok or ret.headers['Content-Type'] not in \
                        ('image/jpeg', 'image/png', 'image/gif'):
                    continue

                image = self.findImage(data)
                if not image:
                    img = PIL.Image.open(io.BytesIO(data))
                    if img.width < 750 or img.height / img.width < 0.3:
                        continue
                    if img.width != 790:
                        fmt = img.format  # after resize, format would be lost
                        img = img.resize(
                            (790, int(790 / img.width * img.height)),
                            PIL.Image.LANCZOS)
                        img.format = fmt
                        stream = io.BytesIO()
                        img.save(stream, img.format)
                        data = stream.getvalue()
                        image = self.findImage(data)
                        if not image:
                            image = self._uploadImage(img, data, title)
                    else:
                        image = self._uploadImage(img, data, title)

                imageIds.append(image.imageId)

            if imageIds:
                modules[mid] = imageIds

        if modules:
            item.descriptionModules = modules
