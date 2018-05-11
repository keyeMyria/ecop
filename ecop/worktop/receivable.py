from datetime import date, timedelta
import os.path

from isoweek import Week
from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.view import view_config
from pyramid.response import Response

from weblibs.camunda import camundaClient as cc
from webmodel.consts import ORDER_STATUS, ORDER_SOURCE
from webmodel.order import SalesOrder

from ecop.base import DocBase


@view_config(route_name='receivable')
class ReceivableList(DocBase):
    """
    Generates an account receivable reconciliation list for the specified
    payment period, which is given in the param `key` as either 'current' or
    'YYYYWww'
    """

    def join(self, *args):
        return ','.join([arg for arg in args if arg])

    def __call__(self):
        key = self.request.matchdict['key']
        if key == 'current':
            today = date.today()
            self.startDate = today - timedelta(today.isocalendar()[2] + 6)
        else:
            assert len(key) == 6 and key.isnumeric()
            year, week = int(key[:4]), int(key[4:])
            assert week <= 52 and year >= 2018 and year <= 2050
            self.startDate = Week(year, week).monday()

        self.endDate = self.startDate + timedelta(6)
        cal = self.startDate.isocalendar()
        self.docKey = f'{cal[0]}/{cal[1]}'

        self.orders = self.sess.query(SalesOrder).\
            filter_by(orderSource=ORDER_SOURCE.IKEA).\
            filter_by(orderStatus=ORDER_STATUS.COMPLETED).\
            filter(SalesOrder.completionDate >= self.startDate).\
            filter(SalesOrder.completionDate < self.endDate + timedelta(1)).\
            all()
        self.total = sum([o.amount for o in self.orders])

        for o in self.orders:
            ret = cc.makeRequest(
                '/history/process-instance', 'post',
                {'processInstanceBusinessKey': o.orderId},
                withProcessVariables=('storeId', ),
                processInstanceIdField='id', hoistProcessVariables=True
            )[0]
            o.storeId = ret['storeId']

        self.orders.sort(key=lambda o: (o.storeId, o.orderId))

        loader = TemplateLoader([os.path.dirname(__file__)])
        template = loader.load('receivable.pt')
        stream = template.generate(view=self)
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_disposition=f'filename="AR{self.docKey}.pdf"',
            content_length=len(body),
            body=body)
        return response
