Ext.define('Ecop.view.shipment.ShipmentPanel', {
    extend: 'Ext.form.Panel',
    xtype: 'shipmentpanel',

    requires: [
        'Web.model.ShipmentSku',
        'Web.model.ShipmentPackage',
        'Ecop.view.shipment.ShipmentModel',
        'Ecop.view.shipment.ShipmentController'
    ],

    controller: 'shipment',
    viewModel: {
        type: 'shipment'
    },

    closable: true,
    layout: {
        type:'vbox',
        align: 'stretch'
    },

    bind: {
        title: '{shipment.shipmentId}'
    },

    border: false,
    bodyPadding: 5,

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
            fieldLabel: '发货单号',
            bind: '{shipment.shipmentId}'
        }, {
            fieldLabel: '发货状态',
            width: 120,
            bind: '{shipment.shipmentStatus}',
            renderer: Ext.util.Format.storeRenderer('shipmentstatus', 'id', 'text')
        }, {
            fieldLabel: '物流方式',
            bind: '{shipment.shipmentMethod}',
            renderer: Ext.util.Format.storeRenderer('shipmentmethod', 'id', 'text')
        }, {
            fieldLabel: '承运人',
            bind: '{shipment.shipperCode}',
            renderer: Ext.util.Format.storeRenderer('shipper', 'id', 'text')
        }, {
            fieldLabel: '计划发货日期',
            labelWidth: 90,
            width: 200,
            bind: '{shipment.scheduledShippingDate}',
            renderer: Ext.util.Format.dateRenderer('Y-m-d')
        }, {
            fieldLabel: '实际发货日期',
            labelWidth: 90,
            width: 200,
            bind: '{shipment.actualShippingDate}',
            renderer: Ext.util.Format.dateRenderer('Y-m-d')
        }]
    }, {
        defaults: {
            xtype: 'displayfield',
            labelWidth: 60,
            margin: '0 10 0 0',
            minWidth: 150
        },
        items: [{
            fieldLabel: '收货人',
            bind: '{shipment.recipientName}'
        }, {
            fieldLabel: '发货地址',
            bind: '{shipment.regionName}{shipment.streetAddress}',
            flex: 1
        },{
            fieldLabel: '手机',
            name: 'recipientMobile',
            bind: '{shipment.recipientMobile}'
        }, {
            fieldLabel: '电话',
            name: 'recipientPhone',
            bind: '{shipment.recipientPhone}'
        }]
    }, {
        xtype: 'grid',
        reference: 'skus-grid',
        store: {
            model: 'Web.model.ShipmentSku',
            proxy: {type: 'memory', reader: 'array'}
        },
        layout: 'fit',
        enableColumnMove: false,
        flex: 1,

        plugins: ['headeralign'],

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
                dataIndex: 'skuId'
            }, {
                text: '商品名称',
                dataIndex: 'itemName',
                flex: 1
            }, {
                text: '规格',
                width: 150,
                dataIndex: 'specification'
            }, {
                text: '型号',
                width: 150,
                dataIndex: 'model'
            }, {
                text: '发货数量',
                width: 90,
                formatter: 'number("0.000")',
                align: 'right',
                dataIndex: 'quantity'
            }, {
                text: '单位',
                width: 50,
                align: 'center',
                dataIndex: 'unitId',
                formatter: 'store("unit")'
            }, {
                text: '单位重量',
                width: 90,
                align: 'right',
                formatter: 'number("0,000.00")',
                dataIndex: 'weight'
            }]
        }
    }, {
        xtype: 'container',
        layout: {
            type: 'hbox',
            align: 'stretch'
        },
        height: 120,

        items: [{
            xtype: 'grid',
            reference: 'package-grid',

            store: {
                model: 'Web.model.ShipmentPackage',
                proxy: {type: 'memory', reader: 'array'}
            },
            enableColumnMove: false,
            flex: 1,
            plugins: ['headeralign'],

            columns: {
                defaults: {
                    menuDisabled: true,
                    sortable: false,
                    headerAlign: 'center'
                },

                items: [{
                    text: '运单号',
                    width: 120,
                    align: 'center',
                    dataIndex: 'documentId'
                }, {
                    text: '运单打印时间',
                    width: 160,
                    dataIndex: 'printTime',
                    renderer: Ext.util.Format.dateRenderer('Y-m-d H:i:s')
                }, {
                    text: '运单状态',
                    width: 80,
                    align: 'center',
                    dataIndex: 'packageStatus',
                    renderer: Ext.util.Format.storeRenderer('packagestatus', 'id', 'text')
                }, {
                    text: '重量',
                    width: 60,
                    align: 'center',
                    formatter: 'number("0,000.0")',
                    dataIndex: 'weight'
                }, {
                    text: '运费',
                    width: 60,
                    align: 'center',
                    formatter: 'number("0,000.0")',
                    dataIndex: 'freight'
                }, {
                    xtype: 'actioncolumn',
                    text: '运单操作',
                    width: 80,
                    align: 'center',
                    items: [{
                        iconCls: 'x-fa fa-print',
                        tooltip: '重新打印面单',
                        handler: 'onReprintWaybill',
                        isDisabled: function (view, rowIdx, colIdx, item, record) {
                            return record.get('packageStatus') > 1;
                        }
                    }, {
                        iconCls: 'x-fa fa-times',
                        tooltip: '取消面单',
                        handler: 'onCancelWaybill',
                        // after the bill is in transit, it can no longer be
                        // cancelled
                        isDisabled: function (view, rowIdx, colIdx, item, record) {
                            return record.get('packageStatus') > 2;
                        }
                   }]
                }]
            }
        }, {
            xtype: 'textarea',
            margin: '0 0 0 5',
            editable: false,
            bind: '{shipment.shipmentMemo}',
            labelWidth: 60,
            flex: 1,
            fieldLabel: '运单备注'
        }]
    }],

    buttonAlign: 'center',
    buttons: [{
        text: '打印发货单',
        scale: 'medium',
        bind: {
            href: '{pickingListUrl}'
        }
    }, {
        text: '打印新面单',
        scale: 'medium',
        handler: 'onPrintNewWaybill',
        bind: {
            hidden: '{!isCourier}'
        }
    }],

    listeners: {
        afterrender: 'loadShipment'
    }

});