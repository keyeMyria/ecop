Ext.define('Web.model.BomItem', {
  extend: 'Ext.data.Model',

  idProperty: 'pkey',

  fields: [
    { name: 'pkey' },
    { name: 'itemId', type: 'int' },
    { name: 'itemName' },
    { name: 'specification' },
    { name: 'model' },
    { name: 'weight', type: 'float' },
    { name: 'quantity', type: 'int' }
  ]
})
