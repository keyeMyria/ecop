from decimal import Decimal
from bs4 import BeautifulSoup
from sqlalchemy import or_, and_, not_, func
from sqlalchemy.orm import eagerload

from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.jsonrpc import marshall, RPCUserError, validateSchema

from webmodel.consts import ITEM_STATUS, RESOURCE_TYPE
from webmodel.item import Item, ItemGroup, ItemImage, BomItem, ModuleSorter
from webmodel.resource import Image, Resource
from webmodel.param import getParameterText

from .category import categoryFactory
from .base import RpcBase


class ItemJSON(RpcBase):
    def __init__(self, request):
        RpcBase.__init__(self, request)

    def replaceLinks(self, html):
        """ replace image link with cdn image and reference to item_id with
        corresponding item url """
        soup = BeautifulSoup(html, 'html.parser')

        # replacing image link with corresponding CDN ones.
        for img in soup.findAll(
            lambda tag: tag.has_attr('image_id') and tag.name == 'img',
            recursive=True
        ):
            image = self.sess.query(Image).get(int(img['image_id']))
            img['src'] = image.url
            del img['image_id']

        return str(soup)

    @jsonrpc_method(endpoint='rpc', method='item.search')
    def searchItem(self, text=None, brandId=None, catId=None, status=None,
                   isSku=False, assortmentOnly=False):
        """
        Search items based on given conditions. When status is not given,
        no inactive items will be returned. To search for items of all status,
        set status to 'all'.

        Returns a list or found Items. If not found, an empty list is returned.
        """
        query = self.sess.query(Item)

        if not (catId or text or brandId):
            raise RPCUserError('请指定搜索条件!')

        if text and Item.IsItemNumber(text):
            query = query.filter(Item.itemId.in_((int(text),)))
        else:
            if catId:
                cs = categoryFactory()
                node = cs.get(int(catId))
                query = query.filter(Item.primaryCategoryId.in_(
                    [n.key for n in node.leafNodes]))
            if text:
                or_clause = [
                    Item.itemName.op('ilike')('%%%s%%' % text),
                    Item.specification.op('ilike')('%%%s%%' % text),
                    Item.model.op('ilike')('%%%s%%' % text)
                ]
                query = query.filter(or_(*or_clause))

            if brandId:
                query = query.filter_by(brandId=brandId)

            if isSku:
                query = query.filter_by(isSku=isSku)

            if assortmentOnly:
                cs = categoryFactory()
                query = query.filter(not_(Item.primaryCategoryId.in_(
                    [n.key for n in cs.get(1800).leafNodes])))

            if status is None:
                query = query.filter(Item.itemStatus != ITEM_STATUS.INACTIVE)
            elif isinstance(status, int):
                query = query.filter_by(itemStatus=status)
            elif status == 'all':
                pass
            else:
                raise ValueError('Invalid status parameter')

        items = query.all()

        fields = ['itemId', 'itemName', 'specification', 'model',
                  'sellingPrice', 'sellingPriceB', 'purchasePrice',
                  'itemStatus', 'isSku', 'unitName', 'primaryCategoryId',
                  'unitId', 'brandId', 'countryId', 'weight']
        return [marshall(i, fields) for i in items]

    def setItemStatus(self, item, status):
        # check existence of available image
        if status == ITEM_STATUS.ONLINE:
            if item.primaryCategoryId == 1810:
                raise RPCUserError('待审核商品%d不能上线！' % item.itemId)

            if not (item.sellingPrice and item.sellingPriceB):
                raise RPCUserError('不能上线无售价商品！')

            if not item.mainImageFile and (
                not item.itemGroup or
                not item.itemGroup.shareImage or
                not self.sess.query(Item)
                    .get(item.itemGroup.items[0]).mainImageFile
            ):
                raise RPCUserError('商品%d没有主图不能上线！' % item.itemId)

        item.itemStatus = status

    def updateItemAttribute(self, item, key, value):
        """ Dispatches special updates to different methods for better code
        organization """
        if getattr(item, key) == value:
            return

        if key == 'itemStatus':
            self.setItemStatus(item, value)
        if key in ('sellingPrice', 'purchasePrice', 'sellingPriceB'):
            setattr(item, key, Decimal('%.2f' % value))
        else:
            setattr(item, key, value)

    @jsonrpc_method(endpoint='rpc', method='item.upsert')
    def updateItem(self, records):
        """ Update given attributes of one or multiple items.
        Records is a (list of) dictionary containing 'itemId' and all key value
        pairs of item attributes to be modified.

        If itemId is a string, then a new item is added.

        Note the boms and images relationship of an item is also updated using
        this method. Just pass 'boms' and 'images' attribute as required by
        setBom and setImages.
        """
        if not isinstance(records, list):
            records = [records]

        for rec in records:
            if isinstance(rec['itemId'], int):
                item = self.sess.query(Item).get(rec['itemId'])
                assert item, 'Item id %d is not found' % rec['itemId']
            else:
                item = Item()
                self.sess.add(item)
                del rec['itemId']

            for (k, v) in rec.items():
                if k not in ('itemId', 'boms', 'images', 'descriptionModules'):
                    self.updateItemAttribute(item, k, v)
            if 'descriptionModules' in rec:
                # TODO: maybe we shall ensure that all resources are existing
                # before commiting the change, since there is no other way
                # to enforce the foreign key constraint for jsonb list.
                # Or we could use a database trigger with a helper table like
                # item_resource.
                item.descriptionModules = rec['descriptionModules'] or None

            validateSchema(item)

            # getting itemId for new item
            self.sess.flush()

            if 'boms' in rec:
                self.setBom(item, rec['boms'])
            if 'images' in rec:
                self.setImages(item, rec['images'])

    @jsonrpc_method(endpoint='rpc', method='item.sku.search')
    def searchSku(self, text):
        """ Search sku with the given text. Used only by the `skuinput` widget

        If text is 8-digits number, it will be interpreted first as item id.
        Then we will search for items with text as the exact model_no.
        If there is an exact match, that match will be returned.
        If not found, we will search items with text as starting model_no.
        If still not found, search for items whose model_no or item_name
        contains the given text.

        Note that inactive items will not be returned. """

        ret = set()
        query = self.sess.query(Item).filter(
            and_(Item.itemStatus != ITEM_STATUS.INACTIVE, Item.isSku == True))

        if len(text) < 3:
            raise RPCUserError('商品型号最少长度为３个字符。')

        # find an exact match for model. Could be multiple items
        items = query.filter(func.upper(Item.model) == text.upper()).all()

        # if nothing found yet, match starting string of model
        if not items:
            items = query.filter(
                func.upper(func.substr(Item.model, 1, len(text))) ==
                text.upper()
            ).limit(11).all()

        if not items:
            items = query.filter(or_(
                Item.itemName.op('ilike')('%%%s%%' % text),
                Item.specification.op('ilike')('%%%s%%' % text),
                Item.model.op('ilike')('%%%s%%' % text))).limit(11).all()

        if len(items) > 10:
            return []

        if items:
            for i in items:
                ret.add(i)

        if Item.IsItemNumber(text):
            item = self.sess.query(Item).get(text)
            if item:
                ret.add(item)

        return [{
            'itemId': i.itemId,
            'itemName': i.itemName,
            'model': i.model,
            'specification': i.specification,
            'unitId': i.unitId,
            'weight': i.weight
        } for i in ret]

    @jsonrpc_method(endpoint='rpc', method='item.bom.get')
    def getBom(self, itemId):
        item = self.sess.query(Item).options(eagerload('boms')).get(itemId)
        return [{
            'pkey': '%d%d' % (sku.itemId, sku.componentItemId),
            'itemId': sku.componentItemId,
            'itemName': sku.item.itemName,
            'specification': sku.item.specification,
            'model': sku.item.model,
            'weight': sku.item.weight,
            'quantity': sku.quantity
        } for sku in item.boms]

    def setBom(self, item, bomItems):
        """ Update the boms attribute of an item.

        The `bomItems` argument is a **list** of [item_id, quantity]
        which describes completely how the item is composed of. Set it to
        an empty list to remove bom if any were present.
        """
        assert isinstance(bomItems, list), 'bomItems must be a list'

        if len(bomItems) == 1 and bomItems[0][1] == 1:
            raise RPCUserError('部件清单不能只有一个数量为１的项目。')

        assert item.itemId not in [i[0] for i in bomItems], \
            'Component item can not be the item itself'

        # check if item is already a component of another
        bi = self.sess.query(BomItem).filter(
            BomItem.componentItemId == item.itemId).first()
        if bi:
            raise RPCUserError('该商品已经是商品%d的部件。' % bi.itemId)

        weight = 0
        for (iid, quantity) in bomItems:
            ci = self.sess.query(Item).get(iid)
            assert ci.isSku, 'Item %d is not a sku' % iid
            assert quantity, 'Quantity can not be 0'
            if not ci.weight:
                # =============================================================
                # once set to None, weight remains None, since it
                # means some component has unknown weight
                # =============================================================
                weight = None
            elif weight is not None:
                weight += ci.weight * quantity

        # remove all exisitng bom first if any is there
        if not item.isSku:
            item.boms.clear()
            item.isSku = True

        # now set the new bom
        for (idx, (iid, quantity)) in enumerate(bomItems):
            item.boms.append(BomItem(itemId=item.itemId, componentItemId=iid,
                                     quantity=quantity, componentOrder=idx))
            item.isSku = False
        item.weight = weight

    @jsonrpc_method(endpoint='rpc', method='item.images.get')
    def getImages(self, itemId):
        item = self.sess.query(Item).options(eagerload('images')).get(itemId)
        return [{
            'imageId': img.imageId,
            'title': img.image.title,
            'width': img.image.width,
            'height': img.image.height,
            'url': img.image.url
        } for img in item.images]

    def setImages(self, item, imageIds):
        """ Update the item image association. Note that for simplicity we use
        this function for all the add, insert, move, delete of item images.
        Just pass in a list of images that should be the correct one and we
        will set it.

        Note this function has nothing to do images used by the item's
        description modules"""

        # check that the main item image is square
        for iid in imageIds:
            image = self.sess.query(Image).get(iid)
            if abs(image.width - image.height) > 1:
                raise RPCUserError('商品主图必须是正方形。')

        if item.images:  # this is necessary to load images first
            item.images.clear()

        if imageIds:
            for (idx, iid) in enumerate(imageIds):
                item.images.append(
                    ItemImage(itemId=item.itemId, imageId=iid, imageOrder=idx))
            mainImage = self.sess.query(Image).get(imageIds[0])
            item.mainImageFile = '%s.%s' % \
                (mainImage.imageId, mainImage.format)
        else:
            item.mainImageFile = None

    @jsonrpc_method(endpoint='rpc', method='item.modules.get')
    def getModules(self, itemId):
        """ Returns the tree data for description modules in the format
            [{id: 5, text: '商品情景', children: [
                ｛id: 10043046, text: 'M22061', type: 1, leaf: True}
                ｛id: 10043067, text: 'Resource File Name',
                  type: ResourceType, leaf: True
                 }
                ...
             ]},
             {id: 22, text: '模块名称', children: [...]}
            ]
        """
        ret = []
        if not isinstance(itemId, int):
            return {}

        item = self.sess.query(Item).get(itemId)

        modules = item.descriptionModules

        if modules:
            modules = list(modules.items())
            modules.sort(key=lambda m: ModuleSorter(int(m[0])))

            for (mid, resources) in modules:
                mid = int(mid)
                children = []
                for rid in resources:
                    resource = self.sess.query(Resource).get(rid)
                    children.append({
                        'rid': rid,
                        'text': resource.title,
                        'type': resource.resourceType,
                        'format': resource.format,
                        'leaf': True
                    })
                    if resource.resourceType == RESOURCE_TYPE.IMAGE:
                        children[-1]['url'] = resource.url
                    else:
                        children[-1]['content'] = \
                            self.replaceLinks(resource.content)

                ret.append({
                    'id': mid,
                    'text': getParameterText('ModuleType', mid),
                    'children': children,
                    'expanded': True,
                    'allowDrag': False
                })
        return ret


