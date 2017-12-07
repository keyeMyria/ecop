/*
 * For documentation on communication with Cainiao print component, see
 *
 * http://cloudprint-docs-resource.oss-cn-shanghai.aliyuncs.com/index.html
 */

Ext.define('Ecop.util.Cainiao', {
  singleton: true,

  requires: ['Ext.data.identifier.Uuid'],

  // private variables
  socket: null,
  connected: false,
  requestId: 1,
  requestOptions: {},

  /*
   * Return a promise that will be resovled with the successfully connected
   * connection object as the first argument.
   */
  connect: function() {
    var me = this

    return new Ext.Promise(function(resolve, reject) {
      if (me.connected) {
        resolve(me.socket)
      } else {
        var socket = (me.socket = new WebSocket('ws://192.168.0.172:13528'))

        socket.onmessage = me.onmessage.bind(me)
        socket.onerror = reject

        socket.onopen = function() {
          me.connected = true
          resolve(me.socket)
        }
      }
    })
  },

  /*
   * Return a unique task id
   */
  getTaskId: function() {
    if (!this.uuid) {
      this.uuid = Ext.create('Ext.data.identifier.Uuid')
    }

    return this.uuid.generate()
  },

  onmessage: function(event) {
    var me = this,
      data = JSON.parse(event.data),
      options

    /*
     * note we need also to handle print notifications that are not direct
     * response to outgoing commands
     */
    if (data.requestID) {
      options = me.requestOptions[data.requestID]

      if (data.cmd === 'notifyPrintResult' && data.taskStatus === 'printed') {
        options.callback(options.shipperCode, options.documentId)
      } else if (data.status == 'success') {
        options.resolve && options.resolve(data)
      } else {
        options.reject && options.reject(data)
      }
    } else {
      console.log('Message received', data)
    }
  },

  /*
   * This method handles all non-printing Cainiao request. It is for the
   * moment not used.
   */
  request: function(cmd, params) {
    var me = this,
      requestID = (me.requestId++).toString()

    // note requestID should be string for response to contain the same ID
    var request = Ext.apply(
      {
        cmd: cmd,
        requestID: requestID,
        version: '1.0'
      },
      params
    )

    return new Ext.Promise(function(resolve, reject) {
      me.connect().then(
        function(socket) {
          me.requestOptions[requestID] = {
            resolve: resolve,
            reject: reject
          }
          socket.send(JSON.stringify(request))
        },
        function(err) {
          Ecop.util.Util.showError('无法连接菜鸟打印组件！')
          reject('Connection error')
        }
      )
    })
  },

  /*
   * Print the waybill as identified by the printData. The callback will be
   * invoked when the waybill is successfully printed with the shipper code
   * and the waybill code as arguments.
   */
  printWaybill: function(shipment, printData, callback) {
    var me = this,
      requestID = (me.requestId++).toString(),
      sid = shipment.getId(),
      waybillCode = printData.data.waybillCode

    var request = {
      cmd: 'print',
      requestID: requestID,
      version: '1.0',
      task: {
        taskID: me.getTaskId(),
        preview: false,
        // printer: 'TSC TTP-342 Pro',
        printer: 'QR-668 LABEL',
        documents: [
          {
            documentID: waybillCode,
            contents: [
              {
                data: printData.data,
                templateURL: printData.templateURL
              },
              {
                data: {
                  shipmentId: sid,
                  shipmentQR: 'SH' + ',' + sid + ',' + waybillCode,
                  shipmentMemo: shipment.get('shipmentMemo')
                },
                templateURL: printData.customAreaURL
              }
            ]
          }
        ]
      }
    }

    me.connect().then(
      function(socket) {
        me.requestOptions[requestID] = {
          shipperCode: printData.data.cpCode,
          documentId: waybillCode,
          callback: callback
        }
        socket.send(JSON.stringify(request))
      },
      function(err) {
        Ecop.util.Util.showError('无法连接菜鸟打印组件！')
        reject('Connection error')
      }
    )
  }
})
