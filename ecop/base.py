from pyramid.httpexceptions import HTTPForbidden
from pyramid.csrf import check_csrf_token

from hm.lib.config import siteConfig
from webmodel.base import DBSession
from weblibs.jsonrpc import RPCUserError


class RpcBase(object):
    """ Implements request authentication """
    def __init__(self, request):
        # common class variables
        self.request = request
        self.sess = DBSession()

        # Step 1: check for valid session
        #
        # For any rpc request from a client which does not declare itself
        # as bot, a proper session must be present. Otherwise we treat it
        # as an attack and will block the ip address
        if not request.is_bot and (
            not request.session or request.session.new):
            #request.log(action='REJECT_RPC', title='RPC no valid session',
            #    payload=body[:300])
            raise HTTPForbidden()

        # Step 2: check for valid csfr
        #
        # We are not using the csrf checking mechanism of view predicate
        # provided by pyramid since it does not allow us to block the
        # malicious IP and log the event.
        if not check_csrf_token(request, raises=False):
            #request.log(action='REJECT_RPC', title='RPC bad csrf token',
            #    payload=body[:300])
            raise HTTPForbidden()

        version = request.headers.get('X-Client-Version')
        if version and version != siteConfig.version:
            raise RPCUserError('ERP版本已更新，请重新登录。')


class DocBase(object):
    """
    Base class for request authentication for downloading generated PDF
    files like order or shipment documents.
    """

    def __init__(self, context, request): #pylint: disable=W0613
        self.sess = DBSession()
        self.request = request

        if not request.authenticated:
            raise HTTPForbidden()

        if 'token' not in request.params:
            raise HTTPForbidden()

        if request.session.get_csrf_token() != request.params['token']:
            raise HTTPForbidden()
