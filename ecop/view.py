from urllib.parse import urljoin

from pyramid.view import view_config
from pyramid.httpexceptions import HTTPBadRequest

from hm.lib.config import siteConfig
from hm.lib.reify import reify


class BaseEcopView(object):
    """Defines resources needed for the ecop app """

    def __init__(self, context, request):
        if request.is_bot:
            raise HTTPBadRequest()

        self.context = context
        self.request = request

    @reify
    def resources(self):
        def getUrl(url):
            if not self.debug:
                url = 'v%s/%s' % (siteConfig.version, url)
            return urljoin(siteConfig.asset_url, url)

        cfg = self.resourceConfig['debug' if self.debug else 'deploy']
        ret = {}
        ret['css'] = [getUrl(r) for r in cfg['head'] if r.endswith('.css')]
        ret['headjs'] = [getUrl(r) for r in cfg['head'] if r.endswith('.js')]
        ret['bodyjs'] = [getUrl(r) for r in cfg.get('body', [])]

        return ret

    @reify
    def debug(self):
        return siteConfig.debug

    @reify
    def version(self):
        return siteConfig.version

    @reify
    def siteUrl(self):
        """ The url that points to the desktop version of web """
        return siteConfig.canonical_url

    @reify
    def imageUrl(self):
        return siteConfig.image_url

    def __call__(self):
        return {}


@view_config(route_name='erp', renderer='decop.pt', xhr=False)
class DecopView(BaseEcopView):
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
                'ecop/resources/Ecop-all.css',
                'ecop/lib/spark-md5.min.js',
                'ecop/lib/ckeditor/ckeditor.js',
                'ecop/app.js'
            ]
        }
    }


@view_config(route_name='tabletop', renderer='tabletop.pt', xhr=False)
class TabelTopView(BaseEcopView):
    resourceConfig = {
        'debug': {
            'head': [
                'ecop/tabletop/build/app.css'
            ],
            'body': [
                'ecop/tabletop/build/app.js'
            ]
        },
        'deploy': {
            'head': [
                'tabletop/app.css',
            ],
            'body': [
                'tabletop/app.js'
            ]
        }
    }
