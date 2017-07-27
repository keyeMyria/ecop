import time
from hashlib import sha1
from uuid import uuid4
from collections import OrderedDict
import logging

from pyramid_rpc.jsonrpc import jsonrpc_method
from weblibs.weixin import client as wc

from .base import RpcBase

logger = logging.getLogger('weixin')


class WeixinJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='wechat.jssdk.config')
    def getConfigParam(self, url):
        od = OrderedDict()
        od['jsapi_ticket'] = wc.jsapiTicket
        od['noncestr'] = uuid4().hex
        od['timestamp'] = '%d' % time.time()
        od['url'] = url.split('#')[0]
        sign_str = '&'.join(['%s=%s' % (k, v) for (k, v) in od.items()])

        ret = {
            'appId': wc.appId,
            'timestamp': od['timestamp'],
            'nonceStr': od['noncestr'],
            'signature': sha1(bytes(sign_str, 'utf8')).hexdigest()
        }
        logger.debug('Request jssdk config for %s, returns %s' % (url, ret))
        return ret
