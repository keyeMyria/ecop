Ext.define('Ecop.view.purchase.OrderPanel', {
  extend: 'Ext.form.Panel',
  xtype: 'po-panel',

  requires: [
    'Ext.grid.feature.Summary',
    'Ecop.widget.PartyPicker',
    'Web.ux.Renderers'
  ],

  border: false,

  layout: {
    type: 'vbox',
    align: 'stretch'
  },

  keyMap: {
    'Ctrl+S': 'onCtrlS'
  },

  tbar: [
    {
      iconCls: 'x-fa fa-save',
      tooltip: '保存订单',
      handler: 'doSaveOrder',
      bind: {
        disabled: '{isCompleted}'
      }
    },
    {
      iconCls: 'x-fa fa-plus-circle',
      tooltip: '添加项目',
      handler: 'onBtnAddItem',
      bind: {
        disabled: '{!orderEditable}'
      }
    },
    {
      iconCls: 'x-fa fa-refresh',
      tooltip: '刷新订单',
      handler: 'onRefreshOrder'
    },
    {
      iconCls: 'x-fa fa-download',
      tooltip: '下载订单',
      bind: {
        href: '{downloadUrl}',
        disabled: '{isNewOrder}'
      }
    }
  ],

  defaults: {
    xtype: 'container',
    layout: 'hbox',
    margin: '0 0 5 0'
  },

  items: [
    {
      margin: '5 0 5 0',
      defaults: {
        xtype: 'displayfield',
        labelWidth: 60,
        margin: '0 10 0 0',
      },
      items: [
        {
          fieldLabel: '订单号',
          labelWidth: 50,
          bind: '{currentOrder.orderId}'
        },
        {
          xtype: 'partypicker',
          partyType: 'V',
          fieldLabel: '供应商',
          allowBlank: false,
          flex: 1,
          bind: '{currentOrder.supplierId}'
        },
        {
          fieldLabel: '创建时间',
          bind: '{currentOrder.createTime}',
          renderer: Ext.util.Format.dateRenderer('Y-m-d H:i:s')
        },
        {
          xtype: 'combo',
          fieldLabel: '状态',
          width: 130,
          labelWidth: 40,
          margin: 0,
          store: 'orderstatus',
          valueField: 'id',
          editable: false,
          displayField: 'text',
          bind: '{currentOrder.orderStatus}',
        }
      ]
    },
    {
      defaults: {
        xtype: 'textfield',
        labelWidth: 40,
        margin: '0 10 0 0'
      },
      items: [
        {
          allowBlank: false,
          labelWidth: 50,
          fieldLabel: '联系人',
          bind: {
            readOnly: '{!orderEditable}',
            value: '{currentOrder.recipientName}'
          }
        },
        {
          name: 'recipientMobile',
          fieldLabel: '手机',
          maxWidth: 160,
          vtype: 'mobile',
          enforceMaxLength: true,
          maxLength: 11,
          validateOnChange: false,
          bind: {
            readOnly: '{!orderEditable}',
            value: '{currentOrder.recipientMobile}'
          }
        },
        {
          name: 'recipientPhone',
          fieldLabel: '电话',
          maxWidth: 160,
          vtype: 'phone',
          validateOnChange: false,
          bind: {
            readOnly: '{!orderEditable}',
            value: '{currentOrder.recipientPhone}'
          }
        }
      ]
    },
    {
      defaults: {
        labelWidth: 50,
        margin: '0 10 0 0'
      },
      items: [
        {
          xtype: 'regionselector',
          width: 300,
          allowBlank: false,
          fieldLabel: '地区',
          bind: {
            value: '{currentOrder.regionCode}',
            readOnly: '{!orderEditable}'
          }
        },
        {
          xtype: 'textfield',
          fieldLabel: '地址',
          allowBlank: false,
          margin: 0,
          flex: 1,
          bind: {
            value: '{currentOrder.streetAddress}',
            readOnly: '{!orderEditable}'
          }
        }
      ]
    },
    {
      xtype: 'grid',
      reference: 'itemsGrid',
      bind: {
        store: '{items}'
      },
      layout: 'fit',
      enableColumnMove: false,
      flex: 1,

      features: [
        {
          ftype: 'summary',
          dock: 'bottom'
        }
      ],

      viewConfig: {
        plugins: [
          {
            ptype: 'gridviewdragdrop',
            containerScroll: true
          }
        ]
      },

      listeners: {
        rowcontextmenu: 'onOrderItemRightClick'
      },

      plugins: [
        {
          ptype: 'cellediting',
          id: 'edit',
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
            xtype: 'rownumberer',
            width: 25,
            align: 'center'
          },
          {
            text: '项目名称',
            dataIndex: 'itemName',
            flex: 2,
            cellWrap: true,
            editor: {
              xtype: 'textfield',
              allowBlank: false,
              minLength: 5
            }
          },
          {
            text: '规格',
            dataIndex: 'specification',
            flex: 1,
            cellWrap: true,
            editor: {
              xtype: 'textfield'
            }
          },
          {
            text: '型号',
            dataIndex: 'model',
            cellWrap: true,
            flex: 1,
            editor: {
              xtype: 'textfield'
            }
          },
          {
            text: '数量',
            width: 55,
            align: 'center',
            dataIndex: 'quantity',
            editor: {
              xtype: 'numberfield',
              hideTrigger: false,
              allowBlank: false
            }
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
            text: '单价',
            width: 55,
            align: 'right',
            dataIndex: 'sellingPrice',
            formatter: 'number("0,000.00")',
            editor: {
              xtype: 'numberfield',
              allowBlank: false
            }
          },
          {
            text: '金额',
            width: 70,
            align: 'right',
            formatter: 'number("0,000.00")',
            dataIndex: 'amount',
            summaryType: 'sum',
            summaryRenderer: Ext.util.Format.numberRenderer('0,000.00')
          }
        ]
      }
    },
    {
      defaults: {
        labelWidth: 50,
        padding: '0 10 0 0',
        flex: 1
      },
      items: [
        {
          xtype: 'numberfield',
          fieldLabel: '- 折扣',
          bind: {
            value: '{currentOrder.rebate}',
            readOnly: '{!orderEditable}'
          },
          listeners: {
            blur: 'refreshAmount'
          }
        },
        {
          xtype: 'numberfield',
          fieldLabel: '+ 运费',
          minValue: 0,
          bind: {
            value: '{currentOrder.freight}',
            readOnly: '{!orderEditable}'
          },
          listeners: {
            blur: 'refreshAmount'
          }
        },
        {
          xtype: 'displayfield',
          labelWidth: 60,
          fieldLabel: '= 总金额',
          renderer: Ext.util.Format.numberRenderer('0,000.00'),
          bind: '{currentOrder.amount}'
        }
      ]
    },
    {
      xtype: 'textarea',
      maxHeight: 60,
      labelWidth: 60,
      margin: 0,
      fieldLabel: '订单备注',
      bind: {
        value: '{currentOrder.memo}',
        readOnly: '{!orderEditable}'
      }
    }
  ]
})
