Ext.define('Web.model.Item', {
  extend: 'Ext.data.Model',

  idProperty: 'itemId',

  fields: [
    {
      name: 'itemId',
      type: 'int'
    },
    {
      name: 'itemName',
      allowNull: true,
      validators: [
        {
          type: 'presence'
        },
        {
          type: 'length',
          min: 3,
          max: 60,
          bothMessage: '商品名称长度为{0}-{1}个字符'
        }
      ]
    },
    {
      name: 'specification',
      allowNull: true,
      validators: [
        {
          type: 'length',
          max: 30
        }
      ]
    },
    {
      name: 'model',
      allowNull: true,
      validators: [
        {
          type: 'length',
          max: 30
        }
      ]
    },
    { name: 'mainImageUrl' },
    { name: 'unitId', type: 'int', allowNull: true },
    { name: 'brandId', type: 'int', allowNull: true },
    { name: 'countryId', allowNull: true },
    { name: 'unitName' },
    { name: 'itemStatus', type: 'int' },
    { name: 'primaryCategoryId', type: 'int' },
    { name: 'isSku', type: 'boolean', defaultValue: true },
    { name: 'sellingPrice', type: 'float' },
    { name: 'sellingPriceB', type: 'float' },
    { name: 'purchasePrice', type: 'float' },
    { name: 'weight', type: 'float' },
    {
      name: 'isOnline',
      calculate: function(item) {
        return item.itemStatus === 0
      }
    },
    {
      name: 'isOffline',
      calculate: function(item) {
        return item.itemStatus === 1
      }
    },
    {
      name: 'isInactive',
      calculate: function(item) {
        return item.itemStatus === 2
      }
    },
    {
      name: 'marginC',
      calculate: function(item) {
        if (!item.sellingPrice || !item.purchasePrice) {
          return 0
        } else {
          return (item.sellingPrice - item.purchasePrice) / item.sellingPrice
        }
      }
    },
    {
      name: 'marginB',
      calculate: function(item) {
        var priceB = item.sellingPriceB || item.sellingPrice

        if (!priceB || !item.purchasePrice) {
          return 0
        } else {
          return (priceB - item.purchasePrice) / priceB
        }
      }
    }
  ],

  validators: [
    {
      type: 'presence',
      field: 'unitId'
    },
    {
      type: 'presence',
      field: 'brandId'
    },
    {
      type: 'presence',
      field: 'countryId'
    }
  ]
})
