import json
import uuid

from hm.lib.taobao import TaobaoClient

from .region import regionFactory


class AppAccount(object):
    pass


# cainiao client uses the Open Taobao app key from the account of main shop
shop = AppAccount()
shop.appKey = '12450185'
shop.appSecret = 'c9edbd18378b91418ba1213e5ca61c3e'
shop.sessionToken = '6102410cbc8e7805e81d6fa907a8e2d59e93145d2bd953321571889'
shop.userId = '21571889'

tc = TaobaoClient(shop)

__std_templates__ = None
__usr_templates__ = None


def getStandardTemplateUrl(shipperCode):
    """ Find the standard template url given the shipper code """
    global __std_templates__

    if not __std_templates__:
        ret = tc.makeRequest('cainiao.cloudprint.stdtemplates.get')
        __std_templates__ = ret['result']['datas']['standard_template_result']

    for i in __std_templates__:
        if i['cp_code'] == shipperCode:
            break

    for t in i['standard_templates']['standard_template_do']:
        if t['standard_template_name'].endswith('标准模板'):
            return t['standard_template_url']


def getCustomAreaUrl(shipperCode):
    """
    Returns the custom area url for use in printing

    Theoretically there could be multiple customer area template for a given
    shipper. However, we are not using this and the function returns only the
    first one.
    """
    global __usr_templates__

    if not __usr_templates__:
        ret = tc.makeRequest('cainiao.cloudprint.mystdtemplates.get')
        __usr_templates__ = ret['result']['datas']['user_template_result']

    for i in __usr_templates__:
        if i['cp_code'] == shipperCode:
            break

    user_template_id = i['user_std_templates'][
        'user_template_do'][0]['user_std_template_id']

    ret = tc.makeRequest(
        'cainiao.cloudprint.customares.get',
        template_id=user_template_id
    )

    return ret['result']['datas']['custom_area_result'][0]['custom_area_url']


def getWaybill(shipment):
    """ Send new waybill request to Cainiao and return the print data needed to
    print the waybill """

    regions = regionFactory()
    region = regions.get(shipment.regionCode)

    params = {
        'cp_code': shipment.shipperCode,

        'sender': {
            'address': {
                'city': '上海市',
                'detail': '龙吴路5287号二楼1号库',
                'district': '闵行区',
                'province': '上海',
            },
            'name': '大管家家居',
            'phone': '02134240987'
        },

        'trade_order_info_dtos': [{
            'object_id': 1,
            'order_info': {
                'order_channels_type': 'OTHERS',
                'trade_order_list': shipment.shipmentId
            },
            'package_info': {
                'id': str(uuid.uuid4())[:8],
                'items': [{
                    'count': 1,
                    'name': '家居产品'
                }]
            },
            'recipient': {
                'address': {
                    'province': region.parent.parent.label,
                    'city': region.parent.label,
                    'district': region.label,
                    'detail': shipment.streetAddress
                },
                'mobile': shipment.recipientMobile,
                'phone': shipment.recipientPhone,
                'name': shipment.recipientName
            },
            'template_url': getStandardTemplateUrl(shipment.shipperCode),
            'user_id': shop.userId
        }]
    }

    ret = tc.makeRequest(
        'cainiao.waybill.ii.get',
        param_waybill_cloud_print_apply_new_request=params)

    printData = json.loads(
        ret['modules']['waybill_cloud_print_response'][0]['print_data']
    )
    printData['customAreaURL'] = getCustomAreaUrl(shipment.shipperCode)
    return printData


def updateWaybill(shipperCode, documentId):
    """ This is only used for reprinting a waybill as we currently do not allow
    modification to shipment waybill """

    ret = tc.makeRequest(
        'cainiao.waybill.ii.update',
        param_waybill_cloud_print_update_request={
            'cp_code': shipperCode,
            'waybill_code': documentId
        }
    )

    printData = json.loads(ret['print_data'])
    printData['customAreaURL'] = getCustomAreaUrl(shipperCode)
    return printData


def cancelWaybill(shipperCode, documentId):
    ret = tc.makeRequest('cainiao.waybill.ii.cancel', cp_code=shipperCode,
                         waybill_code=documentId)
    return ret['cancel_result']
