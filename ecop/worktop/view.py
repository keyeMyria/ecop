from pyramid.view import view_config

from ecop.view import BaseEcopView


@view_config(route_name='worktop', renderer='worktop.pt', xhr=False)
class WorktopView(BaseEcopView):
    title = '台面安装流程'

    resourceConfig = {
        'debug': {
            'body': [
                'ecop/worktop/build/app.js'
            ]
        },
        'deploy': {
            'body': [
                'worktop/app.js'
            ]
        }
    }
