from datetime import datetime
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from sqlalchemy import Sequence
from elasticsearch_dsl import Q

from pyramid_rpc.jsonrpc import jsonrpc_method

from webmodel.esweb import Article
from weblibs.jsonrpc import RPCUserError

from ecop.base import RpcBase


class ArticleJSON(RpcBase):

    @jsonrpc_method(endpoint='rpc', method='article.save')
    def save(self, kwargs):
        """
        Creates a new or updates an existing article.

        TODO:
        The elasticsearch _id field is used to locate the article instead of
        the articleId field. It's confusing to use two different id for one
        object. A reindex should be able to migrate existing documents to
        using one articleId. Also the createDate field in the mapping is not
        used and shall be removed in a reindex.

        When creating a new article, fetch a sequence id from postgresql as its
        articleId.
        """
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
            if kwargs['articleType'] == 'case':
                kwargs.pop('title')

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
        return self.getData(article)

    @jsonrpc_method(endpoint='rpc', method='article.search')
    def search(self, text=None, articleType=None):
        s = Article.search().source(exclude=['content'])\
            .sort({'updateTime': 'desc'})[:500]

        if articleType:
            s = s.filter('term', articleType=articleType)

        if text:
            s = s.filter(
                Q('term', tags=text) |
                Q('wildcard', **{'title.raw': f'*{text}*'}) |
                Q('wildcard', url=f'*{text}*')
            )

        ret = []
        for article in s.execute():
            d = article.to_dict()
            d['_id'] = article.meta.id
            ret.append(d)
        return ret

    @jsonrpc_method(endpoint='rpc', method='article.data')
    def data(self, articleId):
        return self.getData(Article.get(articleId))

    @jsonrpc_method(endpoint='rpc', method='article.delete')
    def delete(self, articleId):
        Article.get(articleId).delete()

    def getData(self, article):
        ret = article.to_dict()
        if article.articleType == 'case':
            ret['images'] = [{'name': i} for i in article.images]
        ret['_id'] = article.meta.id
        return ret
