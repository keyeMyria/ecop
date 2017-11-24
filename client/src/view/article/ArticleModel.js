Ext.define('Ecop.view.article.ArticleModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.article',

  data: {
    article: null
  },

  formulas: {
    isNewArticle: function(get) {
      return !get('article.articleId')
    },

    previewUrl: function(get) {
      var articleType = get('article.articleType'),
        published = get('article.published'),
        articleId = get('article.articleId'),
        articleUrl = get('article.url')

      if (!articleId || !published) return

      switch (articleType) {
        case 'tip':
          url = Ext.String.format('{0}/tip/{1}', Ecop.siteUrl, articleId)
          break
        case 'page':
          var match = articleUrl.match(/^\/service\/(.*)/)
          if (match && match[1]) {
            url = Ext.String.format(
              '{0}/{1}',
              Ecop.siteUrl.replace('/www.', '/service.'),
              match[1]
            )
          } else {
            url = Ext.String.format('{0}{1}', Ecop.siteUrl, articleUrl)
          }
      }

      return url
    }
  }
})
