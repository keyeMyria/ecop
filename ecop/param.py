from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel import getParameter, Brand, Party

from .base import RpcBase


class ParamJSON(RpcBase):
    @jsonrpc_method(endpoint='rpc', method='param.get')
    def getParam(self, name):
        param = getParameter(name)
        return [{'id': k, 'text': v} for (k, v) in param.items()]

    @jsonrpc_method(endpoint='rpc', method='brand.get')
    def getBrands(self):
        brands = self.sess.query(Brand).order_by(Brand.dispOrder).all()
        return [{'id': b.brandId, 'brandName': b.brandName} for b in brands]

    @jsonrpc_method(endpoint='rpc', method='supplier.get')
    def getSuppliers(self):
        suppliers = self.sess.query(Party).\
            filter(Party.partyType == 'V').order_by('party_id').all()
        return [{'id': s.partyId, 'text': s.partyName} for s in suppliers]
