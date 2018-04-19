Ext.define('Web.Logger', {
  requires: 'Web.data.JsonRPC',
  singleton: true,

  log: function(message) {
    Web.data.JsonRPC.request({
      method: 'site.log',
      params: [message]
    })
  }
})
