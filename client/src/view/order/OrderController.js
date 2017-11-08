/*
 * The controller associated with OrderPanel for manipulating a single order
 */
Ext.define('Ecop.view.order.OrderController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.order',

  requires: [
    'Ecop.view.order.PaymentWindow',
    'Ecop.view.order.NotifyWindow',
    'Ecop.widget.ItemSelector'
  ],

  itemStore: null, // save a reference to items grid store

  init: function() {
    var me = this,
      vm = me.getViewModel()

    /*
     * Bind events that can not easily be bound in the OrderPanel
     */
    me.itemStore = vm.get('items')
    me.itemStore.on({
      datachanged: 'refreshAmount',
      update: 'onOrderItemChange',
      scope: me
    })

    vm.get('attachments').on({
      datachanged: function(store) {
        vm.set('hasAttachments', store.getCount() > 0)
      }
    })

    vm.bind('{orderEditable}', 'onOrderEditableChange', me)

    // when the order panel is first loaded, load the order from database
    !vm.get('currentOrder').phantom && me.loadOrder()
  },

  getCurrentOrder: function() {
    return this.getViewModel().get('currentOrder')
  },

  loadOrder: function() {
    var me = this,
      vm = me.getViewModel(),
      order = me.getCurrentOrder()

    Web.data.JsonRPC.request({
      method: 'order.data',
      params: [order.getId()],
      success: function(ret) {
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

    order.set(
      'amount',
      me.itemStore.sum('amount') + order.get('freight') - order.get('rebate')
    )
    order.set('cost', me.itemStore.sum('cost') + order.get('freightCost'))
  },

  onOrderItemDelete: function(btn, e) {
    var grid = this.lookup('itemsGrid')
    // prevent a click event on the grid
    e.stopEvent()

    btn.getWidgetRecord().drop()
    // refresh the row number
    grid.getView().refresh()
    // this ensures Ctrl+S works properly after item removal
    grid.focus()
  },

  onOrderItemChange: function(store, record, op, fields) {
    if (fields && fields[0] !== 'amount') {
      record.set('amount', record.get('sellingPrice') * record.get('quantity'))
      this.refreshAmount()
    }
  },

  /*
   * Using Ctrl+S one can always save any changes to the order. Even when the
   * order is already closed, the staff shall still be able to change the order
   * status and internal memo. The fields that can be changed on a closed order
   * is controlled by the UI, i.e. OrderPanel
   */
  onCtrlS: function(evt) {
    evt.preventDefault()
    this.doSaveOrder()
  },

  /*
   * Return the order changes in an object:
   * {
   *   changed: true or false
   *   header: changed fields of the order header
   *   added: list of added order items
   *   modified: list of modified order items
   *   deleted: list of deleted orderItemId's
   * }
   */
  getOrderChanges: function() {
    var me = this,
      header = me.getCurrentOrder().getChanges(),
      deleted = [],
      modified = [],
      added = []

    /*
     * Removes derived attributes
     */
    delete header.amount
    delete header.cost

    Ext.each(me.itemStore.getRemovedRecords(), function(r) {
      deleted.push(r.get('orderItemId'))
    })

    // update the order item position
    for (var i = 0; i < me.itemStore.getCount(); i++) {
      me.itemStore.getAt(i).set('pos', i)
    }

    Ext.each(me.itemStore.getModifiedRecords(), function(r) {
      var fields = [
          'itemId',
          'itemName',
          'specification',
          'model',
          'quantity',
          'purchasePrice',
          'sellingPrice',
          'unitId',
          'pos'
        ],
        oi = {}

      for (var i = 0; i < fields.length; ++i) {
        oi[fields[i]] = r.get(fields[i])
      }
      if (typeof r.get('orderItemId') === 'number') {
        modified.push([r.get('orderItemId'), oi])
      } else {
        added.push([r.get('itemId'), oi])
      }
    })

    return {
      header: header,
      added: added,
      modified: modified,
      deleted: deleted,
      changed: !(
        Ext.isEmpty(deleted) &&
        Ext.isEmpty(modified) &&
        Ext.isEmpty(added) &&
        Ext.Object.isEmpty(header)
      )
    }
  },

  doSaveOrder: function(callback) {
    var me = this,
      f = me.getView().getForm(),
      formValid = f.isValid(),
      order = me.getCurrentOrder(),
      changes

    if (formValid) {
      if (!order.get('recipientPhone') && !order.get('recipientMobile')) {
        f.markInvalid({
          recipientMobile: '必须输入手机或固定电话之一',
          recipientPhone: '必须输入手机或固定电话之一'
        })
        formValid = false
      } else {
        f.findField('recipientPhone').clearInvalid()
        f.findField('recipientMobile').clearInvalid()
      }
    }

    if (!formValid) {
      Ecop.util.Util.showError('输入数据存在错误，请检查。')
      return
    }

    if (me.itemStore.getCount() === 0) {
      Ecop.util.Util.showError('不允许保存没有项目的订单！')
      return
    }

    changes = me.getOrderChanges()

    if (!changes.changed) {
      if (typeof callback === 'function') {
        callback.call(me)
      } else {
        Ecop.util.Util.showInfo('订单没有改变，无须保存!')
      }
      return
    }

    Web.data.JsonRPC.request({
      method: 'order.sales.upsert',
      params: [
        order.getId(),
        {
          header: changes.header,
          deleted: changes.deleted,
          modified: changes.modified,
          added: changes.added
        }
      ],
      success: function(ret) {
        if (order.phantom) {
          order.set('orderId', ret)
          order.commit()
        }
        if (typeof callback === 'function') {
          callback.call(me)
        } else {
          me.loadOrder()
          Ecop.util.Util.showInfo('订单保存成功!')
        }
      }
    })
  },

  doRefreshOrder: function() {
    this.getCurrentOrder().reject()
    this.loadOrder()
  },

  onRefreshOrder: function() {
    var me = this,
      changes = me.getOrderChanges()

    if (changes.changed) {
      Ext.Msg.confirm('请确认', '刷新订单将丢失未保存的订单变更，是否继续？', function(btnId) {
        if (btnId === 'yes') {
          me.doRefreshOrder()
        }
      })
    } else {
      me.doRefreshOrder()
    }
  },

  onBtnSwitchPrice: function(btn) {
    var me = this,
      itemIds = []

    me.itemStore.each(function(oi) {
      itemIds.push(oi.get('itemId'))
    })
    Web.data.JsonRPC.request({
      method: 'order.price.get',
      params: [itemIds, btn.priceType],
      success: function(prices) {
        me.itemStore.each(function(oi) {
          oi.set('sellingPrice', prices[oi.get('itemId')])
        })
        btn.priceType = btn.priceType == 'B' ? 'C' : 'B'
        btn.setText(btn.priceType == 'B' ? 'B价' : 'C价')
      }
    })
  },

  onBtnAddItem: function() {
    var me = this
    if (!me.selectorWin) {
      me.selectorWin = me.getView().add(
        Ext.widget('itemselector', {
          closeAction: 'hide',
          height: 600,
          width: 1200,
          listeners: {
            itemselect: me.doAddItems,
            scope: me
          }
        })
      )
    }

    me.selectorWin.down('itembrowser #itemStatus').setStore(
      new Ext.data.ArrayStore({
        fields: ['id', 'text'],
        data: [[0, '在线'], [1, '下线']]
      })
    )

    me.selectorWin.show()
  },

  doAddItems: function(items) {
    var me = this,
      oi,
      i,
      fields = [
        'itemId',
        'itemName',
        'specification',
        'purchasePrice',
        'model',
        'unitId',
        'sellingPrice'
      ]

    Ext.each(items, function(item) {
      // The selector widget could return frozen item when an item id is entered
      // directly. This check guard against this pssibility.
      if (item.get('itemStatus') === 2) {
        Ecop.util.Util.showError(
          Ext.String.format('商品{0}已冻结，不能添加到订单！', item.getId())
        )
      } else {
        oi = {}
        for (i = 0; i < fields.length; ++i) {
          oi[fields[i]] = item.get(fields[i])
        }
        oi.quantity = 1
        oi.amount = item.get('sellingPrice')
        me.itemStore.add(Web.model.OrderItem(oi))
      }
    })
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
   * When the side panel is expanded / collapsed, the UI shall adapt based on
   * the 'sidePanelCollapsed' model variable
   */
  onSidePanelCollpase: function() {
    this.getViewModel().set('sidePanelCollapsed', true)
  },

  onSidePanelExpand: function() {
    this.getViewModel().set('sidePanelCollapsed', false)
  },
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
