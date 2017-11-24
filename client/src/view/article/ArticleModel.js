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
      var article = get('article')
    }
  }
})
