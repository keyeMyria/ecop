Ext.define('Ecop.view.main.Main', {
  extend: 'Ext.Viewport',

  requires: [
    'Ecop.view.item.ItemManager',
    'Ecop.view.order.OrderManager',
    // 'Ecop.view.shipment.ShipmentManager',
    'Ecop.view.article.ArticleManager',
    'Ecop.view.seo.SeoPanel'
  ],

  layout: 'fit',

  items: [
    {
      xtype: 'tabpanel',
      tabPosition: 'left',
      tabRotation: 0,

      items: [
        {
          itemId: 'item-manager',
          xtype: 'item-manager',
          iconCls: 'x-fa fa-database x-main-tab-icon',
          tooltip: '商品管理',
          permission: 'item.manage'
        },
        {
          itemId: 'order-manager',
          xtype: 'order-manager',
          iconCls: 'x-fa fa-list x-main-tab-icon',
          tooltip: '订单管理',
          permission: 'order.manage'
        },
        /* {
          title: '物流管理',
          xtype: 'shipment-manager',
          permission: 'shipment.manage'
        },*/
        {
          xtype: 'article-manager',
          iconCls: 'x-fa fa-pencil x-main-tab-icon',
          tooltip: '内容管理',
          permission: 'content.manage'
        },
        {
          xtype: 'seo-panel',
          iconCls: 'x-fa fa-rocket x-main-tab-icon',
          tooltip: '搜索优化',
          permission: 'seo'
        }
      ]
    }
  ],

  initComponent: function() {
    var me = this,
      tp

    me.callParent()
    tp = me.down('tabpanel')
    tp.setActiveTab(tp.down('#order-manager') ? 'order-manager' : 0)
  }
})
