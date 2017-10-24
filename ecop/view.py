import logging
from urllib.parse import urljoin

from pyramid.view import view_config
from pyramid.httpexceptions import HTTPBadRequest
from pyramid_rpc.jsonrpc import jsonrpc_method

from hm.lib.config import siteConfig
from hm.lib.reify import reify

from .base import RpcBase

logger = logging.getLogger('ecop')


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


@view_config(route_name='decop', renderer='decop.pt', xhr=False)
class DecopView(BaseEcopView):
    resourceConfig = {
        'debug': {
            'head': [
                'ecop/client/build/development/resources/Ecop-all.css',
                'ecop/client/ext/build/ext.js',
                'ecop/client/lib/spark-md5.min.js',
                'ecop/client/lib/jquery-3.1.0.min.js',
                'ecop/client/lib/ckeditor/ckeditor.js',
                'ecop/client/app.js'
            ]
        },
        'deploy': {
            'head': [
                'ecop/resources/Ecop-all.css',
                'ecop/lib/spark-md5.min.js',
                'ecop/lib/jquery-3.1.0.min.js',
                'ecop/lib/ckeditor/ckeditor.js',
                'ecop/app.js'
            ]
        }
    }


# @view_config(route_name='mecop', renderer='mecop.pt', xhr=False)
class MecopView(BaseEcopView):
    resourceConfig = {
        'debug': {
            'head': [
                'ecop/mecop/build/main.css'
            ],
            'body': [
                'ecop/mecop/build/main.js'
            ]
        },
        'deploy': {
            'head': [
                'mecop/main.css',
            ],
            'body': [
                'mecop/main.js'
            ]
        }
    }


class SiteJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='ecop.log')
    def log(self, message):
        if isinstance(message, dict):
            self.request.log(**message)
        else:
            logger.info(message)
