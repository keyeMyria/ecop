Ext.define('Ecop.view.sales.OrderModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.order',

  requires: ['Web.model.OrderItem', 'Web.model.OrderPayment'],

  data: {
    currentOrder: null,
    originalStatus: 1,
    hasAttachments: false,
    sidePanelCollapsed: true,

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

    payableAmount: function(get) {
      return get('currentOrder.installmentAmount') || get('restAmount')
    },

    title: function(get) {
      return typeof get('currentOrder.orderId') === 'string'
        ? '新建订单'
        : get('currentOrder.recipientName')
    },

    downloadUrl: function(get) {
      return Ext.String.format(
        '/order/{0}.pdf?token={1}',
        get('currentOrder.orderId'),
        Ecop.csrfToken
      )
    },

    /*
     * An order in bid status is editable
     */
    orderEditable: function(get) {
      return get('originalStatus') === 1
    },

    /*
     * A payment entry is only deletable when it is added by staff
     */
    paymentDeletable: function(get) {
      var rec = get('paymentGrid.selection')
      return rec && rec.get('creatorName')
    },

    /*
     * Payment grid is hidden for external orders or when side panel is open
     */
    hidePaymentGrid: function(get) {
      return !get('sidePanelCollapsed') || get('currentOrder.isExternal')
    },

    isNewOrder: function(get) {
      return isNaN(get('currentOrder.orderId'))
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
