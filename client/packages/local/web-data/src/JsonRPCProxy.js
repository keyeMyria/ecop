/*
 * Load data into store using jsonrpc. Use like:
 *    store: {
 *        autoLoad: false,
 *        proxy: {
 *            type: 'jsonrpc',
 *            method: 'param.get'
 *            params: ['unit']
 *        }
 *    }
 *
 * When url is not defined explictly, it defauls to '/rpc'. If url is relative
 * and a class static property `baseUrl` is defined, the baseUrl will be joined
 * with url in the request parameters.
 */

Ext.define('Web.JsonRPCProxy', {
  requires: 'Ext.Ajax',
  extend: 'Ext.data.proxy.Ajax',
  alias: 'proxy.jsonrpc',

  config: {
    noCache: false
  },

  constructor: function(config) {
    var me = this,
      url
    me.rpcMethod = config.method
    me.params = config.params || {}
    me.async = config.async === undefined ? true : config.async
    config.url = config.url || '/rpc'
    me.callParent(arguments)
  },

  statics: {
    baseUrl: null,
    token: null,
    tokenHeader: 'X-CSRF-Token'
  },

  doRequest: function(operation) {
    var me = this,
      config,
      request = me.buildRequest(operation),
      url = request.getUrl()

    config = {
      binary: me.getBinary(),
      headers: me.getHeaders() || {},
      timeout: me.getTimeout(),
      scope: me,
      callback: me.createRequestCallback(request, operation),
      method: 'POST',
      useDefaultXhrHeader: me.getUseDefaultXhrHeader(),
      // prevent the page parameters to be added to the url
      params: undefined,

      jsonData: {
        jsonrpc: '2.0',
        id: 'dummy',
        method: me.rpcMethod,
        params: Ext.Object.isEmpty(me.params)
          ? operation.getParams()
          : me.params
      }
    }

    if (me.self.baseUrl && Ext.String.startsWith(url, '/')) {
      config.url = me.self.baseUrl + url
    }
    // add authenticity token to header
    config.headers[me.self.tokenHeader] = me.self.token

    request.setConfig(config)
    return me.sendRequest(request)
  },

  extractResponseData: function(response) {
    return Ext.decode(response.responseText).result
  },

  /*
     * Allows the store to load synchronously
     */
  sendRequest: function(request) {
    request.setRawRequest(
      Ext.Ajax.request(
        Ext.apply(request.getCurrentConfig(), { async: this.async })
      )
    )
    this.lastRequest = request
    return request
  }
})
