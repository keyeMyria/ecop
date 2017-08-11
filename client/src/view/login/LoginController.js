Ext.define('Ecop.view.login.LoginController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.login',

  requires: ['Ecop.view.login.CapsLockTooltip'],

  onTextFieldSpecialKey: function(field, e, options) {
    if (e.getKey() === e.ENTER) {
      this.onBtnLogin()
    }
  },

  onTextFieldKeyPress: function(field, e, options) {
    var charCode = e.getCharCode(),
      me = this

    if (
      (e.shiftKey && charCode >= 97 && charCode <= 122) ||
      (!e.shiftKey && charCode >= 65 && charCode <= 90)
    ) {
      if (me.capslockTooltip === undefined) {
        me.capslockTooltip = Ext.widget('capslocktooltip')
      }

      me.capslockTooltip.show()
    } else {
      if (me.capslockTooltip !== undefined) {
        me.capslockTooltip.hide()
      }
    }
  },

  onBtnLogin: function(button, e, options) {
    var me = this

    if (me.lookup('form').isValid()) {
      me.doLogin()
    }
  },

  doLogin: function() {
    var me = this,
      values = me.lookup('form').getValues()

    Web.data.JsonRPC.request({
      method: 'auth.login',
      params: [values.user, values.password],
      scope: me,
      success: 'onLoginSuccess',
      failure: function(error) {
        Ecop.util.Util.showError(error.message)
      },
      mask: {
        component: me.getView(),
        message: '登录中，请稍候...'
      }
    })
  },

  onLoginShow: function() {
    this.lookup('form').getForm().findField('user').focus()
  },

  onLoginSuccess: function(response, opts) {
    var view = this.getView()

    Web.JsonRPCProxy.token = response.token
    Web.JsonRPCProxy.tokenHeader = 'Authenticity-Token'

    Web.data.JsonRPC.setToken(response.token)
    Web.data.JsonRPC.setTokenHeader('Authenticity-Token')
    Web.data.JsonRPC.setVersion(Ecop.version)

    Ecop.auth.currentUser = response
    view.close()
    Ext.create('Ecop.view.main.Main')
  }
})
