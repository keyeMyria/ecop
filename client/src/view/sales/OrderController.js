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

  /*
   * Set the order data returned by the json rpc method order.sales.data
   */
  setOrderData: function(ret) {
    var me = this,
      vm = me.getViewModel(),
      order = me.getCurrentOrder()

    /*
     * Merge detailed information into current order record,
      * as order opened by a click on an order search list
      */
    order.beginEdit()
    order.set(ret.header)
    order.endEdit()
    order.commit()

    vm.set('originalStatus', order.get('orderStatus'))

    me.itemStore.loadData(ret.items)
    me.itemStore.commitChanges()
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
   * When `orderEditable` from view model is changed, update the grid view
   * plugins to be readonly
   */
  onOrderEditableChange: function(editable) {
    var me = this,
      grid = me.lookup('itemsGrid')

    if (editable) {
      grid.getView().plugins[0].enable()
      grid.getPlugin('edit').enable()
    } else {
      grid.getView().plugins[0].disable()
      grid.getPlugin('edit').disable()
    }
  },

  /*
   * Recalculate the order total amount in the order header
   */
  refreshAmount: function() {
    var me = this,
      order = me.getCurrentOrder()

    me.callParent()
    order.set('cost', me.itemStore.sum('cost') + order.get('freightCost'))
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

  onOrderItemRightClick: function(table, record, tr, rowIndex, e) {
    var me = this,
      menu

    e.preventDefault()
    if (Ext.isEmpty(table.getSelection())) {
      table.setSelection(record)
    }

    if (!me.contextMenu) {
      me.contextMenu = Ext.widget('menu', {
        width: 100,
        plain: true,

        viewModel: me.getViewModel(),

        items: [
          {
            itemId: 'createPO',
            text: '创建供应商订单',
            hidden: true,
            bind: {
              hidden: '{isCompletedOrClosed}'
            }
          },
          {
            itemId: 'removeItem',
            text: '删除订单项目',
            hidden: true,
            bind: {
              hidden: '{!orderEditable}'
            }
          }
        ],
        listeners: {
          click: me.onContextMenuClick,
          scope: me
        }
      })
    }

    me.contextMenu.showAt(e.getXY()).focus()
  },

  onContextMenuClick: function(menu, menuItem) {
    var me = this,
      itemsGrid = this.lookup('itemsGrid'),
      sidepanel = me.lookup('sidePanel'),
      items = [],
      menuId = menuItem.getItemId()

    if (menuId === 'removeItem') {
      Ext.each(itemsGrid.getSelection(), function(oi) {
        itemsGrid.getStore().remove(oi)
      })
      // refresh the row number
      itemsGrid.getView().refresh()
      // this ensures Ctrl+S works properly after item removal
      itemsGrid.focus()
    } else if (menuId === 'createPO') {
      changes = me.getOrderChanges()
      if (changes.changed) {
        Ecop.util.Util.showError('请先保存订单修改再创建采购订单。')
        return
      }

      Ext.each(itemsGrid.getSelection(), function(oi) {
        items.push(oi.get('orderItemId'))
      })
    }
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
