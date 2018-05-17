import logging
import json
import pprint
import time

from pyramid_rpc.jsonrpc import jsonrpc_method

from .base import RpcBase

siteLogger = logging.getLogger(__name__)
logger = logging.getLogger('rpc')


class LoggingRPC(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='site.log')
    def log(self, message):
        if isinstance(message, dict):
            siteLogger.error(message)
        else:
            siteLogger.info(message)

# Following methods are log logged since they are not interesting
__omit_methods__ = (
    'auth.login', # for security reasons, do not log login request
    'regions.get',
    'category.get'
)

class rpclog_tween_factory(object):
    """
    For auditing purpose, log all rpc requests except the uninteresting ones
    """
    def __init__(self, handler, registry):  # pylint: disable=W0613
        self.handler = handler

    def __call__(self, request):
        start = time.time()
        response = self.handler(request)

        if request.is_xhr and request.path == '/rpc' and \
                response.status_code == 200:
            req = json.loads(request.body)

            if req['method'] not in __omit_methods__:
                logger.info('%s %s %s %s',
                    request.client_addr,
                    request.user.login if request.user else 'unknown',
                    req['method'],
                    pprint.pformat(req['params'])[:1000])
                ret = json.loads(response.body)
                ret = ret.get('error', ret.get('result'))
                logger.info('Response in %.3fs: %s', time.time() -
                            start, pprint.pformat(ret)[:1000])

        return response


def includeme(config):
    config.add_tween('ecop.logging.rpclog_tween_factory')
