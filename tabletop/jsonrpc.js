import request from 'superagent'

/*
 * Note we can not use this.csrfToken inside the function since the function is
 * called directly and so this would be undefined.
 */
var jsonrpc = function(options) {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 'dummy',
    method: options.method,
    params: options.params || {}
  })

  const req = request
    .post('/rpc')
    .type('application/json')
    .set('X-Requested-With', 'XMLHttpRequest')

  jsonrpc.csrfToken && req.set('Authenticity-Token', jsonrpc.csrfToken)
  jsonrpc.version && req.set('X-Client-Version', jsonrpc.version)

  req.send(data).end((err, res) => {
    if (res.body.result !== undefined && options.success) {
      options.success(res.body.result)
    } else if (res.body.error) {
      const error = res.body.error

      if (options.failure) {
        options.failure(error)
      } else if (error.code === -200) {
        // RPCUserError
        if (jsonrpc.onerror) {
          jsonrpc.onerror(error)
        }
      }
    }
  })
}

export default jsonrpc
