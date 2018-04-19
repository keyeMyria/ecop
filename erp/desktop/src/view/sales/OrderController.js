/*
 * The controller associated with OrderPanel for manipulating a single order
 */
Ext.define('Ecop.view.sales.OrderController', {
  extend: 'Ecop.view.sales.OrderControllerBase',
  alias: 'controller.order',

  requires: [
    'Ecop.view.sales.PaymentWindow',
    'Ecop.view.sales.NotifyWindow',
    'Ecop.view.purchase.OrderPanel',
    'Ecop.view.purchase.OrderManager'
  ],

  orderType: 'S',
  rpcSaveMethod: 'order.sales.upsert',

  init: function() {
    var me = this,
      vm = me.getViewModel()

    me.callParent()

    vm.get('attachments').on({
      datachanged: function(store) {
        vm.set('hasAttachments', store.getCount() > 0)
      }
    })

    vm.bind('{orderEditable}', 'onOrderEditableChange', me)

    // when the order panel is first loaded, load the order from database
    !vm.get('currentOrder').phantom && me.loadOrder()
  },

  loadOrder: function() {
    var me = this,
      vm = me.getViewModel(),
      order = me.getCurrentOrder()

    Web.data.JsonRPC.request({
      method: 'order.sales.data',
      params: [order.getId()],
      success: function(ret) {
        me.setOrderData(ret)
        vm.get('payments').loadData(ret.payments)
        ret.header.attachments &&
          vm.get('attachments').loadData(ret.header.attachments)
      }
    })
  },

  /*
   * Recalculate the order total amount in the order header
   */
  refreshAmount: function() {
    var me = this,
      vm = me.getViewModel(),
      order = me.getCurrentOrder()

    if (!vm.get('orderEditable')) {
      return
    }

    me.callParent()
    order.set('effectiveCost', me.itemStore.sum('cost'))
  },

  getOrderForm: function() {
    return this.lookup('so-form').getForm()
  },

  /*
   * Show all orders of the customer in the order manager
   */
  onBtnShowAllOrders: function() {
    var me = this,
      order = me.getCurrentOrder()

    me
      .getView()
      .up('order-manager')
      .getController()
      .showCustomerOrder(order.get('customerId'))
  },

  /*
   * Close other order tabs which contain **unmodified** order
   */
  onCloseOtherTabs: function() {
    var me = this
    me
      .getView()
      .up('order-manager')
      .items.each(function(p) {
        if (
          p.xtype === 'orderpanel' &&
          p !== me.getView() &&
          !p.getController().getOrderChanges().changed
        ) {
          p.close()
        }
      })
  },

  /*
   * When the side panel is expanded / collapsed, the UI shall adapt based on
   * the 'sidePanelCollapsed' model variable
   */
  onSidePanelCollpase: function() {
    this.getViewModel().set('sidePanelCollapsed', true)
  },

  onSidePanelExpand: function() {
    this.getViewModel().set('sidePanelCollapsed', false)
  },

  /*
   * =====================  Supplier Order  ===========================
   */
  onOpenPurchase: function() {
    var me = this,
      sidepanel = me.lookup('sidePanel')

    if (!sidepanel.getComponent('po-manager')) {
      sidepanel.add(
        Ext.widget({
          xtype: 'po-manager',
          itemId: 'po-manager',
          viewModel: {
            data: {
              relatedOrder: me.getCurrentOrder()
            }
          }
        })
      )
    } else {
      sidepanel.setActiveItem('po-manager')
    }
    me.getViewModel().set('sidepanelTitle', '供货商订单')
    sidepanel.toggleCollapse()
  },

  /*
   * =====================  Order Payment  ===========================
   */

  doAddPayment: function() {
    var me = this

    me.doSaveOrder(function() {
      Web.data.JsonRPC.request({
        method: 'order.payment.add',
        params: [
          me.getCurrentOrder().get('orderId'),
          Ext.Date.format(me.lookup('paymentDate').getValue(), 'Y-m-d'),
          me.lookup('paymentMethod').getValue(),
          me.lookup('paymentAmount').getValue()
        ],
        success: function() {
          me.paymentDialog.close()
          me.loadOrder()
        }
      })
    })
  },

  onPaymentAdd: function() {
    var me = this

    // we add the form to the view instead to view port in order for the
    // form to access this controller
    if (!me.paymentDialog) {
      me.paymentDialog = me.getView().add({
        xtype: 'payment-window',
        // TODO: this should be moved to PaymentWindow class
        // but it seems a bug and can not be placed there.
        layout: 'fit'
      })
    }
    me.paymentDialog.show().center()
  },

  onPaymentDelete: function() {
    var me = this,
      p = me.lookup('paymentGrid').selection

    Web.data.JsonRPC.request({
      method: 'order.payment.delete',
      params: [me.getCurrentOrder().get('orderId'), p.get('paymentId')],
      success: me.loadOrder,
      scope: me
    })
  },

  /*
   * =====================  SMS Notification  ===========================
   */

  onBtnSendSMS: function() {
    var me = this

    if (!me.notifyWindow) {
      me.notifyWindow = me.getView().add({
        xtype: 'notify-window',
        layout: 'fit'
      })
    }
    me.notifyWindow.show().center()
  },

  onMessageTypeChange: function() {
    var me = this,
      vm = me.getViewModel()

    Web.data.JsonRPC.request({
      method: 'order.notify.preview',
      params: [vm.get('currentOrder.orderId'), vm.get('messageType')],
      success: function(message) {
        vm.set('previewMessage', message)
      }
    })
  },

  closeNotifyWindow: function() {
    this.notifyWindow.close()
  },

  doSendMessage: function() {
    var me = this,
      vm = me.getViewModel()

    Web.data.JsonRPC.request({
      method: 'order.notify.send',
      params: [vm.get('currentOrder.orderId'), vm.get('messageType')],
      success: function() {
        Ecop.util.Util.showInfo('信息已发送!', me.closeNotifyWindow, me)
      }
    })
  }
})
