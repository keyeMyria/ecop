Ext.define('Web.model.ItemGroup', {
  extend: 'Ext.data.Model',

  idProperty: 'itemGroupId',

  fields: [
    {
      name: 'itemGroupId',
      type: 'int'
    },
    {
      name: 'groupItemName',
      type: 'string',
      allowNull: true,
      convert: function(value) {
        if (value && Ext.isString(value) && value.trim()) {
          return value.trim()
        } else {
          return null
        }
      }
    },
    { name: 'groupImageId', type: 'int', allowNull: true },
    { name: 'labelName', type: 'string' },
    { name: 'groupBy' },
    { name: 'shareDescription', type: 'boolean' },
    { name: 'shareImage', type: 'boolean' }
  ]
})
