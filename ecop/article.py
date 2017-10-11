from datetime import datetime
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from dateutil import parser
from sqlalchemy import Sequence
from elasticsearch_dsl import Search

from pyramid_rpc.jsonrpc import jsonrpc_method

from weblibs.jsonrpc import RPCUserError
from webmodel import Article

from .base import RpcBase


class ArticleJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='article.save')
    def save(self, kwargs):
        """ When creating a new article, if the article id is not given as for
        help, we fetch a sequence id from postgresql as its articleId """

        _id = kwargs.pop('_id')
        is_new = _id.startswith('Web.model')  # is ths a new article?
        kwargs.pop('updateTime', None)  # this shall be automatically set
        tags = kwargs.pop('tags', None)

        content = kwargs.get('content')
        # checks the content for external image urls
        if content:
            soup = BeautifulSoup(content, 'lxml')
            for img in soup.select('img'):
                host = urlparse(img['src']).netloc
                if not host.endswith('homemaster.cn'):
                    raise RPCUserError('文章中不能包含外部图片链接！')

        if is_new:
            article = Article(**kwargs)
            article.updateTime = datetime.now()
        else:
            article = Article.get(_id)
            # update the article update time only when content is changed
            if article.content != kwargs.get('content'):
                article.updateTime = datetime.now()
            for (k, v) in kwargs.items():
                setattr(article, k, v)

        if tags:
            article.tags = [tag.strip() for tag in tags.split(',')]
        # tags is explicitly cleared
        elif tags == '' and hasattr(article, 'tags'):
            del article.tags

        # generate an numberic article id for new articles
        if is_new:
            article.articleId = self.sess.execute(
                Sequence('resource_id_seq'))

        article.save()
        article._d_['_id'] = article._id

        return article._d_

    @jsonrpc_method(endpoint='rpc', method='article.search')
    def search(self, text=None, articleType=None):
        s = Search(index='web', doc_type='article').\
            source(exclude=['content']).sort({'updateTime': 'desc'})[:500]

        if articleType:
            s = s.filter('term', articleType=articleType)

        # This does not work now
        # if text:
        # s = s.filter('term', text=text)

        ret = []
        for hit in s.execute():
            d = {'_id': hit.meta.id}
            d.update(hit.to_dict())
            d['updateTime'] = parser.parse(d['updateTime'])
            ret.append(d)

        return ret

    @jsonrpc_method(endpoint='rpc', method='article.data')
    def data(self, articleId):
        article = Article.get(articleId)
        return article._d_

    @jsonrpc_method(endpoint='rpc', method='article.delete')
    def delete(self, articleId):
        Article.get(articleId).delete()
