Ext.define('Web.model.Shipment', {
  extend: 'Ext.data.Model',

  idProperty: 'shipmentId',

  fields: [
    { name: 'shipmentId', type: 'int' },

    {
      name: 'actualShippingDate',
      type: 'date',
      dateFormat: 'Y-m-d',
      persist: false
    },
    { name: 'recipientId', type: 'int' },
    { name: 'recipientMobile', type: 'string', allowNull: true },
    { name: 'recipientName', type: 'string' },
    { name: 'recipientPhone', type: 'string', allowNull: true },
    { name: 'regionCode', type: 'int' },
    { name: 'regionName', type: 'string', persist: false },
    {
      name: 'scheduledShippingDate',
      type: 'date',
      dateFormat: 'Y-m-d',
      persist: false
    },
    { name: 'shipmentMemo', type: 'string', defaultValue: null },
    { name: 'shipmentMethod', type: 'int' },
    { name: 'shipmentStatus', type: 'int' },
    { name: 'shipperCode', type: 'string' },
    { name: 'streetAddress', type: 'string' }
  ]
})
