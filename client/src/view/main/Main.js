Ext.define('Ecop.view.main.Main', {
  extend: 'Ext.Viewport',

  requires: [
    'Ecop.view.item.ItemGroupManager',
    'Ecop.view.item.ItemManager',
    'Ecop.view.order.OrderManager',
    'Ecop.view.shipment.ShipmentManager',
    // 'Ecop.view.shop.LabelPanel',
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
          title: '商品组合',
          xtype: 'itemgroupmanager',
          permission: 'item.manage'
        },
        {
          title: '商品维护',
          itemId: 'item-manager',
          xtype: 'item-manager',
          permission: 'item.manage'
        },
        {
          title: '订单管理',
          itemId: 'order-manager',
          xtype: 'order-manager',
          permission: 'order.manage'
        },
        {
          title: '物流管理',
          xtype: 'shipment-manager',
          permission: 'shipment.manage'
        },
        {
          /*
            Label printing is deprecated since March 24, 2017

            title: '标签打印',
            xtype: 'labelpanel',
            permission: 'shop.manage'
        }, {
        */
          title: '内容管理',
          xtype: 'article-manager',
          permission: 'content.manage'
        },
        {
          title: '搜索优化',
          xtype: 'seo-panel',
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
