#
# the module is deprecated as of April 17, 2017
#

import os
from urllib.parse import urljoin
from genshi.template import TemplateLoader
from z3c.rml import rml2pdf

from pyramid.response import Response

from hm.lib.config import siteConfig

from weblibs.sqlalchemy import DBSession

from webmodel import Item


# @view_config(route_name='labelPrint')
def labelPrint(request):
    items = []
    sess = DBSession()
    for (iid, qty) in request.params.items():
        iid = int(iid)
        item = sess.query(Item).get(iid)
        items.extend(({
            'itemId': iid,
            'itemName': item.itemName,
            'specification': item.specification,
            'model': item.model,
            'price': item.sellingPrice,
            'url': urljoin(siteConfig.canonical_url, 'item/%d.html' % iid)
        },) * int(qty))

    tmpl = TemplateLoader([os.path.dirname(__file__)]).load('label.rml')
    stream = tmpl.generate(items=items)
    body = rml2pdf.parseString(stream.render()).read()

    response = Response(
        content_type='application/pdf',
        content_length=len(body),
        body=body)
    return response
