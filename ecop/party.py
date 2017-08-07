from sqlalchemy import or_

from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel import Party
from weblibs.jsonrpc import RPCUserError, marshall

from .base import RpcBase


class PartyJSON(RpcBase):

    @staticmethod
    def partyData(party):
        fields = ['partyId', 'login', 'partyName', 'mobile', 'partyType']
        return marshall(party, fields)

    @jsonrpc_method(endpoint='rpc', method='party.search')
    def searchParty(self, query=None, partyId=None):
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

        return [self.partyData(u) for u in users]

    @jsonrpc_method(endpoint='rpc', method='party.create')
    def createParty(self, data):
        """ Create a new party. Default type is customer. Now only mobile is
        requried """
        assert data.get('mobile')

        party = self.sess.query(Party)\
            .filter_by(mobile=data['mobile']).one_or_none()
        if party:
            raise RPCUserError('该手机号对应的用户已存在！')

        party = Party(
            mobile=data['mobile'],
            partyName=data['partyName']
        )

        self.sess.add(party)
        self.sess.flush()
        return self.partyData(party)
