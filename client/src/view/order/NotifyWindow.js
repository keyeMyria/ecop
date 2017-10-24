Ext.define('Ecop.view.order.NotifyWindow', {
  extend: 'Ext.window.Window',

  xtype: 'notify-window',

  /*
   * controller
   * The view controller is inherited from the parent container OrderPanel.
   */

  width: 300,
  height: 270,
  title: '发送短信',
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
          xtype: 'displayfield',
          fieldLabel: '接收号码',
          bind: '{customerPicker.selection.mobile}'
        },
        {
          xtype: 'combo',
          fieldLabel: '短信类型',
          store: [['order.changed', '变更通知'], ['order.completed', '余款支付']],
          bind: '{messageType}',
          editable: false,
          autoLoadOnValue: true,
          listeners: {
            select: 'onMessageTypeChange'
          }
        },
        {
          xtype: 'displayfield',
          fieldLabel: '短信预览',
          labelAlign: 'top',
          bind: '{previewMessage}'
        }
      ],

      buttonAlign: 'center',
      buttons: [
        {
          text: '发送',
          handler: 'doSendMessage',
          iconCls: 'x-fa fa-paper-plane',
          bind: {
            disabled: '{!previewMessage}'
          }
        },
        {
          text: '取消',
          handler: 'closeNotifyWindow'
        }
      ]
    }
  ]
})
