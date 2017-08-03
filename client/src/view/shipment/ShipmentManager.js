Ext.define('Ecop.view.shipment.ShipmentManager', {
    extend: 'Ext.tab.Panel',
    xtype: 'shipment-manager',

    requires: [
        'Web.ux.Renderers',
        'Web.model.Shipment',

        'Ecop.widget.DateRangeField',
        'Ecop.widget.DocidField',
        'Ecop.view.shipment.ShipmentManagerController'
    ],

    controller: 'shipment-manager',
    activeItem: 0,

    items: [{
        xtype: 'form',
        reference: 'search-form',
        title: '搜索发货单',

        layout: {
            type:'vbox',
            align: 'stretch'
        },

        items: [{
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'middle'
            },

            defaults: {
                margin: 5
            },

            items: [{
                xtype: 'fieldset',
                title: '日期类型',
                layout: 'hbox',

                items: [{
                    xtype: 'radiogroup',
                    reference: 'dateType',
                    defaults: {
                        width: 100
                    },
                    items: [
                        {boxLabel: '计划发货日期', name: 'datetype', inputValue: 0, checked: true},
                        {boxLabel: '实际发货日期', name: 'datetype', inputValue: 1}
                    ]
                }]
            }, {
                xtype: 'daterange',
                reference: 'daterange'
            }, {
                xtype: 'idfield',
                reference: 'shipmentId',
                fieldLabel: '发货单号:',
                width: 160,
                labelWidth: 60
            }, {
                xtype: 'combo',
                reference: 'shipmentStatus',
                fieldLabel: '发货状态:',
                labelWidth: 60,
                editable: false,
                width: 170,
                store: 'shipmentstatus',
                valueField: 'id',
                plugins: 'cleartrigger'
            }, {
                xtype: 'button',
                text: '搜 索',
                iconCls: 'x-fa fa-search',
                handler: 'onSearchShipment'
            }]
        }, {
            xtype: 'grid',
            flex: 1,
            layout: 'fit',
            reference: 'shipment-list',
            cls: 'cursor-pointer',

            store: {
                model: 'Web.model.Shipment',
                sorters: 'shipmentId'
            },

            columns: {
                defaults: {
                    sortable: false,
                    menuDisabled: true,
                    align: 'center'
                },
                items: [{
                    xtype: 'rownumberer',
                    width: 30
                }, {
                    text: '发货单号',
                    width: 90,
                    dataIndex: 'shipmentId'
                }, {
                    text: '收货人名称',
                    width: 100,
                    align: 'left',
                    dataIndex: 'recipientName'
                }, {
                    text: '计划发货日期',
                    width: 110,
                    dataIndex: 'scheduledShippingDate',
                    formatter: 'date("Y-m-d")'
                }, {
                    text: '实际发货日期',
                    width: 110,
                    dataIndex: 'actualShippingDate',
                    formatter: 'date("Y-m-d")'
                }, {
                    text: '物流方式',
                    width: 80,
                    dataIndex: 'shipmentMethod',
                    formatter: 'store("shipmentmethod", "id", "text")'
                }, {
                    text: '承运人',
                    width: 80,
                    dataIndex: 'shipperCode',
                    formatter: 'store("shipper", "id", "text")'
                }, {
                    text: '发货状态',
                    width: 80,
                    dataIndex: 'shipmentStatus',
                    formatter: 'store("shipmentstatus", "id", "text")'
                }]
            },

            listeners: {
                cellclick: 'onOpenShipment'
            }
        }]
    }]
});
