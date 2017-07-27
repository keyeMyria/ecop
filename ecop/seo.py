from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel import Seo
from weblibs.jsonrpc import marshall

from .base import RpcBase


class SeoJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='seo.entry.upsert')
    def addAndUpdateEntry(self, url, content):
        entry = self.sess.query(Seo).get(url)
        if entry:
            for (k, v) in content.items():
                setattr(entry, k, v)
        else:
            data = {'url': url}
            data.update(content)
            entry = Seo(**data)
            self.sess.add(entry)

    @jsonrpc_method(endpoint='rpc', method='seo.entry.delete')
    def deleteEntry(self, url):
        entry = self.sess.query(Seo).get(url)
        self.sess.delete(entry)

    @jsonrpc_method(endpoint='rpc', method='seo.entry.get')
    def getEntry(self, url):
        entry = self.sess.query(Seo).get(url)
        return marshall(entry, ['url', 'title', 'keywords', 'description'])

    @jsonrpc_method(endpoint='rpc', method='seo.entry.search')
    def searchEntry(self, url):
        """ Search seo entries for the given url.

         * the url must start with '/' and if it does not end with '*', then it
           means an exact match.
         * if the url ends with '*', it will match all urls starting with the
           given url
        """
        query = self.sess.query(Seo)

        if url.endswith('*'):
            url = url[:-1]
            entries = query.filter(Seo.url.op('ilike')('%s%%' % url)).all()
        else:
            entries = query.get(url)
            entries = [entries] if entries else []

        return [marshall(i, ['url', 'title', 'keywords', 'description'])
                for i in entries]
