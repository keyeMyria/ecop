Ext.define('Web.store.RegionStore', {
  extend: 'Ext.data.TreeStore',
  alias: 'store.regions',
  requires: ['Web.JsonRPCProxy', 'Web.data.JsonRPC'],
  storeId: 'regions',
  singleton: true,
  autoLoad: false,
  asynchronousLoad: false,

  proxy: {
    type: 'jsonrpc',
    method: 'regions.get.legacy'
  },

  defaultRootProperty: 'c',

  /*
     * returns the **full** name of the region given the region code.
     * If the store is not loaded yet, load it
     * TODO: find some way to avoid synchronous xhr request
     */
  getRegionName: function(code) {
    var me = this,
      node,
      ret = ''

    // When getRegionName is called with null, as when empty address
    // field is initialized, save a load
    if (!code) {
      return ret
    }

    if (!me.isLoaded()) {
      Web.data.JsonRPC.request({
        method: 'regions.get.legacy',
        async: false,
        success: function(response) {
          me.setProxy({
            type: 'memory',
            reader: {
              type: 'json'
            },
            data: response
          })
          me.load()
        },
        scope: me
      })
    }

    node = me.getNodeById(code)
    if (node) {
      do {
        ret = node.get('t') + ret
        node = node.parentNode
      } while (!node.isRoot())
    }
    return ret
  }
})
