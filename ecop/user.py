from sqlalchemy import or_
import uuid
import pickle

from pyramid_rpc.jsonrpc import jsonrpc_method

from hm.lib.config import siteConfig

from webmodel import Party
from weblibs.jsonrpc import RPCNotAllowedError, RPCUserError, marshall
from weblibs.redis import RedisConn
from weblibs.sqlalchemy import DBSession

from .base import RpcBase


@jsonrpc_method(endpoint='rpc', method='user.login')
def userLogin(request, login, password):
    """ Verify account password and create authentication token.

    This is the only rpc method that does not subclass RpcBase for it occurs
    before a current user session is established """
    sess = DBSession()
    user = sess.query(Party).filter_by(login=login).first()

    if user and user.verifyPassword(password):
        # Only staff and vendor are allowed
        if user.partyType not in ('S', 'V'):
            raise RPCNotAllowedError('您无权登录大管家ERP。')

        token = uuid.uuid4().hex
        # after user is authenticated, we cache the user object in redis
        sess.expunge_all()  # detach from session
        conn = RedisConn()
        conn.setex('ecop|rpctoken:%s' % token,
                   int(siteConfig.auth_token_timeout),
                   pickle.dumps(user),)

        fields = ['partyId', 'login', 'partyName', 'mobile', 'partyType']
        ret = marshall(user, fields)
        ret['token'] = token
        if user.extraData:
            ret['permission'] = user.extraData['permission']
        return ret

    raise RPCUserError('登录失败，请检查用户名和密码！')


class UserJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='user.search')
    def searchUser(self, query=None, partyId=None):
        if partyId:
            users = [self.sess.query(Party).get(partyId)]
        elif query:
            cond = or_(
                Party.partyName.op('ilike')('%%%s%%' % query),
                Party.login.op('ilike')('%%%s%%' % query))
            if query.isdigit():
                cond = or_(cond, Party.mobile.op('ilike')('%%%s%%' % query))
            users = self.sess.query(Party).filter(cond).limit(20).all()
        else:
            # it is possible for the CustomerPicker store to send query without
            # the query value
            return

        fields = ['partyId', 'login', 'partyName', 'mobile', 'partyType']
        return [marshall(u, fields) for u in users]
