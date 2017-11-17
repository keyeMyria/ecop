Ext.define('Ecop.view.purchase.OrderModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.po-order',

  requires: ['Web.model.OrderItem'],

  data: {
    currentOrder: null,
    relatedOrder: null, // the sales order to which the purchase manager is for
    originalStatus: null
  },

  stores: {
    orders: {
      model: 'Web.model.Order',
      autoLoad: false,
      proxy: {
        type: 'jsonrpc',
        method: 'order.sales.getPurchaseOrder'
      },
      sorters: {
        property: 'createTime',
        direction: 'DESC'
      }
    },

    // the order items of the current purchase order
    items: {
      model: 'Web.model.OrderItem'
    }
  },

  formulas: {
    /*
     * An order in bid status is editable
     */
    orderEditable: function(get) {
      return get('originalStatus') === 1
    },

    isNewOrder: function(get) {
      return isNaN(get('currentOrder.orderId'))
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
     * When related sales order is closed or completed, we do not allow create
     * new purchase order
     */
    showCreatePOButton: function(get) {
      var status = get('relatedOrder.orderStatus')
      return status !== 4 && status !== 5 && !isNaN(get('currentOrder.orderId'))
    }
  }
})
