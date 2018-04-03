import os.path

from genshi.template import TemplateLoader, TemplateNotFound
from z3c.rml import rml2pdf

from pyramid.httpexceptions import HTTPNotFound
from pyramid.view import view_config
from pyramid.response import Response

from weblibs.camunda import camundaClient as cc

from ecop.base import DocBase
from ecop.region import getRegionName


@view_config(route_name='forms')
class ProcessForm(DocBase):
    def __init__(self, context, request):
        super(ProcessForm, self).__init__(context, request)

        formName = request.matchdict['form']
        loader = TemplateLoader([os.path.dirname(__file__)])
        try:
            self.template = loader.load(formName + '.pt')
        except TemplateNotFound:
            raise HTTPNotFound()

    @staticmethod
    def getRegionName(regionCode):
        return getRegionName(regionCode)

    def __call__(self):
        request = self.request

        ret = cc.makeRequest('/variable-instance', 'post', {
            'processInstanceIdIn': [request.matchdict['processId']]
        }, urlParams={'deserializeValues': 'false'})
        if not ret:
            raise HTTPNotFound()

        variables = cc.parseVariables(ret)

        stream = self.template.generate(variables=variables, view=self)
        body = rml2pdf.parseString(stream.render()).read()

        response = Response(
            content_type='application/pdf',
            content_disposition='filename="%s_%s.pdf"' % (
                variables['externalOrderId'], request.matchdict['form']),
            content_length=len(body),
            body=body)
        return response
