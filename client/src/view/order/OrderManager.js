Ext.define('Ecop.view.order.OrderManager', {
  extend: 'Ext.tab.Panel',
  xtype: 'order-manager',

  requires: [
    'Web.ux.Renderers',
    'Web.model.Order',

    'Ecop.widget.DateRangeField',
    'Ecop.widget.CustomerPicker',
    'Ecop.widget.DocidField',
    'Ecop.view.order.OrderManagerController'
  ],

  controller: 'order-manager',
  activeItem: 0,

  items: [
    {
      xtype: 'grid',
      reference: 'orders-list',
      title: '搜索订单',
      cls: 'cursor-pointer',

      store: {
        model: 'Web.model.Order',
        sorters: 'createTime'
      },

      features: [
        {
          ftype: 'summary',
          dock: 'bottom'
        }
      ],

      tbar: [
        {
          xtype: 'container',
          layout: 'vbox',
          items: [
            {
              // first row container
              xtype: 'container',
              layout: 'hbox',
              margin: '0 0 5 0',

              defaults: {
                margin: '0 10 0 0'
              },
              items: [
                {
                  xtype: 'fieldset',
                  title: '订单日期类型',
                  items: [
                    {
                      xtype: 'radiogroup',
                      itemId: 'dateType',
                      defaults: {
                        width: 80,
                        name: 'dateType'
                      },
                      items: [
                        { boxLabel: '创建日期', inputValue: 1, checked: true },
                        { boxLabel: '完成日期', inputValue: 2 }
                      ]
                    }
                  ]
                },
                {
                  xtype: 'daterange',
                  itemId: 'daterange'
                },
                {
                  xtype: 'button',
                  text: '搜 索',
                  iconCls: 'x-fa fa-search',
                  padding: 10,
                  scale: 'medium',
                  handler: 'onSearchOrder'
                }
              ]
            },
            {
              // second row container
              xtype: 'container',
              layout: 'hbox',
              defaults: {
                labelWidth: 60,
                width: 180,
                margin: '0 10 0 0'
              },
              items: [
                {
                  xtype: 'customerpicker',
                  itemId: 'customerId',
                  fieldLabel: '订单顾客:',
                  triggers: {
                    add: {
                      hidden: true
                    }
                  },
                  plugins: 'cleartrigger',
                  width: 250
                },
                {
                  xtype: 'idfield',
                  itemId: 'orderId',
                  fieldLabel: '订单编号:',
                  plugins: 'cleartrigger'
                },
                {
                  xtype: 'combo',
                  itemId: 'orderstatus',
                  fieldLabel: '订单状态:',
                  editable: false,
                  store: 'orderstatus',
                  valueField: 'id',
                  plugins: 'cleartrigger'
                }
              ]
            }
          ]
        }
      ],

      columns: {
        defaults: {
          menuDisabled: true,
          align: 'center'
        },
        items: [
          {
            xtype: 'rownumberer',
            width: 30
          },
          {
            text: '订单号',
            width: 80,
            dataIndex: 'orderId'
          },
          {
            text: '顾客名称',
            width: 100,
            align: 'left',
            dataIndex: 'customerName'
          },
          {
            text: '联系人',
            width: 100,
            align: 'left',
            dataIndex: 'recipientName'
          },
          {
            text: '创建时间',
            width: 160,
            dataIndex: 'createTime',
            formatter: 'date("Y-m-d H:i:s")'
          },
          {
            text: '完成日期',
            width: 90,
            dataIndex: 'completionDate',
            formatter: 'date("Y-m-d")'
          },
          {
            text: '订单金额',
            width: 90,
            summaryType: 'sum',
            dataIndex: 'amount',
            align: 'right',
            formatter: 'number("0,000.00")',
            summaryRenderer: function(v) {
              return Ext.util.Format.number(v, '0,000.00')
            }
          },
          {
            text: '已付金额',
            width: 90,
            summaryType: 'sum',
            dataIndex: 'paidAmount',
            align: 'right',
            formatter: 'number("0,000.00")',
            summaryRenderer: function(v) {
              return Ext.util.Format.number(v, '0,000.00')
            }
          },
          {
            text: '订单利润',
            width: 90,
            summaryType: 'sum',
            dataIndex: 'profit',
            align: 'right',
            formatter: 'number("0,000.00")',
            summaryRenderer: function(v) {
              return Ext.util.Format.number(v, '0,000.00')
            }
          },
          {
            text: '毛利率',
            width: 80,
            dataIndex: 'margin',
            align: 'right',
            formatter: 'percent("0.00")'
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
      },

      buttonAlign: 'center',
      buttons: [
        {
          text: '新建订单',
          scale: 'medium',
          handler: 'onNewOrder'
        }
      ],

      listeners: {
        cellclick: 'onOpenOrder'
      }
    }
  ]
})
