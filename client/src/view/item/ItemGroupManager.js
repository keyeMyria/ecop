Ext.define('Ecop.view.item.ItemGroupManager', {
  extend: 'Ext.tab.Panel',
  xtype: 'itemgroupmanager',

  requires: ['Ecop.widget.ItemBrowser', 'Ecop.view.item.ItemGroupPanel'],

  defaultListenerScope: true,

  items: [
    {
      xtype: 'itembrowser',
      title: '搜索商品',
      listeners: {
        rowdblclick: 'onItemSelect'
      }
    },
    {
      xtype: 'itemgrouppanel',
      itemId: 'editor',
      title: '商品组合'
    }
  ],

  onItemSelect: function(table, record) {
    var me = this

    Web.data.JsonRPC.request({
      method: 'item.group.get',
      params: { itemId: record.get('itemId') },
      success: function(ret) {
        me.down('#editor').load(ret)
        me.setActiveItem('editor')
      }
    })
  }
})
