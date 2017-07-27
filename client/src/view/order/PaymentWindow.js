Ext.define('Ecop.view.order.PaymentWindow', {
    extend: 'Ext.window.Window',

    xtype: 'payment-window',

    /*
     * controller
     * The view controller is inherited from the parent container OrderPanel.
     */

    width: 300,
    height: 200,
    title: '订单收款',
    closable: true,
    modal: true,

    items: [{
        xtype: 'form',
        bodyPadding: 10,

        defaults: {
            labelWidth: 60,
            anchor: '100%'
        },

        items: [{
            xtype: 'combo',
            fieldLabel: '收款方式',
            reference: 'paymentMethod',
            store: 'paymentmethod',
            valueField: 'id',
            value: 1,
            displayField: 'text',
            bind: {
                disabled: '{creditSales}'
            },
            editable: false,
            autoLoadOnValue: true
        }, {
            xtype: 'numberfield',
            reference: 'paymentAmount',
            fieldLabel: '收款金额',
            allowBlank: false,
            minValue: 1,
            bind: {
                disabled: '{creditSales}',
                maxValue: '{restAmount}',
                value: {
                    bindTo: '{restAmount}',
                    single: true
                }
            }
        }, {
            xtype: 'checkbox',
            boxLabel: '后付款客户',
            bind: '{creditSales}'
        }],

        buttonAlign: 'center',
        buttons: [{
            text: '确认订单',
            handler: 'onConfirmOrder'
        }, {
            text: '取消',
            handler: function () {
                this.up('window').close();
            }
        }]
    }]
});
