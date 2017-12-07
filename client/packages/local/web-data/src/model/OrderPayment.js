Ext.define('Web.model.OrderPayment', {
  extend: 'Ext.data.Model',

  fields: [
    { name: 'paymentId', type: 'int' },
    { name: 'amount', type: 'float', allowNull: true },
    { name: 'paymentMethod', type: 'int', allowNull: true },
    { name: 'payTime', type: 'date', dateFormat: 'Y-m-d H:i:s' },
    { name: 'receiverName', type: 'string' }
  ]
})
