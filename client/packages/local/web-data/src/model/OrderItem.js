Ext.define('Web.model.OrderItem', {
  extend: 'Ext.data.Model',

  idProperty: 'orderItemId',

  fields: [
    { name: 'orderItemId', type: 'int' },
    { name: 'itemId', type: 'int' },
    { name: 'itemName', type: 'string' },
    { name: 'specification', type: 'string' },
    { name: 'model', type: 'string' },
    { name: 'quantity', type: 'float' },
    { name: 'unitId', type: 'int' },
    { name: 'sellingPrice', type: 'float' },
    { name: 'unitCost', type: 'float' },
    { name: 'imageUrl', type: 'string' },
    {
      name: 'margin',
      calculate: function(oi) {
        var sp = oi.sellingPrice
        return sp ? (sp - oi.unitCost) / sp : 0
      }
    },
    {
      name: 'amount',
      calculate: function(oi) {
        return oi.quantity * oi.sellingPrice
      }
    },
    {
      name: 'cost',
      calculate: function(oi) {
        return oi.quantity * oi.unitCost
      }
    }
  ]
})
