Ext.define('Ecop.view.sales.OrderManagerController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.order-manager',

  requires: ['Ecop.view.sales.OrderPanel'],

  onSearchOrder: function() {
    var me = this,
      view = me.getView(),
      daterange = view.down('daterange').getValue()

    Web.data.JsonRPC.request({
      method: 'order.search',
      params: [
        {
          dateType: view.down('#dateType').getValue().dateType,
          startDate: Ext.util.Format.date(daterange.start, 'Y-m-d'),
          endDate: Ext.util.Format.date(daterange.end, 'Y-m-d'),
          orderStatus: view.down('#orderstatus').getValue(),
          customerId: view.down('#customerId').getValue(),
          orderId: view.down('#orderId').getValue()
        }
      ],
      success: function(orders) {
        var grid = view.lookup('orders-list')
        grid.store.loadData(orders)
        if (grid.store.getCount() === 0) {
          Ecop.util.Util.showInfo('该时间段内没有找到符合条件的订单。')
        }
      }
    })
  },

  onOpenOrder: function(view, td, cellIndex, order) {
    var view = this.getView(),
      oid = order.get('orderId'),
      tab = view.down('#order-' + oid)

    if (tab) {
      view.setActiveTab(tab)
    } else {
      var p = Ext.widget('orderpanel', {
        itemId: 'order-' + oid,
        viewModel: {
          data: {
            currentOrder: order,
            originalStatus: order.get('orderStatus')
          }
        }
      })
      view.add(p)
      view.setActiveTab(p)
    }
  },

  onNewOrder: function() {
    var view = this.getView(),
      p,
      vm = new Ecop.view.sales.OrderModel({
        data: {
          currentOrder: Ext.create('Web.model.Order', {
            orderStatus: 1
          })
        }
      })

    p = Ext.widget('orderpanel', {
      viewModel: vm
    })
    // make sure regionCode is marked as modified
    vm.set('currentOrder.regionCode', 310110)
    view.add(p)
    view.setActiveTab(p)
  },

  showCustomerOrder: function(customerId) {
    var me = this

    Web.data.JsonRPC.request({
      method: 'order.search',
      params: [
        {
          customerId: customerId
        }
      ],
      success: function(orders) {
        var grid = me.lookup('orders-list')
        me.getView().setActiveTab(grid)
        grid.store.loadData(orders)
        if (grid.store.getCount() === 0) {
          Ecop.util.Util.showInfo('该时间段内没有找到符合条件的订单。')
        }
      }
    })
  }
})
