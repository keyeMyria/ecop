/* global Ext */

/*
 * Note stores created from database parameter are synchronously loaded since
 * they are used in the grid clolumn storeRenderer to turn key into value.
 * There does not seem to be easy method to do this async. So we patched
 * JsonRPCProxy to do synchronous request.
 */

Ext.define('Web.store.enum', {
  requires: ['Ext.data.Store', 'Ext.data.ArrayStore', 'Web.JsonRPCProxy'],

  singleton: true,

  constructor: function() {
    Ext.apply(this, {
      articletype: Ext.create('Ext.data.ArrayStore', {
        storeId: 'articletype',
        fields: ['id', 'text'],
        data: [['page', '固定页面'], ['tip', '小贴士'], ['case', '案例']]
      }),

      itemstatus: Ext.create('Ext.data.ArrayStore', {
        storeId: 'itemstatus',
        fields: ['id', 'text'],
        data: [[0, '在线'], [1, '下线'], [2, '冻结']]
      }),

      orderstatus: Ext.create('Ext.data.ArrayStore', {
        storeId: 'orderstatus',
        fields: ['id', 'text'],
        data: [
          [1, '待确认'],
          [2, '已确认'],
          [3, '部分完成'],
          [4, '已完成'],
          [5, '已关闭']
        ]
      }),

      shipmentmethod: Ext.create('Ext.data.ArrayStore', {
        storeId: 'shipmentmethod',
        fields: ['id', 'text'],
        data: [[1, '快递物流'], [2, '发货人自送'], [3, '收货人自提']]
      }),

      shipmentstatus: Ext.create('Ext.data.ArrayStore', {
        storeId: 'shipmentstatus',
        fields: ['id', 'text'],
        data: [[1, '待发货'], [2, '已发货']]
      }),

      packagestatus: Ext.create('Ext.data.ArrayStore', {
        storeId: 'packagestatus',
        fields: ['id', 'text'],
        data: [
          [1, '已打印'],
          [2, '已扫描'],
          [3, '在途中'],
          [4, '已签收'],
          [5, '问题件']
        ]
      }),

      paymentmethod: Ext.create('Ext.data.Store', {
        storeId: 'paymentmethod',
        asynchronousLoad: false,
        fields: [{ name: 'id', type: 'int' }, 'text'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'param.get',
          async: false,
          params: ['PaymentMethod']
        }
      }),

      unit: Ext.create('Ext.data.Store', {
        storeId: 'unit',
        asynchronousLoad: false,
        fields: [{ name: 'id', type: 'int' }, 'text'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'param.get',
          async: false,
          params: ['unit']
        }
      }),

      orderSource: Ext.create('Ext.data.Store', {
        storeId: 'ordersource',
        asynchronousLoad: false,
        fields: [{ name: 'id', type: 'int' }, 'text'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'param.get',
          async: false,
          params: ['OrderSource']
        }
      }),

      country: Ext.create('Ext.data.Store', {
        storeId: 'country',
        asynchronousLoad: false,
        fields: ['id', 'text'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'param.get',
          async: false,
          params: ['country']
        }
      }),

      shipper: Ext.create('Ext.data.Store', {
        storeId: 'shipper',
        asynchronousLoad: false,
        fields: ['id', 'text'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'param.get',
          async: false,
          params: ['shipper']
        }
      }),

      moduletype: Ext.create('Ext.data.Store', {
        storeId: 'moduletype',
        asynchronousLoad: false,
        fields: [{ name: 'id', type: 'int' }, 'text'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'param.get',
          async: false,
          params: ['ModuleType']
        }
      }),

      brand: Ext.create('Ext.data.Store', {
        storeId: 'brand',
        asynchronousLoad: false,
        fields: [{ name: 'id', type: 'int' }, 'brandName'],
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'brand.get',
          async: false
        }
      }),

      category: Ext.create('Ext.data.TreeStore', {
        storeId: 'category',
        asynchronousLoad: false,
        autoLoad: false,
        proxy: {
          type: 'jsonrpc',
          method: 'category.get',
          async: false
        }
      })
    })
  }
})
