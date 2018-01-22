Ext.define('Ecop.view.article.CaseModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.case',

  data: {
    article: null
  },

  stores: {
    images: {
      fields: ['name'],
      proxy: { type: 'memory', reader: 'json' }
    }
  },

  formulas: {
    isNewArticle: function(get) {
      return !get('article.articleId')
    },

    title: function(get) {
      return typeof get('article.articleId') === 'string'
        ? '新案例'
        : '案例' + get('article.articleId')
    },

    imageUrl: function(get) {
      return Ecop.imageUrl + '/' + get('imageList.selection.name')
    },

    showRight: function(get) {
      var s = get('images'),
        record = get('selectedImage')
      return record && s.indexOf(record) < s.getCount() - 1
    },

    showLeft: function(get) {
      var s = get('images'),
        record = get('selectedImage')
      return record && s.indexOf(record) > 0
    }
  }
})
