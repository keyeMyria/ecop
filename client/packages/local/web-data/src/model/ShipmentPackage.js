Ext.define('Web.model.ShipmentPackage', {
  extend: 'Ext.data.Model',

  fields: [
    { name: 'shipmentId', type: 'int', reference: 'Web.model.Shipment' },
    { name: 'documentId', type: 'string' },
    { name: 'packageStatus', type: 'int', allowNull: true },
    { name: 'weight', type: 'float', allowNull: true },
    { name: 'freight', type: 'float', allowNull: true },
    { name: 'printTime', type: 'date', dateFormat: 'Y-m-d H:i:s' }
  ]
})
