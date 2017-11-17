/*
 * Widget window that allows user to select single or multiple items.
 * Fires 'itemselect(items)' event when selection is made, where items is an
 * array of item Model records.
 */
Ext.define('Ecop.widget.ItemSelector', {
  extend: 'Ext.window.Window',
  xtype: 'itemselector',

  requires: ['Ecop.widget.ItemBrowser'],

  title: '选择商品',
  closable: true,
  modal: true,
  layout: 'fit',

  defaultListenerScope: true,

  items: [
    {
      xtype: 'itembrowser',
      selModel: 'checkboxmodel',

      listeners: {
        rowdblclick: 'onSelect'
      }
    }
  ],

  buttonAlign: 'center',
  buttons: [
    {
      text: '选择',
      handler: 'onSelect'
    },
    {
      text: '关闭',
      handler: function() {
        this.up('window').close()
      }
    }
  ],

  onSelect: function() {
    var me = this,
      items = [],
      sel = me.down('itembrowser').getSelection()

    if (sel.length > 0) {
      for (i = 0; i < sel.length; i++) {
        items.push(sel[i])
      }
      me.fireEvent('itemselect', items)
    }
    me
      .down('itembrowser')
      .getSelectionModel()
      .deselectAll()
    // me.close()
  }
})
