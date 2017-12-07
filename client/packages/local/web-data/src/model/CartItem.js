Ext.define('Web.model.CartItem', {
  extend: 'Ext.data.Model',

  fields: [
    { name: 'itemId', type: 'int' },
    { name: 'itemName' },
    { name: 'specification' },
    { name: 'modelNo' },
    { name: 'imageUrl' },
    { name: 'quantity', type: 'float' },
    { name: 'unitName' },
    { name: 'sellingPrice', type: 'float' },
    {
      name: 'amount',
      calculate: function(ci) {
        return ci.quantity * ci.sellingPrice
      }
    }
  ]
})
