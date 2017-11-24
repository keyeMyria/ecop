Ext.define('Ecop.view.article.ArticleController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.article',

  getModel: function() {
    return this.getViewModel().get('article')
  },

  onSave: function() {
    var me = this,
      content,
      f = me.getView().getForm(),
      article = me.getModel()

    if (!f.isValid()) {
      return
    }

    content = f
      .findField('content')
      .getValue()
      .trim()
    if (!content) {
      return Ecop.util.Util.showError('文章内容不能为空')
    }
    article.set('content', content)

    Web.data.JsonRPC.request({
      method: 'article.save',
      params: [
        article.phantom
          ? article.getData()
          : article.getData({ changes: true, critical: true })
      ],
      success: function(response) {
        if (!article.phantom) {
          setTimeout(me.reloadPreview.bind(me), 1000)
        }
        Ecop.util.Util.showInfo('文章保存成功。')
        article.set(response)
        article.commit()
      }
    })
  },

  reloadPreview: function() {
    var tmp_src,
      iframe = this.lookup('preview')
        .getEl()
        .down('iframe').dom

    // to avoid Cross Domain problem, we do not use window.location.reload
    if (iframe) {
      var tmp_src = iframe.src
      iframe.src = ''
      iframe.src = tmp_src
    }
  },

  onCancel: function() {
    this.getView().close()
  },

  onDelete: function() {
    var article = this.getModel(),
      panel = this.getView()
    Ext.Msg.confirm('确定删除?', '文章一旦删除将无法恢复,是否继续?', function(
      btnId
    ) {
      if (btnId === 'yes') {
        Web.data.JsonRPC.request({
          method: 'article.delete',
          params: [article.getId()],
          success: function(response) {
            article.drop()
            panel.destroy()
          }
        })
      }
    })
  }
})
