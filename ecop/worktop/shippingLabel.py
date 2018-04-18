import os.path

import shortuuid
from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.view import view_config
from pyramid.response import Response

from weblibs.camunda import camundaClient as cc

from ecop.base import DocBase

@view_config(route_name='label')
class LabelView(DocBase):
    """
    Generate pdf document for shipping labels for selected orders. The url for
    the pdf document is of the form:

        https://erp.homemaster.cn/ikea/shippingLabel?orders=oid1,oid2,oid3...

    where oid is the ERP orderId, not IKEA externalOrderId. In each of the
    label is a QR-code encoding the following url:

        https://erp.homemaster.cn/ikea/shipOrder?orderId=xxx&pkgId=xxx

    where orderId is also the ERP orderId and pkgId is a string automatically
    generated using module shortuuid.
    """

    def __call__(self):
        assert 'orders' in self.request.params
        oids = self.request.params['orders'].split(',')
        assert oids

        labels = []
        for oid in oids:
            ret = cc.makeRequest(
                '/process-instance', 'post', {'businessKey': oid},
                withProcessVariables=(
                    'orderId', 'externalOrderId', 'factoryNumber',
                    'customerName', 'customerMobile', 'customerRegionCode',
                ),
                processInstanceIdField='id',
                hoistProcessVariables=True
            )
            pkgId = ret[0]['pkgId'] = shortuuid.uuid()
            ret[0]['labelUrl'] = f'{self.request.host_url}/ikea/shipOrder?' \
                f'orderId={oid}&pkgId={pkgId}'
            labels.append(ret[0])

        loader = TemplateLoader([os.path.dirname(__file__)])
        template = loader.load('shippingLabel.pt')
        stream = template.generate(labels=labels, view=self)
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_disposition='filename="labels.pdf"',
            content_length=len(body),
            body=body)
        return response
