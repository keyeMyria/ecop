Ext.define('Web.model.Image', {
  extend: 'Ext.data.Model',

  idProperty: 'imageId',

  fields: [
    { name: 'imageId', type: 'int' },
    { name: 'title' },
    { name: 'width', type: 'int' },
    { name: 'height', type: 'int' },
    { name: 'url' }
  ]
})
