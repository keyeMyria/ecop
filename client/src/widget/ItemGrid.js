Ext.define('Ecop.widget.ItemGrid', {
  extend: 'Ext.grid.Panel',
  xtype: 'itemgrid',

  requires: ['Web.model.Item'],

  cls: 'itemgrid',
  border: false,
  columnLines: true,

  store: {
    model: 'Web.model.Item'
  },

  columns: {
    defaults: {
      sortable: true,
      align: 'left'
    },
    items: [
      {
        xtype: 'rownumberer',
        resizable: true,
        align: 'center',
        width: 35
      },
      {
        text: '商品号',
        width: 80,
        align: 'center',
        dataIndex: 'itemId',
        renderer: function(value, meta, record) {
          return record.getId() + '-' + record.get('checkDigit')
        }
      },
      {
        text: '商品名称',
        width: 250,
        dataIndex: 'itemName',
        cellWrap: true,
        editor: {
          xtype: 'textfield',
          allowBlank: false,
          minLength: 3
        }
      },
      {
        text: '规格',
        width: 150,
        dataIndex: 'specification',
        cellWrap: true,
        editor: {
          xtype: 'textfield'
        }
      },
      {
        text: '型号',
        width: 150,
        dataIndex: 'model',
        cellWrap: true,
        editor: {
          xtype: 'textfield'
        }
      },
      {
        text: '进价',
        width: 70,
        dataIndex: 'purchasePrice',
        align: 'right',
        formatter: 'number("0.00")',
        permission: 'item.update.price.purchase',
        editor: {
          xtype: 'numberfield',
          allowBlank: false,
          minValue: 0
        }
      },
      {
        text: 'C价',
        width: 70,
        dataIndex: 'sellingPrice',
        align: 'right',
        formatter: 'number("0.00")',
        editor: {
          xtype: 'numberfield',
          allowBlank: false,
          minValue: 0
        }
      },
      {
        text: '毛利',
        width: 60,
        align: 'right',
        permission: 'item.update.price.purchase',
        dataIndex: 'marginC',
        formatter: 'percent("0.0")'
      },
      {
        text: 'B价',
        width: 70,
        dataIndex: 'sellingPriceB',
        align: 'right',
        formatter: 'number("0.00")',
        editor: {
          xtype: 'numberfield',
          minValue: 0
        }
      },
      {
        text: '毛利',
        width: 60,
        align: 'right',
        permission: 'item.update.price.purchase',
        dataIndex: 'marginB',
        formatter: 'percent("0.0")'
      },
      {
        text: '单位',
        width: 50,
        align: 'center',
        dataIndex: 'unitId',
        formatter: 'store("unit")',
        editor: {
          xtype: 'combo',
          store: 'unit',
          editable: 'false',
          valueField: 'id'
        }
      },
      {
        text: '品牌',
        width: 80,
        align: 'center',
        dataIndex: 'brandId',
        formatter: 'store("brand", "id", "brandName")',
        editor: {
          xtype: 'combo',
          store: 'brand',
          editable: 'false',
          valueField: 'id',
          displayField: 'brandName'
        }
      },
      {
        text: '分类',
        width: 180,
        dataIndex: 'primaryCategoryId',
        formatter: 'store("category")'
      },
      {
        xtype: 'checkcolumn',
        text: '套餐',
        width: 50,
        invert: true,
        disabled: true,
        disabledCls: null,
        align: 'center',
        dataIndex: 'isSku'
      },
      {
        xtype: 'checkcolumn',
        text: '库存',
        width: 50,
        align: 'center',
        dataIndex: 'isStocking'
      }
    ]
  },

  viewConfig: {
    // highlight offline and inactive items
    getRowClass: function(record) {
      return ['', 'offline', 'inactive'][record.get('itemStatus')]
    }
  }
})
