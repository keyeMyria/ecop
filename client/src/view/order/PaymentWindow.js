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
    closeAction: 'hide',
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
            value: 2,
            displayField: 'text',
            editable: false,
            autoLoadOnValue: true
        }, {
            xtype: 'numberfield',
            reference: 'paymentAmount',
            fieldLabel: '收款金额',
            allowBlank: false,
            minValue: 1,
            bind: {
                maxValue: '{restAmount}',
                value: {
                    bindTo: '{restAmount}',
                    single: true
                }
            }
        }],

        buttonAlign: 'center',
        buttons: [{
            text: '确认收款',
            handler: 'onConfirmOrder'
        }, {
            text: '取消',
            handler: function () {
                this.up('window').close();
            }
        }]
    }]
});