class ItemGroupJSON(RpcBase):
    """ This class collects JSON-RPC methods used for management of item groups,
    i.e. the CRUD operations """

    def __init__(self, request):
        RpcBase.__init__(self, request)

    @jsonrpc_method(endpoint='rpc', method='item.group.get')
    def get(self, itemId):
        """
        Return the item group data for the item group to which the given
        itemId belongs to.
        """
        item = self.sess.query(Item).get(itemId)
        assert item, 'Item not found'

        if not item.itemGroupId:
            return

        ig = self.sess.query(ItemGroup).get(item.itemGroupId)
        if not ig:
            return

        ret = {
            'header': marshall(ig, ['itemGroupId', 'groupItemName',
                'groupImageId', 'groupBy', 'shareDescription', 'shareImage'])
        }

        if ig.groupBy == 'L':
            ret['header']['labelName'] = ig.groupCriteria['labelName']

            items = []
            for idx, iid in enumerate(ig.items):
                item = self.sess.query(Item).get(iid)
                items.append({
                    'label': ig.groupCriteria['labels'][idx],
                    'thumb': ig.groupCriteria['thumbs'][idx],
                    'itemId': iid,
                    'itemName': item.itemName,
                    'specification': item.specification,
                    'model': item.model,
                    'sellingPrice': item.sellingPrice,
                    'itemStatus': item.itemStatus
                })

        ret['items'] = items
        return ret

    def updateContent(self, ig, content):
        for f in ('groupBy', 'shareDescription', 'shareImage',
                  'groupItemName', 'groupImageId'):
            setattr(ig, f, content.get(f))

        # check if any item is already a member of other group
        iids = [i['itemId'] for i in content['items']]
        items = self.sess.query(Item).filter(and_(
            Item.itemId.in_(iids),
            Item.itemGroupId != ig.itemGroupId)).all()
        if items:
            raise RPCUserError('商品%d已定义商品组合' % items[0].itemId)

        firstItem = self.sess.query(Item).get(iids[0])

        if ig.shareImage and not firstItem.mainImageUrl:
            raise RPCUserError('商品组合第一个商品没有主图')

        if ig.shareDescription and not firstItem.descriptionModules:
            raise RPCUserError('商品组合第一个商品没有描述')

        if ig.groupImageId and not \
            self.sess.query(ItemImage).filter(
                ItemImage.imageId == ig.groupImageId).all():
            raise RPCUserError('图片id不存在或不是商品的主图')

        if ig.groupBy == 'L':
            if not content['labelName'].strip():
                raise RPCUserError('标签名称不能为空')

            ig.groupCriteria = {
                'labelName': content['labelName'],
                'labels': [i['label'] for i in content['items']],
                'thumbs': [i['thumb'] for i in content['items']]
            }

            ig.items = [i['itemId'] for i in content['items']]

    @jsonrpc_method(endpoint='rpc', method='item.group.update')
    def update(self, content):
        """ Note the itemGroupId to be updated must be contained in the content
        dictionary """
        itemGroupId = content.pop('itemGroupId')
        ig = self.sess.query(ItemGroup).get(itemGroupId)
        self.updateContent(ig, content)

    @jsonrpc_method(endpoint='rpc', method='item.group.add')
    def add(self, content):
        ig = ItemGroup()
        self.updateContent(ig, content)
        self.sess.add(ig)
        self.sess.flush()
        return ig.itemGroupId

    @jsonrpc_method(endpoint='rpc', method='item.group.delete')
    def delete(self, itemGroupId):
        ig = self.sess.query(ItemGroup).get(itemGroupId)
        if ig:
            self.sess.query(ItemGroup).\
                filter(ItemGroup.itemGroupId == itemGroupId).delete()
