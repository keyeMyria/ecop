Ext.define('Ecop.view.order.OrderPanel', {
    extend: 'Ext.form.Panel',
    xtype: 'orderpanel',

    requires: [
        'Ext.grid.feature.Summary',
        'Ext.grid.column.Template',

        'Web.ux.Renderers',
        'Web.ux.form.RegionSelector',

        'Web.model.Order',
        'Web.model.OrderItem',
        'Web.model.OrderPayment',
        'Web.model.Coupon',

        'Ecop.widget.CustomerPicker',
        'Ecop.widget.CouponPicker',

        'Ecop.view.order.OrderController',
        'Ecop.view.order.OrderModel'
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
    bodyPadding: 5,

    layout: {
        type:'vbox',
        align: 'stretch'
    },

    defaults: {
        xtype: 'container',
        layout: 'hbox',
        margin: '0 0 5 0'
    },

    items: [{
        defaults: {
            xtype: 'displayfield',
            labelWidth: 60,
            margin: '0 10 0 0',
            minWidth: 150
        },
        items: [{
            fieldLabel: '订单编号',
            bind: '{currentOrder.orderId}',
            renderer: function (v) {
                return typeof v === 'number' ? v : '新建订单';
            }
        }, {
            xtype: 'customerpicker',
            allowBlank: false,
            fieldLabel: '顾客',
            bind: {
                value: '{currentOrder.customerId}',
                readOnly: '{!orderEditable}'
            }
        }, {
            xtype: 'combo',
            store: 'orderstatus',
            width: 120,
            valueField: 'id',
            editable: false,
            displayField: 'text',
            bind: '{currentOrder.orderStatus}',
            fieldLabel: '订单状态'
        }, {
            bind: '{currentOrder.shippingDate}',
            fieldLabel: '发货日期',
            renderer: Ext.util.Format.dateRenderer('Y-m-d')
        }, {
            bind: '{currentOrder.logisticsInfo}',
            fieldLabel: '物流单号'
        }]
    }, {
        defaults: {
            xtype: 'textfield',
            labelWidth: 60,
            margin: '0 10 0 0'
        },
        items: [{
            allowBlank: false,
            fieldLabel: '收货人',
            bind: {
                readOnly: '{!orderEditable}',
                value: '{currentOrder.recipientName}'
            }
        }, {
            name: 'recipientMobile',
            fieldLabel: '手机',
            vtype: 'mobile',
            bind: {
                readOnly: '{!orderEditable}',
                value: '{currentOrder.recipientMobile}'
            }
        }, {
            name: 'recipientPhone',
            fieldLabel: '电话',
            vtype: 'phone',
            bind: {
                readOnly: '{!orderEditable}',
                value: '{currentOrder.recipientPhone}'
            }
        }]
    }, {
        defaults: {
            labelWidth: 60,
            margin: '0 10 0 0'
        },
        items: [{
            xtype: 'regionselector',
            width: 300,
            allowBlank: false,
            fieldLabel: '地区',
            bind: {
                value: '{currentOrder.regionCode}',
                readOnly: '{!orderEditable}'
            }
        }, {
            xtype: 'textfield',
            fieldLabel: '地址',
            allowBlank: false,
            flex: 1,
            bind: {
                value: '{currentOrder.streetAddress}',
                readOnly: '{!orderEditable}'
            }
        }]
    }, {
        xtype: 'grid',
        reference: 'items-grid',
        store: {
            model: 'Web.model.OrderItem',
            proxy: {type: 'memory', reader: 'array'}
        },
        layout: 'fit',
        enableColumnMove: false,
        flex: 1,

        features: [{
            ftype: 'summary',
            dock: 'bottom'
        }],

        viewConfig: {
            plugins: [{
                ptype: 'gridviewdragdrop',
                containerScroll: true
            }]
        },

        plugins: [{
            ptype: 'cellediting',
            id: 'edit',
            clicksToEdit: 1
        }, 'headeralign'],

        columns: {
            defaults: {
                menuDisabled: true,
                sortable: false,
                headerAlign: 'center'
            },

            items: [{
                xtype: 'rownumberer',
                width: 25
            }, {
                text: '商品号',
                width: 80,
                dataIndex: 'itemId'
            }, {
                text: '商品名称',
                dataIndex: 'itemName',
                flex: 1,
                editor: {
                    xtype: 'textfield',
                    allowBlank: false,
                    minLength: 5
                }
            }, {
                text: '规格',
                width: 150,
                dataIndex: 'specification',
                editor: {
                    xtype: 'textfield'
                }
            }, {
                text: '型号',
                width: 150,
                dataIndex: 'model',
                editor: {
                    xtype: 'textfield'
                }
            }, {
                text: '数量',
                width: 70,
                align: 'center',
                summaryType: 'sum',
                dataIndex: 'quantity',
                editor: {
                    xtype: 'numberfield',
                    hideTrigger: false,
                    allowBlank: false
                }
            }, {
                text: '单位',
                width: 50,
                align: 'center',
                dataIndex: 'unitName'
            }, {
                text: '售价',
                width: 70,
                align: 'right',
                dataIndex: 'sellingPrice',
                formatter: 'number("0,000.00")',
                editor: {
                    xtype: 'numberfield',
                    allowBlank: false
                }
            }, {
                text: '金额',
                width: 70,
                align: 'right',
                formatter: 'number("0,000.00")',
                dataIndex: 'amount',
                summaryType: 'sum',
                summaryRenderer: Ext.util.Format.numberRenderer('0,000.00')
            }, {
                text: '进价',
                width: 70,
                align: 'right',
                dataIndex: 'purchasePrice',
                formatter: 'number("0,000.00")',
                editor: {
                    xtype: 'numberfield',
                    allowBlank: false
                }
            }, {
                text: '成本',
                width: 70,
                align: 'right',
                formatter: 'number("0,000.00")',
                dataIndex: 'cost',
                summaryType: 'sum',
                summaryRenderer: Ext.util.Format.numberRenderer('0,000.00')
            }, {
                text: '毛利率',
                width: 60,
                align: 'right',
                dataIndex: 'margin',
                formatter: 'percent("0.0")'
            }, {
                xtype: 'widgetcolumn',
                width: 50,
                menuDisabled: true,
                widget: {
                    xtype: 'button',
                    bind: {
                        disabled: '{!orderEditable}'
                    },
                    iconCls: 'x-fa fa-times-circle',
                    tooltip: '从当前订单中删除该商品',
                    handler: 'onOrderItemDelete'
                }
            }]
        }
    }, {
        defaults: {
            labelWidth: 50,
            padding: '0 10 0 0',
            flex: 1
        },
        items: [{
            xtype: 'numberfield',
            fieldLabel: '折扣',
            bind: {
                value: '{currentOrder.rebate}',
                readOnly: '{!orderEditable}'
            },
            listeners: {
                blur: 'refreshAmount'
            }
        }, {
            xtype: 'couponpicker',
            fieldLabel: '抵用券',
            bind: {
                value: '{currentOrder.couponUid}',
                readOnly: '{!orderEditable}'
            },
            listeners: {
                beforeQuery: 'onQueryCoupon',
                change: 'onCouponChange'
            }
        }, {
            xtype: 'numberfield',
            fieldLabel: '运费',
            minValue: 0,
            bind: {
                value: '{currentOrder.freight}',
                readOnly: '{!orderEditable}'
            },
            listeners: {
                blur: 'refreshAmount'
            }
        }, {
            xtype: 'displayfield',
            bind: '{restAmount}',
            labelWidth: 60,
            fieldLabel: '订单总额',
            padding: '0',
            renderer: Ext.util.Format.numberRenderer('0,000.00')
        }, {
            xtype: 'numberfield',
            labelWidth: 60,
            fieldLabel: '运费成本',
            minValue: 0,
            bind: {
                value: '{currentOrder.freightCost}',
                readOnly: '{!orderEditable}'
            },
            listeners: {
                blur: 'refreshAmount'
            }
        }, {
            xtype: 'displayfield',
            bind: '{currentOrder.cost}',
            fieldLabel: '总成本',
            renderer: Ext.util.Format.numberRenderer('0,000.00')
        }, {
            xtype: 'displayfield',
            bind: '{profit}',
            fieldLabel: '毛利',
            renderer: Ext.util.Format.numberRenderer('0,000.00')
        }, {
            xtype: 'displayfield',
            bind: '{margin}',
            fieldLabel: '毛利率',
            renderer: function (v) {
                return Ext.util.Format.percent(v, "0.0");
            }
        }]
    }, {
        xtype: 'container',
        height: 160,
        layout: {
            type: 'hbox',
            align: 'stretch'
        },

        defaults: {
            flex: 1
        },

        items: [{
            xtype: 'grid',
            reference: 'payment-grid',

            store: {
                model: 'Web.model.OrderPayment',
                proxy: {type: 'memory', reader: 'array'}
            },
            enableColumnMove: false,
            flex: 1,
            plugins: ['headeralign'],
            padding: '0 10 0 0',

            columns: {
                defaults: {
                    menuDisabled: true,
                    sortable: false,
                    headerAlign: 'center'
                },

                items: [{
                    text: '收款时间',
                    width: 160,
                    dataIndex: 'payTime',
                    renderer: Ext.util.Format.dateRenderer('Y-m-d H:i:s')
                }, {
                    text: '收款渠道',
                    width: 160,
                    dataIndex: 'paymentMethod',
                    renderer: Ext.util.Format.storeRenderer('paymentmethod', 'id', 'text')
                }, {
                    text: '金额',
                    width: 70,
                    align: 'center',
                    formatter: 'number("0,000.00")',
                    dataIndex: 'amount'
                }, {
                    text: '收款人',
                    align: 'center',
                    dataIndex: 'receiverName'
                }]
            }
        }, {
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
            items: [{
                fieldLabel: '内部备注',
                bind: {
                    value: '{currentOrder.internalMemo}',
                    readOnly: '{saveButtonDisabled}'
                }
            }, {
                fieldLabel: '订单备注',
                bind: {
                    value: '{currentOrder.memo}',
                    readOnly: '{!orderEditable}'
                }
            }]
        }]

    }],

    buttonAlign: 'center',
    buttons: [{
        text: '保存变更',
        scale: 'medium',
        handler: 'saveOrder',
        bind: {
            disabled: '{saveButtonDisabled}'
        }
    }, {
        text: '取消变更',
        scale: 'medium',
        handler: 'loadOrder',
        bind: {
            disabled: '{!orderEditable}'
        }
    }, {
        text: '下载订单',
        scale: 'medium',
        bind: {
            href: '{downloadUrl}'
        }
    }, {
        text: 'B价',
        scale: 'medium',
        priceType: 'B',
        handler: 'onBtnSwitchPrice',
        bind: {
            disabled: '{!orderEditable}'
        }
    }, {
        text: '收款/确认',
        scale: 'medium',
        handler: 'onBtnPayment',
        bind: {
            disabled: '{!orderEditable}'
        }
    }],

    /*
     * There does not seem to exist any other way to set the store events
     * properly on the view controller
     */
    initComponent: function () {
        var me = this
        , vm = me.getViewModel()
        , order = vm.get('currentOrder')
        , controller = me.getController()
        ;

        me.callParent();

        me.lookup('items-grid').getStore().on({
            datachanged: 'refreshAmount',
            update: 'onOrderItemChange',
            scope: controller
        });

        vm.bind('{orderEditable}', controller.onOrderEditableChange, controller);

        !order.phantom && controller.loadOrder();
    }
});