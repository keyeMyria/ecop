
import json
from urllib.parse import urljoin

from pyramid.csrf import get_csrf_token

from hm.lib.config import siteConfig
from hm.lib.reify import reify


class BaseEcopView(object):
    """Defines resources needed for the ecop app """

    def __init__(self, context, request):
        self.context = context
        self.request = request

    @reify
    def resources(self):
        def getUrl(url):
            if url.startswith('http://') or url.startswith('https://'):
                return url
            if not self.debug:
                url = 'v%s/%s' % (siteConfig.version, url)
            return urljoin(siteConfig.asset_url, url)

        cfg = self.resourceConfig['debug' if self.debug else 'deploy']
        ret = {}
        ret['css'] = [
            getUrl(r) for r in cfg.get('head', []) if r.endswith('.css')]
        ret['headjs'] = [
            getUrl(r) for r in cfg.get('head', []) if r.endswith('.js')]
        ret['bodyjs'] = [
            getUrl(r) for r in cfg.get('body', [])]

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

    @property
    def csrfToken(self):
        return get_csrf_token(self.request) \
            if self.request.authenticated else None

    def userInfo(self, appName):
        return json.dumps(self.request.user.extraData[appName])

    def __call__(self):
        return {}
