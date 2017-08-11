Ext.define('Ecop.view.seo.SeoController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.seo',

  requires: ['Ecop.view.seo.EntryForm'],

  form: null,

  onSearchUrl: function() {
    var me = this,
      vm = this.getViewModel(),
      url = vm.get('searchUrl').trim()

    if (url[0] !== '/') {
      return Ecop.util.Util.showError('Url必须以/开头。')
    }

    Web.data.JsonRPC.request({
      method: 'seo.entry.search',
      params: [url],
      success: function(entries) {
        var s = vm.get('entry')
        s.loadData(entries)
        if (s.getCount() === 0) {
          Ecop.util.Util.showError('没有找到符合条件的项目。')
        }
      }
    })
  },

  onCellClick: function(view, td, cellIndex, record) {
    // not drop widget
    if (cellIndex !== 5) {
      this.getViewModel().set('currentEntry', record)
      this.openEntryForm()
    }
  },

  openEntryForm: function() {
    this.form = this.getView().add({ xtype: 'seo-form' }).show().center()
  },

  onAddEntry: function() {
    var entry = Ext.create('Web.model.SeoEntry')

    // using entry.set will keep entry.phantom to true
    entry.set('url', '/new_url')
    this.getViewModel().set('currentEntry', entry)
    this.openEntryForm()
  },

  onFormClose: function() {
    var entry = this.getViewModel().get('currentEntry')

    if (entry.phantom) {
      Ext.destroy(entry)
    } else if (entry.dirty) {
      entry.reject()
    }
  },

  onSaveEntry: function() {
    var me = this,
      entry = me.getViewModel().get('currentEntry'),
      params = entry.getChanges()

    params.url && delete params.url

    Web.data.JsonRPC.request({
      method: 'seo.entry.upsert',
      params: [entry.get('url'), params],
      success: function() {
        entry.commit()
        me.form.close()
        Ecop.util.Util.showInfo('保存成功。')
      }
    })
  },

  onDeleteEntry: function(btn) {
    var entry = btn.getWidgetRecord()
    Web.data.JsonRPC.request({
      method: 'seo.entry.delete',
      params: [entry.get('url')],
      success: function() {
        entry.drop()
      }
    })
  }
})
