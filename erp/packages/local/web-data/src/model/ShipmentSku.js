Ext.define('Web.model.ShipmentSku', {
  extend: 'Ext.data.Model',

  idProperty: 'shipmentSkuId',

  fields: [
    { name: 'shipmentSkuId', type: 'int' },
    { name: 'shipmentId', type: 'int' },
    { name: 'skuId', type: 'int' },
    { name: 'itemName', type: 'string' },
    { name: 'specification', type: 'string' },
    { name: 'model', type: 'string' },
    { name: 'quantity', type: 'float' },
    { name: 'unitName', type: 'string' }
  ]
})
