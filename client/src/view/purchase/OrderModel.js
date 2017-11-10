Ext.define('Ecop.view.purchase.OrderModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.po-order',

  requires: ['Web.model.OrderItem'],

  data: {
    currentOrder: null
  },

  stores: {
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

    /*
     * If an order is completed, disable the save button
     */
    isCompleted: function(get) {
      return get('originalStatus') === 4
    }
  }
})
