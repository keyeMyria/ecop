from datetime import date, timedelta
import os.path

from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.view import view_config
from pyramid.response import Response

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

    def __init__(self, context, request):
        super(ReceivableList, self).__init__(context, request)
        today = date.today()

        key = request.matchdict['key']
        if key == 'current':
            self.startDate = today - timedelta(today.isocalendar()[2] + 6)
        else:
            assert len(key) == 6 and key.isnumeric()
            year, week = int(key[:4]), int(key[4:])
            assert week <= 52 and year >= 2018 and year <= 2050

        self.endDate = self.startDate + timedelta(6)
        cal = self.startDate.isocalendar()
        self.docKey = f'{cal[0]}/{cal[1]}'

        loader = TemplateLoader([os.path.dirname(__file__)])
        self.template = loader.load('receivable.pt')

    def join(self, *args):
        return ','.join([arg for arg in args if arg])

    @property
    def total(self):
        return sum([o.amount for o in self.orders])

    def __call__(self):
        self.orders = self.sess.query(SalesOrder).\
            filter_by(orderSource=ORDER_SOURCE.IKEA).\
            filter_by(orderStatus=ORDER_STATUS.COMPLETED).\
            filter(SalesOrder.completionDate >= self.startDate).\
            filter(SalesOrder.completionDate < self.endDate + timedelta(1)).\
            all()

        stream = self.template.generate(view=self)
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_disposition=f'filename="AR{self.docKey}.pdf"',
            content_length=len(body),
            body=body)
        return response
