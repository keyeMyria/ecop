Ext.define('Ecop.view.shop.LabelController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.label',

  requires: ['Ecop.widget.ItemSelector'],

  onBtnAdd: function() {
    var me = this,
      view = me.getView()
    if (!me.selectorWin) {
      // add selector win so that when the panel is closed, the window
      // is destroyed
      me.selectorWin = view.add({
        xtype: 'itemselector',
        closeAction: 'hide',
        height: 600,
        width: 1200,
        listeners: {
          itemselect: me.onAddItems,
          scope: me
        }
      })
    }
    me.selectorWin.show()
  },

  onAddItems: function(items) {
    var me = this,
      iids = [],
      store = me.getView().getStore()

    // see if the item is already present by first compiling as list of all
    // item ids
    store.each(function(record) {
      iids.push(record.get('itemId'))
    })

    Ext.each(items, function(item) {
      if (iids.indexOf(item.get('itemId')) === -1) {
        item.set('quantity', 1)
        store.add(item)
      }
    })
  },

  onItemDelete: function(btn) {
    this.getView().getStore().remove(btn.getWidgetRecord())
  },

  onBtnPrint: function() {
    var me = this,
      params = {},
      store = me.getView().getStore(),
      qty = 0

    if (!store.getCount()) {
      Ecop.util.Util.showError('没有需要打印标签的商品')
    } else if (store.sum('quantity') > 9) {
      Ecop.util.Util.showError('单次打印标签总数不能超过９张')
    } else {
      store.each(function(item) {
        params[item.get('itemId')] = item.get('quantity')
      })
      window.open('/labelPrint?' + Ext.Object.toQueryString(params))
    }
  }
})
