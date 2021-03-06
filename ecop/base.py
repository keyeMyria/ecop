import json

from pyramid.httpexceptions import HTTPForbidden
from pyramid.csrf import check_csrf_token
from pyramid_rpc.jsonrpc import JsonRpcError

from hm.lib.config import siteConfig
from webmodel.base import DBSession


class RPCClientVersionError(JsonRpcError):
    """ Client version is lower than the api version """
    code = -300
    message = 'Client version mismatch'


class RpcBase(object):
    """
    Implements request authentication for all RPC methods except for
    'wechat.jssdk.config'
    """

    def __init__(self, request):
        # common class variables
        self.request = request
        self.sess = DBSession()

        body = request.body.decode('utf8')
        method = json.loads(body)['method']

        if request.is_weixin and method == 'wechat.jssdk.config':
            return

        # Step 1: check for valid session
        #
        # For any rpc request from a client which does not declare itself
        # as bot, a proper session must be present. Otherwise we block it
        if not request.is_bot and (
                not request.session or request.session.new):
            # request.log(action='REJECT_RPC', title='RPC no valid session',
            #    payload=body[:300])
            raise HTTPForbidden()

        # Step 2: check for valid csfr
        #
        # We are not using the csrf checking mechanism of view predicate
        # provided by pyramid since it does not allow us to block the
        # malicious IP and log the event.
        if not check_csrf_token(request, raises=False):
            # request.log(action='REJECT_RPC', title='RPC bad csrf token',
            #    payload=body[:300])
            raise HTTPForbidden()

        version = request.headers.get('X-Client-Version')
        if version and version != siteConfig.version:
            raise RPCClientVersionError()


class DocBase(object):
    """
    Base class for request authentication for downloading generated PDF
    files like order.
    """

    def __init__(self, context, request):  # pylint: disable=W0613
        self.sess = DBSession()
        self.request = request

        if not request.authenticated:
            raise HTTPForbidden()

        if 'token' not in request.params:
            raise HTTPForbidden()

        if request.session.get_csrf_token() != request.params['token']:
            raise HTTPForbidden()
