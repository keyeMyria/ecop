from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound

from webmodel.validator import isOrderId

from ecop.view import BaseEcopView


@view_config(route_name='worktop', renderer='worktop.pt', xhr=False)
class WorktopView(BaseEcopView):
    title = '台面安装流程'

    resourceConfig = {
        'debug': {
            'head': [
                'ecop/worktop/build/app.css'
            ],
            'body': [
                'ecop/worktop/build/app.js'
            ]
        },
        'deploy': {
            'head': [
                'worktop/app.css'
            ],
            'body': [
                'worktop/app.js'
            ]
        }
    }


@view_config(route_name='ship', device_type='mobile', renderer='worktop.pt',
             xhr=False)
class ShipView(WorktopView):
    title = '物流管理'

    def __call__(self):
        params = self.request.params

        if 'orderId' not in params or 'pkgId' not in params or \
                not isOrderId(params['orderId']) or \
                len(params['pkgId']) != 22:
            raise HTTPNotFound()

        return {}
