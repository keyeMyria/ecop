/*
 * The class can be used in both ExtJs and Touch. It is to be used as follows:
 *
 * Web.data.JsonRPC.request({
 *     url: '/rpc', # default value if omitted
 *     method: 'jsonMethodName',
 *     params: 'requestParameters',
 *     success: function(result, opts), // this can also be a string function name
 *     successMessage: 'Operation successful', // optional
 *     failure: function(error, opts),
 *     mask: {
 *         component: me.form,
 *         message: 'uploading'
 *     },
 *     scope: callback scope
 * });
 *
 * If url is relative, and a baseUrl is defined, the baseUrl will be joined
 * with url in the request parameters. baseUrl can be set with setBaseUrl.
 *
 * The success callback will receive content of 'result' member of the result
 * The failure callback will receive content of 'error' member of the result
 * if the method returns an error; if the Ajax call itself failed, it will
 * receive the http response object as the error argument.
 *
 * If parameter `success` is not specified, and if successMessage is specified,
 * a message box will be shown with the given message.
 *
 * Other original Ajax options will be passed as is to Ajax.request.
 *
 */

Ext.define('Web.data.JsonRPC', {
  requires: ['Ext.Ajax'],

  singleton: true,

  config: {
    baseUrl: null,
    version: null
  },

  request: function(options) {
    var me = this,
      req,
      msg,
      cmp,
      url = options.url ? options.url : '/rpc'

    // if url is relative and baseUrl is defined, combine the two to form
    // a complete url
    if (me.getBaseUrl() && !/^https?:\/\//.test(url)) {
      url = me.getBaseUrl() + url
    }

    if (options.mask) {
      ;(msg = options.mask && (options.mask.message || '请稍候...')),
        (cmp =
          options.mask &&
          (options.mask.component || Ext.ComponentQuery.query('viewport')[0]))
      delete options.mask
    }

    options.url = url
    options.originalSuccess = options.success
    options.originalFailure = options.failure
    options.originalScope = options.scope || window

    // add authenticity token to header
    if (!options.headers) {
      options.headers = {}
    }
    if (Ecop.csrfToken) {
      options.headers['X-CSRF-Token'] = Ecop.csrfToken
    }
    options.headers['X-Client-Version'] = Ecop.version

    Ext.apply(options, {
      jsonData: {
        jsonrpc: '2.0',
        id: 'dummy',
        method: options.method,
        params: options.params || {}
      },
      method: 'POST',
      success: me.success,
      failure: me.failure,
      scope: me
    })
    Ext.applyIf(options, {
      disableCaching: false
    })

    delete options.params

    if (cmp) {
      cmp.mask(msg)
      options.callback = function() {
        cmp.unmask()
      }
    }

    req = Ext.Ajax.request(options)

    if (options.async !== false) {
      return req.then(function(response) {
        return Ext.decode(response.responseText).result
      })
    }
  },

  success: function(response, opts) {
    var me = this,
      ret = Ext.decode(response.responseText)

    if (ret.result !== undefined) {
      if (opts.originalSuccess) {
        Ext.callback(opts.originalSuccess, opts.originalScope, [
          ret.result,
          opts
        ])
      } else if (opts.successMessage) {
        Ext.Msg.show({
          title: '操作成功',
          message: opts.successMessage,
          buttons: Ext.Msg.OK,
          icon: Ext.Msg.INFO
        })
      }
    } else if (ret.error) {
      if (opts.originalFailure) {
        Ext.callback(opts.originalFailure, opts.originalScope, [
          ret.error,
          opts
        ])
      } else {
        Ext.Msg.show({
          title: '错误',
          message:
            ret.error.code == -200 && ret.error.message
              ? ret.error.message
              : '当前操作发生错误！',
          buttons: Ext.Msg.OK,
          icon: Ext.Msg.ERROR
        })
      }
    }
  },

  failure: function(response, opts) {
    var me = this
    Ext.callback(opts.failure, opts.scope || window, [response, opts])
  }
})
