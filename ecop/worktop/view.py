from pyramid.view import view_config

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
