from pyramid.view import view_config
from ecop.view import BaseEcopView

@view_config(route_name='erp', renderer='erp.pt', xhr=False)
class ERPView(BaseEcopView):
    title = '大管家ERP'

    resourceConfig = {
        'debug': {
            'head': [
                'ecop/client/build/development/resources/Ecop-all.css',
                'ecop/client/ext/build/ext.js',
                'ecop/client/desktop/lib/spark-md5.min.js',
                'ecop/client/desktop/lib/ckeditor/ckeditor.js',
                'ecop/client/desktop/app.js'
            ]
        },
        'deploy': {
            'head': [
                'erp/resources/Ecop-all.css',
                'erp/lib/spark-md5.min.js',
                'erp/lib/ckeditor/ckeditor.js',
                'erp/app.js'
            ]
        }
    }
