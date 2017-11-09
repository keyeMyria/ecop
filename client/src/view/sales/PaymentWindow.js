Ext.define('Ecop.view.sales.PaymentWindow', {
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

  items: [
    {
      xtype: 'form',
      bodyPadding: 10,

      defaults: {
        labelWidth: 60,
        allowBlank: false,
        anchor: '100%'
      },

      items: [
        {
          xtype: 'datefield',
          fieldLabel: '收款日期',
          reference: 'paymentDate',
          format: 'Y-m-d'
        },
        {
          xtype: 'combo',
          fieldLabel: '收款方式',
          reference: 'paymentMethod',
          store: 'paymentmethod',
          valueField: 'id',
          value: 2,
          displayField: 'text',
          editable: false,
          autoLoadOnValue: true
        },
        {
          xtype: 'numberfield',
          reference: 'paymentAmount',
          fieldLabel: '收款金额',
          allowBlank: false,
          bind: {
            maxValue: '{restAmount}',
            value: {
              bindTo: '{restAmount}',
              single: true
            }
          }
        }
      ],

      buttonAlign: 'center',
      buttons: [
        {
          text: '确认收款',
          handler: 'doAddPayment'
        },
        {
          text: '取消',
          handler: function() {
            this.up('window').close()
          }
        }
      ]
    }
  ]
})
