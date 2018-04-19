Ext.define('Ecop.view.article.BaseArticleController', {
  extend: 'Ext.app.ViewController',

  getModel: function() {
    return this.getViewModel().get('article')
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
