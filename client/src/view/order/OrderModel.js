Ext.define('Ecop.view.order.OrderModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.order',

  formulas: {
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
     * If an order is completed, disable the save button
     */
    saveButtonDisabled: function(get) {
      return get('originalStatus') === 4
    },

    cancelButtonDisabled: function(get) {
      return get('currentOrder').phantom || !get('originalStatus') === 1
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
      return rec && rec.get('receiverName')
    },

    isNewOrder: function(get) {
      return get('currentOrder').phantom
    }
  }
})
