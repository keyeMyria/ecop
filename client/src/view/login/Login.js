Ext.define('Ecop.view.login.Login', {
    extend: 'Ext.window.Window',

    xtype: 'login-dialog',

    requires: [
        'Ecop.view.login.LoginController'
    ],

    controller: 'login',

    width: 300,
    height: 170,
    title: '请登录',
    autoShow: true,
    closeAction: 'hide',
    closable: false,
    draggable: false,
    resizable: false,
    layout: 'fit',

    items: [{
        xtype: 'form',
        reference: 'form',
        bodyPadding: 15,
        defaults: {
            xtype: 'textfield',
            anchor: '100%',
            labelWidth: 60,
            allowBlank: false,
            msgTarget: 'side',
            enableKeyEvents: true
        },
        items: [{
            name: 'user',
            fieldLabel: '用户名',
            minLength: 2,
            maxLength: 25,
            listeners: {
                specialKey: 'onTextFieldSpecialKey'
            }
        }, {
            inputType: 'password',
            name: 'password',
            id: 'password',
            fieldLabel: '登录密码',
            minLength: 6,
            minLengthText: '密码最小长度为6个字符',
            maxLength: 12,
            maxLengthText: '密码最大长度为12个字符',
            listeners: {
                keypress: 'onTextFieldKeyPress',
                specialKey: 'onTextFieldSpecialKey'
            }
        }],

        buttonAlign: 'center',
        buttons: [{
            text: '登录',
            iconCls: 'x-fa fa-sign-in',
            scale: 'medium',
            handler: 'onBtnLogin'
        }]
    }],

    listeners: {
        show: 'onLoginShow'
    }
});