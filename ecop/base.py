import pickle

from pyramid.view import view_config
from pyramid.response import Response
from pyramid.httpexceptions import HTTPForbidden

from hm.lib.config import siteConfig
from weblibs.redis import RedisConn
from weblibs.jsonrpc import RPCNotAllowedError, RPCUserError
from weblibs.sqlalchemy import DBSession

from webmodel import Party


class RpcBase(object):
    """ Implements request authentication """
    def __init__(self, request):
        #
        # TODO: A quick and dirty way to bypass wechat user authentication
        #
        if not request.is_weixin:
            token = request.headers.get('Authenticity-Token')
            if not token:
                raise RPCNotAllowedError('无权访问，请登录。')

            conn = RedisConn()
            key = 'ecop|rpctoken:%s' % token
            user = conn.get(key)
            if not user:
                raise RPCNotAllowedError('您的当前会话已超时,请重新登录。')

            version = request.headers.get('X-Client-Version')
            if version and version != siteConfig.version:
                raise RPCUserError('ERP版本已更新，请重新登录。')

            request.user = pickle.loads(user)

            ttl = conn.ttl(key)
            # if time since last access is more than 5 minutes
            if int(siteConfig.auth_token_timeout) - ttl > 5 * 60:
                conn.expire(key, int(siteConfig.auth_token_timeout))

        # common class variables
        self.request = request
        self.sess = DBSession()


class DocBase(object):
    """ Base class for request authentication for downloading generated PDF
    files like order or shipment documents. """

    def __init__(self, context, request):
        self.sess = DBSession()
        self.request = request

        try:
            uid = int(request.params['uid'])
            user = self.sess.query(Party).get(uid)
        except Exception:
            raise HTTPForbidden()
        if not user:
            raise HTTPForbidden()

        if 'token' not in request.params:
            raise HTTPForbidden()

        conn = RedisConn()
        user = conn.get('ecop|rpctoken:%s' % request.params['token'])
        if not user:
            raise HTTPForbidden()
        user = pickle.loads(user)
        if user.partyId != uid:
            raise HTTPForbidden()


@view_config(route_name='health_check')
def health_check(request):
    """ ecop runs behind the aliyun load balancing service, which performs
    frequent health check using the HEAD method to /rpc.

    Note the response to HEAD shall contain no body"""
    return Response(status_code=200)
