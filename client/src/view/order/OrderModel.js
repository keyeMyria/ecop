Ext.define('Ecop.view.order.OrderModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.order',

  requires: ['Web.model.OrderItem', 'Web.model.OrderPayment'],

  data: {
    currentOrder: null,
    originalStatus: 1,
    hasAttachments: false,

    // for use in NotifyWindow
    messageType: null,
    previewMessage: null
  },

  stores: {
    items: {
      model: 'Web.model.OrderItem',
      proxy: { type: 'memory', reader: 'array' }
    },

    payments: {
      model: 'Web.model.OrderPayment',
      proxy: { type: 'memory', reader: 'array' }
    },

    attachments: {
      fields: ['name'],
      proxy: { type: 'memory', reader: 'json' }
    }
  },

  formulas: {
    /*
     * To avoid float precision error, e.g. 5310.15-3977.75 < 1332.4 === true
     */
    restAmount: function(get) {
      return (
        Math.round(
          (get('currentOrder.amount') - get('currentOrder.paidAmount')) * 100
        ) / 100
      )
    },

    title: function(get) {
      return typeof get('currentOrder.orderId') === 'string'
        ? '新建订单'
        : get('currentOrder.recipientName')
    },

    downloadUrl: function(get) {
      return Ext.String.format(
        '/order/{0}.pdf?uid={1}&token={2}',
        get('currentOrder.orderId'),
        Ecop.auth.currentUser.partyId,
        Web.JsonRPCProxy.token
      )
    },

    /*
     * An order in bid status is editable
     */
    orderEditable: function(get) {
      return get('originalStatus') === 1
    },

    /*
     * If an order is completed, disable the save button
     */
    isCompleted: function(get) {
      return get('originalStatus') === 4
    },

    /*
     * A payment entry is only deletable when it is added by staff
     */
    paymentDeletable: function(get) {
      var rec = get('paymentGrid.selection')
      return rec && rec.get('receiverName')
    },

    isNewOrder: function(get) {
      return get('currentOrder').phantom
    },

    smsButtonDisabled: {
      bind: {
        bindTo: '{currentOrder}',
        deep: true
      },
      get: function(order) {
        return order.phantom || !order.get('customerId')
      }
    }
  }
})
