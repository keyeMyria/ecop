Ext.define('Ecop.view.article.ArticleManagerController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.article-manager',

  requires: 'Web.model.Article',

  onSearchArticle: function() {
    var me = this

    params = {
      text: me
        .lookup('searchText')
        .getValue()
        .trim(),
      articleType: me.lookup('articleType').getValue()
    }

    Web.data.JsonRPC.request({
      method: 'article.search',
      params: params,
      success: function(articles) {
        var s = me.lookup('article-list').store
        s.loadData(articles)
        if (s.getCount() === 0) {
          Ecop.util.Util.showError('没有找到符合条件的文章。')
        }
      }
    })
  },

  onNewArticle: function() {
    var view = this.getView()
    p = Ext.widget('articlepanel', {
      viewModel: {
        data: {
          article: Ext.create('Web.model.Article', { articleType: 'tip' })
        }
      }
    })
    view.add(p)
    view.setActiveTab(p)
  },

  onNewCase: function() {
    var view = this.getView()
    p = Ext.widget('casepanel', {
      viewModel: {
        data: {
          article: Ext.create('Web.model.Article', { articleType: 'case' })
        }
      }
    })
    view.add(p)
    view.setActiveTab(p)
  },

  onOpenArticle: function(view, td, cellIndex, record) {
    var view = this.getView(),
      aid = record.getId(),
      tab = view.down('[articleId="' + aid + '"]')

    if (tab) {
      view.setActiveTab(tab)
    } else {
      Web.data.JsonRPC.request({
        method: 'article.data',
        params: [aid]
      }).then(function(article) {
        var p
        record.set(article)
        p = Ext.widget('articlepanel', {
          articleId: aid,
          viewModel: {
            data: {
              article: record
            }
          }
        })
        view.add(p)
        view.setActiveTab(p)
      })
    }
  }
})
