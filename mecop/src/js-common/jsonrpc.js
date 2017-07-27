/*global Ecop */

import request from 'superagent'
import message from './message'


export default function jsonrpc (options) {
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
        .set('Authenticity-Token', Ecop.csrfToken)
        .set('X-Client-Version', Ecop.version)

    req.send(data).end((err, res) => {
        if (res.body.result !== undefined && options.success) {
            options.success(res.body.result)
        } else if (res.body.error) {
            const error = res.body.error

            if (options.failure) {
                options.failure(error)
            } else if (error.code === -200) { // RPCUserError
                const level = (error.data && error.data.level) || 'error';
                message[level](error.message, {autoHide: 5000})
            }
        }
    })
}
