Ext.define('Ecop.view.sales.OrderPanel', {
  extend: 'Ext.Panel',
  xtype: 'orderpanel',

  requires: [
    'Ext.grid.feature.Summary',

    'Web.ux.Renderers',
    'Web.ux.form.RegionSelector',

    'Ecop.widget.PartyPicker',

    'Ecop.view.sales.OrderController',
    'Ecop.view.sales.OrderModel'
  ],

  controller: 'order',
  viewModel: {
    type: 'order'
  },

  keyMap: {
    'Ctrl+S': 'onCtrlS'
  },

  closable: true,
  bind: {
    title: '{title}'
  },

  border: false,
  cls: 'order-panel',

  layout: {
    type: 'hbox',
    align: 'stretch'
  },

  items: [
    {
      xtype: 'form',
      reference: 'so-form',
      bodyPadding: 2,
      layout: {
        type: 'vbox',
        align: 'stretch'
      },
      flex: 1,

      tbar: [
        {
          iconCls: 'x-fa fa-save',
          tooltip: '保存订单',
          handler: 'doSaveOrder'
        },
        {
          iconCls: 'x-fa fa-refresh',
          tooltip: '刷新订单',
          handler: 'onRefreshOrder',
          bind: {
            disabled: '{isNewOrder}'
          }
        },
        {
          iconCls: 'x-fa fa-download',
          tooltip: '下载订单',
          bind: {
            href: '{downloadUrl}',
            disabled: '{isNewOrder}'
          }
        },
        {
          iconCls: 'x-fa fa-paper-plane',
          tooltip: '发送信息',
          handler: 'onBtnSendSMS',
          bind: {
            disabled: '{smsButtonDisabled}'
          }
        },
        {
          xtype: 'tbseparator'
        },
        {
          iconCls: 'x-fa fa-list',
          tooltip: '显示顾客所有订单',
          handler: 'onBtnShowAllOrders',
          bind: {
            disabled: '{!currentOrder.customerId}'
          }
        },
        {
          iconCls: 'x-fa fa-close',
          tooltip: '关闭其他窗口',
          handler: 'onCloseOtherTabs'
        },
        {
          xtype: 'tbseparator'
        },
        {
          iconCls: 'x-fa fa-exchange',
          tooltip: '供应商订单',
          handler: 'onOpenPurchase'
        }
      ],

      defaults: {
        xtype: 'container',
        layout: 'hbox',
        margin: '0 0 5 0'
      },

      items: [
        {
          defaults: {
            xtype: 'displayfield',
            labelWidth: 60,
            margin: '0 10 0 0',
            minWidth: 150
          },
          items: [
            {
              fieldLabel: '订单号',
              labelWidth: 50,
              bind: '{currentOrder.orderId}',
              renderer: function(v) {
                return typeof v === 'number' ? v : '新建订单'
              }
            },
            {
              fieldLabel: '创建时间',
              bind: '{currentOrder.createTime}',
              renderer: Ext.util.Format.dateRenderer('Y-m-d H:i:s')
            },
            {
              fieldLabel: '完成日期',
              bind: {
                value: '{currentOrder.completionDate}',
                hidden: '{!currentOrder.completionDate}'
              },
              hidden: true,
              renderer: Ext.util.Format.dateRenderer('Y-m-d')
            },
            {
              xtype: 'combo',
              store: 'orderstatus',
              width: 120,
              valueField: 'id',
              editable: false,
              displayField: 'text',
              bind: '{currentOrder.orderStatus}',
              fieldLabel: '订单状态'
            },
            {
              xtype: 'combo',
              store: 'ordersource',
              width: 170,
              readOnly: true,
              valueField: 'id',
              editable: false,
              displayField: 'text',
              bind: '{currentOrder.orderSource}',
              fieldLabel: '订单来源'
            },
            {
              xtype: 'displayfield',
              fieldLabel: '外部订单号',
              labelWidth: 70,
              width: 200,
              bind: {
                value: '{currentOrder.externalOrderId}'
              }
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
              xtype: 'partypicker',
              reference: 'customerPicker',
              allowBlank: false,
              fieldLabel: '顾客',
              bind: {
                value: '{currentOrder.customerId}',
                readOnly: '{!orderEditable}'
              }
            },
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
            labelWidth: 60
          },
          items: [
            {
              xtype: 'regionselector',
              width: 300,
              margin: '0 10 0 0',
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
              flex: 1,
              margin: 0,
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

          layout: 'fit',
          flex: 1,

          bind: {
            store: '{items}'
          },

          selModel: {
            selType: 'checkboxmodel',
            checkOnly: true
          },
          enableColumnMove: false,

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
                ddGroup: 'so-2-po',
                containerScroll: true
              }
            ]
          },

          lbar: [
            {
              iconCls: 'x-fa fa-plus-circle',
              tooltip: '添加项目',
              handler: 'onBtnAddItem',
              bind: {
                disabled: '{!orderEditable}'
              }
            },
            {
              iconCls: 'x-fa fa-times-circle',
              tooltip: '删除项目',
              handler: 'onBtnRemoveItem',
              bind: {
                disabled: '{!itemsGrid.selection}'
              }
            }
          ],

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
                width: 25
              },
              {
                text: '项目名称',
                dataIndex: 'itemName',
                flex: 1,
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
                width: 150,
                cellWrap: true,
                editor: {
                  xtype: 'textfield'
                }
              },
              {
                text: '型号',
                dataIndex: 'model',
                width: 150,
                cellWrap: true,
                editor: {
                  xtype: 'textfield'
                }
              },
              {
                text: '数量',
                width: 60,
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
                text: '成本',
                width: 70,
                align: 'right',
                dataIndex: 'unitCost',
                formatter: 'number("0,000.00")',
                bind: {
                  hidden: '{!sidePanelCollapsed}'
                },
                editor: {
                  xtype: 'numberfield',
                  allowBlank: false
                }
              },
              {
                text: '毛利',
                width: 50,
                align: 'center',
                dataIndex: 'margin',
                formatter: 'percent("0")',
                bind: {
                  hidden: '{!sidePanelCollapsed}'
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
          xtype: 'panel',
          collapsible: true,
          collapsed: false,
          height: 210,
          title: '订单附件',
          layout: 'fit',

          hidden: true,
          bind: {
            hidden: '{!hasAttachments}'
          },

          items: {
            xtype: 'dataview',
            scrollable: 'y',
            bind: {
              store: '{attachments}'
            },
            itemTpl: [
              '<div class="order-attachment-thumb">',
              '<a href="{[Ecop.imageUrl]}/{name}" target="_blank" >',
              '<img src="{[Ecop.imageUrl]}/{name}@!attachment_thumb" />',
              '</a>',
              '</div>'
            ],
            itemSelector: 'div.order-attachment-thumb'
          }
        },
        {
          defaults: {
            xtype: 'displayfield',
            labelWidth: 50,
            padding: '0 10 0 0',
            flex: 1,
            renderer: Ext.util.Format.numberRenderer('0,000.00')
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
              fieldLabel: '= 总金额',
              labelWidth: 60,
              bind: '{currentOrder.amount}'
            },
            {
              fieldLabel: '剩余应付',
              labelWidth: 60,
              bind: '{restAmount}'
            },
            {
              xtype: 'numberfield',
              fieldLabel: '约定付款',
              labelWidth: 60,
              allowBlank: true,
              minValue: 1,
              hidden: true,
              plugins: 'cleartrigger',
              bind: {
                value: '{currentOrder.installmentAmount}',
                hidden: '{!restAmount}',
                // installmentAmount should not be equal to restAmount
                maxValue: '{restAmount - 1}'
              }
            },
            {
              xtype: 'displayfield',
              bind: {
                value: '{currentOrder.effectiveCost}',
                hidden: '{!sidePanelCollapsed}'
              },
              fieldLabel: '成本',
              renderer: Ext.util.Format.numberRenderer('0,000.00')
            },
            {
              xtype: 'displayfield',
              bind: {
                value: '{currentOrder.profit}',
                hidden: '{!sidePanelCollapsed}'
              },
              fieldLabel: '利润',
              renderer: Ext.util.Format.numberRenderer('0,000.00')
            },
            {
              xtype: 'displayfield',
              bind: {
                value: '{currentOrder.margin}',
                hidden: '{!sidePanelCollapsed}'
              },
              fieldLabel: '利润率',
              renderer: function(v) {
                return Ext.util.Format.percent(v, '0.0')
              }
            }
          ]
        },
        {
          xtype: 'container',
          height: 160,
          margin: 0,
          layout: {
            type: 'hbox',
            align: 'stretch'
          },

          defaults: {
            flex: 1
          },

          items: [
            {
              xtype: 'grid',
              reference: 'paymentGrid',
              bind: {
                store: '{payments}',
                hidden: '{hidePaymentGrid}'
              },

              flex: 1,
              plugins: ['headeralign'],
              padding: '0 10 0 0',

              enableColumnMove: false,
              allowDeselect: true,

              features: [
                {
                  ftype: 'summary',
                  dock: 'bottom'
                }
              ],

              lbar: [
                {
                  iconCls: 'x-fa fa-plus-circle',
                  tooltip: '收款',
                  handler: 'onPaymentAdd',
                  bind: {
                    disabled: '{!restAmount}'
                  }
                },
                {
                  iconCls: 'x-fa fa-times-circle',
                  tooltip: '删除收款',
                  handler: 'onPaymentDelete',
                  bind: {
                    disabled: '{!paymentDeletable}'
                  }
                },
                {
                  iconCls: 'x-fa fa-minus-circle',
                  tooltip: '退款',
                  disabled: true
                }
              ],

              columns: {
                defaults: {
                  menuDisabled: true,
                  sortable: false,
                  headerAlign: 'center'
                },

                items: [
                  {
                    text: '付款时间',
                    width: 160,
                    align: 'center',
                    dataIndex: 'payTime',
                    summaryType: function() {
                      return '收款总额:'
                    },
                    renderer: Ext.util.Format.dateRenderer('Y-m-d H:i:s')
                  },
                  {
                    text: '付款渠道',
                    width: 150,
                    dataIndex: 'paymentMethod',
                    renderer: Ext.util.Format.storeRenderer(
                      'paymentmethod',
                      'id',
                      'text'
                    )
                  },
                  {
                    text: '付款金额',
                    width: 90,
                    align: 'center',
                    dataIndex: 'amount',
                    formatter: 'number("0,000.00")',
                    summaryType: 'sum',
                    summaryRenderer: Ext.util.Format.numberRenderer('0,000.00')
                  },
                  {
                    text: '收款人',
                    align: 'center',
                    dataIndex: 'creatorName'
                  }
                ]
              }
            },
            {
              xtype: 'container',
              layout: {
                type: 'vbox',
                align: 'stretch'
              },
              defaults: {
                xtype: 'textarea',
                flex: 1,
                labelWidth: 60
              },
              items: [
                {
                  fieldLabel: '内部备注',
                  bind: {
                    value: '{currentOrder.internalMemo}',
                    readOnly: '{saveButtonDisabled}'
                  }
                },
                {
                  fieldLabel: '订单备注',
                  margin: 0,
                  bind: {
                    value: '{currentOrder.memo}',
                    readOnly: '{!orderEditable}'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      xtype: 'splitter'
    },
    {
      xtype: 'panel',
      collapsible: true,
      collapsed: true,
      width: '40%',
      collapseDirection: 'right',
      reference: 'sidePanel',
      layout: 'card',
      bind: {
        title: '{sidepanelTitle}'
      },
      listeners: {
        collapse: 'onSidePanelCollpase',
        expand: 'onSidePanelExpand'
      }
    }
  ]
})
