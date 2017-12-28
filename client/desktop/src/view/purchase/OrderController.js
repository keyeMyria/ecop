Ext.define('Ecop.view.purchase.OrderController', {
  extend: 'Ecop.view.sales.OrderControllerBase',
  alias: 'controller.po-order',

  orderType: 'P',
  rpcSaveMethod: 'order.purchase.upsert',

  init: function() {
    var me = this,
      vm = me.getViewModel()

    me.callParent()

    vm.get('orders').on({
      load: function(store) {
        if (store.getCount()) {
          // Use select method directly here will not work since the store change
          // has not yet be reflected in the grid yet
          setTimeout(function() {
            me
              .lookup('orderlist')
              .getSelectionModel()
              .select(0)
          }, 500)
        } else {
          me.addNewOrder()
        }
      }
    })
    vm.bind('{orderEditable}', 'onOrderEditableChange', me)
    me.refreshPOList()
  },

  getOrderForm: function() {
    return this.getView().getForm()
  },

  loadOrder: function() {
    var me = this,
      vm = me.getViewModel(),
      order = me.getCurrentOrder()

    Web.data.JsonRPC.request({
      method: 'order.purchase.data',
      params: [order.getId()],
      success: function(ret) {
        me.setOrderData(ret)
        vm.get('payments').loadData(ret.payments)
      }
    })
  },

  /*
   * When `orderEditable` from view model is changed, update the grid view
   * plugins to be readonly
   */
  onOrderEditableChange: function(editable) {
    var me = this,
      grid = me.lookup('itemsGrid')

    me.callParent([editable])
    if (editable) {
      me.dropZone.unlock()
    } else {
      me.dropZone.lock()
    }
  },

  onItemsGridRender: function(view) {
    this.dropZone = new Ext.grid.ViewDropZone({
      view: view,
      ddGroup: 'so-2-po',

      handleNodeDrop: function(data, record, position) {
        var view = this.view,
          store = view.getStore(),
          index,
          records = data.records,
          i,
          oi

        if (view !== data.view) {
          // create a list of new order items without orderItemId
          for (var i = 0; i < records.length; i++) {
            oi = records[i].getData()
            records[i] = Ext.create('Web.model.OrderItem', {
              itemId: oi.itemId,
              itemName: oi.itemName,
              specification: oi.specification,
              model: oi.model,
              quantity: oi.quantity,
              sellingPrice: oi.unitCost,
              unitId: oi.unitId
            })
          }
        }

        if (record && position) {
          index = store.indexOf(record)

          // 'after', or undefined (meaning a drop at index -1 on an empty View)...
          if (position !== 'before') {
            index++
          }
          store.insert(index, records)
        } else {
          // No position specified - append.
          store.add(records)
        }

        view.getSelectionModel().select(records)
        // Focus the first dropped node.
        view.getNavigationModel().setPosition(records[0])
      }
    })
  },

  addNewOrder: function() {
    var me = this,
      vm = me.getViewModel(),
      so = vm.get('relatedOrder')

    po = Ext.create('Web.model.Order')
    po.set({
      relatedOrderId: so.get('orderId'),
      customerId: so.get('customerId'),
      recipientName: so.get('recipientName'),
      regionCode: so.get('regionCode'),
      streetAddress: so.get('streetAddress'),
      recipientMobile: so.get('recipientMobile'),
      recipientPhone: so.get('recipientPhone'),
      orderStatus: 1
    })
    vm.set('currentOrder', po)
    // clear any leftover from last order
    vm.get('items').removeAll()
    vm.set('originalStatus', 1)
  },

  refreshPOList: function() {
    var me = this,
      vm = me.getViewModel()

    me
      .lookup('orderlist')
      .getSelectionModel()
      .deselectAll()
    vm.get('orders').load({ params: [vm.get('relatedOrder').get('orderId')] })
  },

  onPOSelect: function(rowmodel, record) {
    var me = this
    me.getViewModel().set('currentOrder', record)
    me.loadOrder()
  },

  doSaveOrder: function() {
    var me = this,
      vm = me.getViewModel(),
      store = vm.get('orders'),
      order = vm.get('currentOrder')

    me.callParent([
      function() {
        // if the currently saved order is not in orders store, add it
        if (store.indexOf(order) === -1) {
          store.add(order)
        }
        Ecop.util.Util.showInfo('订单保存成功!')
      }
    ])
  },

  onPurchasePayment: function() {
    var me = this,
      vm = me.getViewModel(),
      order = vm.get('currentOrder')

    Web.data.JsonRPC.request({
      method: 'order.purchase.pay',
      params: [order.getId()],
      success: function() {
        me.loadOrder()
        Ecop.util.Util.showInfo('付款成功!')
      }
    })
  }
})
