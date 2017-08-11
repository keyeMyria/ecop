Ext.define('Ecop.widget.ItemBrowser', {
  extend: 'Ecop.widget.ItemGrid',
  xtype: 'itembrowser',

  requires: ['Ecop.widget.CategorySelector'],

  tbar: {
    defaults: {
      labelWidth: 35
    },
    items: [
      {
        xtype: 'textfield',
        itemId: 'searchText',
        fieldLabel: '搜索',
        flex: 1,
        plugins: 'cleartrigger',
        listeners: {
          specialkey: function(f, e) {
            if (e.getKey() == e.ENTER) {
              f.up('itembrowser').onItemSearch()
            }
          }
        }
      },
      {
        xtype: 'combo',
        itemId: 'brandId',
        fieldLabel: '品牌',
        editable: false,
        plugins: 'cleartrigger',
        width: 180,
        store: 'brand',
        displayField: 'brandName',
        valueField: 'id'
      },
      {
        xtype: 'categoryselector',
        fieldLabel: '分类',
        itemId: 'categoryId',
        plugins: 'cleartrigger',
        minWidth: 210,
        flex: 1
      },
      {
        xtype: 'combo',
        labelWidth: 50,
        fieldLabel: '供货商',
        itemId: 'maintainerId',
        store: 'supplier',
        permission: 'item.update.maintainer',
        valueField: 'id',
        plugins: 'cleartrigger',
        width: 200
      },
      {
        xtype: 'combo',
        itemId: 'itemStatus',
        fieldLabel: '状态',
        editable: false,
        width: 130,
        store: 'itemstatus',
        plugins: 'cleartrigger',
        valueField: 'id'
      },
      {
        xtype: 'checkbox',
        boxLabel: '仅SKU',
        itemId: 'isSku',
        permission: 'item.bom.manage'
      },
      {
        xtype: 'checkbox',
        boxLabel: '仅结构商品',
        itemId: 'assortmentOnly'
      },
      {
        xtype: 'button',
        itemId: 'btnSearch',
        style: 'padding-right: 0',
        width: 70,
        text: '搜索'
      }
    ]
  },

  initComponent: function() {
    var me = this
    me.callParent()
    me.down('#btnSearch').on('click', me.onItemSearch, me)
  },

  onItemSearch: function() {
    var me = this,
      widget

    params = {
      text: me.down('#searchText').getValue().trim(),
      brandId: me.down('#brandId').getValue(),
      catId: me.down('#categoryId').getValue(),
      status: me.down('#itemStatus').getValue()
    }

    widget = me.down('#isSku')
    if (widget && widget.getValue()) {
      params['isSku'] = true
    }

    widget = me.down('#assortmentOnly')
    if (widget && widget.getValue()) {
      params['assortmentOnly'] = true
    }

    widget = me.down('#maintainerId')
    if (widget && widget.getValue()) {
      params['maintainerId'] = widget.getValue()
    }
    me.doItemSearch(params, true)
  },

  /*
     * The separation of this method from onItemSearch and the use of
     * 'showNotFound' argument is only for automatic dispalying vendor items
     * when vendor logs in.
     */
  doItemSearch: function(params, showNotFound) {
    var me = this
    Web.data.JsonRPC.request({
      method: 'item.search',
      params: params,
      success: function(items) {
        me.getSelectionModel().deselectAll()
        me.store.loadData(items)
        if (me.store.getCount() === 0 && showNotFound) {
          Ecop.util.Util.showError('没有找到符合条件的商品。')
        }
      }
    })
  }
})
