Ext.define('Ecop.view.purchase.OrderManager', {
  extend: 'Ext.form.Panel',
  xtype: 'po-manager',

  requires: [
    'Ext.grid.feature.Summary',

    'Web.ux.Renderers',

    'Ecop.view.purchase.OrderController',
    'Ecop.view.purchase.OrderModel',
    'Ecop.view.purchase.OrderPanel'
  ],

  controller: 'po-order',
  viewModel: {
    type: 'po-order'
  },

  layout: {
    type: 'vbox',
    align: 'stretch'
  },
  border: false,
  bodyPadding: 5,

  items: [
    {
      xtype: 'grid',
      height: 200,
      reference: 'orderlist',

      bind: {
        store: '{orders}'
      },

      plugins: 'headeralign',

      selModel: {
        ignoreRightMouseSelection: true
      },

      features: [
        {
          ftype: 'summary',
          dock: 'bottom'
        }
      ],

      listeners: {
        select: 'onPOSelect'
      },

      columns: {
        defaults: {
          menuDisabled: true,
          headerAlign: 'center',
          align: 'center'
        },
        items: [
          {
            text: '供应商',
            flex: 1,
            align: 'left',
            dataIndex: 'supplierName'
          },
          {
            text: '创建时间',
            width: 160,
            dataIndex: 'createTime',
            formatter: 'date("Y-m-d")'
          },
          {
            text: '完成日期',
            width: 90,
            dataIndex: 'completionDate',
            formatter: 'date("Y-m-d")'
          },
          {
            text: '金额',
            width: 90,
            dataIndex: 'amount',
            align: 'right',
            formatter: 'number("0,000.00")',
            summaryType: 'sum',
            summaryRenderer: function(v) {
              return Ext.util.Format.number(v, '0,000.00')
            }
          },
          {
            text: '创建人',
            width: 80,
            dataIndex: 'creatorName'
          },
          {
            text: '订单状态',
            width: 80,
            dataIndex: 'orderStatus',
            formatter: 'store("orderstatus", "id", "text")'
          }
        ]
      }
    },
    {
      xtype: 'po-panel',
      flex: 1
    }
  ]
})
