Ext.define('Ecop.view.shop.LabelPanel', {
  extend: 'Ext.grid.Panel',
  xtype: 'labelpanel',

  requires: [
    'Web.model.Item',
    'Web.data.JsonRPC',
    'Ecop.view.shop.LabelController'
  ],

  controller: 'label',

  store: {
    model: 'Web.model.Item'
  },

  enableColumnMove: false,

  plugins: [
    {
      ptype: 'cellediting',
      clicksToEdit: 1
    },
    'headeralign'
  ],

  columns: {
    defaults: {
      menuDisabled: true,
      sortable: false,
      headerAlign: 'center'
    },

    items: [
      {
        xtype: 'rownumberer'
      },
      {
        text: '商品号',
        width: 80,
        dataIndex: 'itemId'
      },
      {
        text: '商品名称',
        dataIndex: 'itemName',
        width: 250
      },
      {
        text: '规格',
        width: 150,
        dataIndex: 'specification'
      },
      {
        text: '型号',
        width: 150,
        dataIndex: 'model'
      },
      {
        text: '单位',
        width: 50,
        align: 'center',
        dataIndex: 'unitName'
      },
      {
        text: '售价',
        width: 70,
        align: 'right',
        dataIndex: 'sellingPrice',
        formatter: 'number("0,000.00")',
        editor: {
          xtype: 'numberfield',
          allowBlank: false
        }
      },
      {
        text: '数量',
        width: 70,
        align: 'center',
        dataIndex: 'quantity',
        editor: {
          xtype: 'numberfield',
          minValue: 1,
          maxValue: 3,
          allowDecimals: false,
          hideTrigger: false,
          allowBlank: false
        }
      },
      {
        xtype: 'widgetcolumn',
        width: 50,
        menuDisabled: true,
        widget: {
          xtype: 'button',
          iconCls: 'x-fa fa-times-circle',
          tooltip: '删除该商品',
          handler: 'onItemDelete'
        }
      }
    ]
  },

  buttonAlign: 'center',
  buttons: [
    {
      text: '添加商品',
      scale: 'medium',
      handler: 'onBtnAdd'
    },
    {
      text: '打印标签',
      scale: 'medium',
      handler: 'onBtnPrint'
    }
  ]
})
