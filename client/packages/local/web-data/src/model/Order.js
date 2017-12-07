/* global Ext, Web */

/*
 * The Model is shared between SalesOrder and PurchaseOrder
 */
Ext.require('Web.data.Converter', function() {
  Ext.define('Web.model.Order', {
    extend: 'Ext.data.Model',

    idProperty: 'orderId',

    fields: [
      /*
       * common fields to both order types
       */
      { name: 'orderId', type: 'int' },
      { name: 'customerId', type: 'int' },
      { name: 'customerName', type: 'string' },
      {
        name: 'createTime',
        type: 'date',
        dateFormat: 'Y-m-d H:i:s',
        persist: false
      },
      { name: 'creatorName', type: 'string', persist: false },
      { name: 'amount', type: 'float' },
      { name: 'freight', type: 'float' },
      { name: 'rebate', type: 'float' },
      { name: 'orderStatus', type: 'int' },
      { name: 'regionCode', type: 'int' },
      { name: 'recipientName', type: 'string' },
      { name: 'streetAddress', type: 'string' },
      { name: 'recipientMobile', type: 'string', allowNull: true },
      { name: 'recipientPhone', type: 'string', allowNull: true },
      {
        name: 'memo',
        type: 'string',
        defaultValue: null,
        convert: Web.data.Converter.trimNull
      },

      /*
       * fields for sales order
       */
      { name: 'paidAmount', type: 'float' },
      { name: 'installmentAmount', type: 'float', allowNull: true },
      { name: 'effectiveCost', type: 'float' },
      {
        name: 'internalMemo',
        type: 'string',
        defaultValue: null,
        convert: Web.data.Converter.trimNull
      },
      {
        name: 'profit',
        calculate: function(order) {
          return order.amount - order.effectiveCost
        }
      },
      {
        name: 'margin',
        calculate: function(order) {
          return order.amount
            ? (order.amount - order.effectiveCost) / order.amount
            : 0
        }
      },
      {
        name: 'restAmount',
        calculate: function(order) {
          return order.amount - order.paidAmount
        }
      },

      // TODO: `regionName` seems to be only used by mobile
      { name: 'regionName', type: 'string', persist: false },

      /*
       * fields for purchase order only
       */
      { name: 'supplierId', type: 'int', allowNull: true },
      { name: 'supplierName', type: 'string' },
      { name: 'relatedOrderId', type: 'int', allowNull: true }
    ],

    validators: [
      {
        type: 'presence',
        field: 'regionCode',
        message: '所在地区必须输入'
      },
      {
        type: 'presence',
        field: 'streetAddress',
        message: '街道地址必须输入'
      },
      {
        type: 'presence',
        field: 'mrecipientMobile',
        message: '手机号码必须输入'
      },
      {
        type: 'format',
        field: 'recipientMobile',
        matcher: /^1\d{10}$/,
        message: '手机号码格式为1开头的11位数字'
      },
      {
        type: 'format',
        field: 'recipientPhone',
        matcher: /^0[0-9]{2,3}-[0-9]{5,8}([*\-][0-9]+){0,1}$/,
        message: '固定电话格式如：021-12345678*90，必须输入区号'
      }
    ]
  })
})
