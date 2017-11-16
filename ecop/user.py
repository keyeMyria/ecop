import uuid
import pickle

from pyramid_rpc.jsonrpc import jsonrpc_method

from hm.lib.config import siteConfig

from webmodel.base import DBSession
from webmodel.party import Party
from weblibs.jsonrpc import RPCNotAllowedError, RPCUserError
from weblibs.redis import RedisConn


@jsonrpc_method(endpoint='rpc', method='auth.login')
def userLogin(request, login, password): # pylint: disable=W0613
    """
    Verify account password and create authentication token.

    This is the only rpc method that does not subclass RpcBase for it occurs
    before a current user session is established
    """
    sess = DBSession()
    user = sess.query(Party).filter_by(login=login).first()

    if not user or not user.verifyPassword(password):
        raise RPCUserError('登录失败，请检查用户名和密码！')

    # Only those with defined permission are allowed
    if not user.extraData or not user.extraData['permission']:
        raise RPCNotAllowedError('您无权登录大管家ERP。')

    token = uuid.uuid4().hex
    # after user is authenticated, we cache the user object in redis
    sess.expunge_all()  # detach from session
    conn = RedisConn()
    conn.setex('ecop|rpctoken:%s' % token,
                int(siteConfig.auth_token_timeout),
                pickle.dumps(user))

    return {
        'partyId': user.partyId,
        'token': token,
        'permission': user.extraData['permission']
    }
