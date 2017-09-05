/*
 * The controller associated with OrderPanel for manipulating a single order
 */
Ext.define('Ecop.view.order.OrderController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.order',

  requires: ['Ecop.view.order.PaymentWindow', 'Ecop.widget.ItemSelector'],

  itemStore: null, // save a reference to items grid store

  init: function() {
    var me = this,
      vm = me.getViewModel()

    /*
     * Bind events that can not easily be bound in the OrderPanel
     */
    me.itemStore = this.lookup('items-grid').getStore()
    me.itemStore.on({
      datachanged: 'refreshAmount',
      update: 'onOrderItemChange',
      remove: function() {
        var grid = me.lookup('items-grid')
        // this updates the row number after item removal
        grid.getView().refresh()
        // this ensures Ctrl+S works properly after item removal
        grid.focus()
      },
      scope: me
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
      order = me.getCurrentOrder(),
      paymentStore = me.lookup('paymentGrid').getStore()

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

        me.getViewModel().set('originalStatus', order.get('orderStatus'))

        me.itemStore.loadData(ret.items)
        me.itemStore.commitChanges()
        paymentStore.loadData(ret.payments)
      }
    })
  },

  /*
   * When `orderEditable` from view model is changed, update the grid view
   * plugins to be readonly
   */
  onOrderEditableChange: function(editable) {
    var me = this,
      grid = me.lookup('items-grid')

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
    // prevent a click event on the grid
    e.stopEvent()

    btn.getWidgetRecord().drop()
    // refresh the row number
    this.lookup('items-grid')
      .getView()
      .refresh()
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
    this.saveOrder()
  },

  saveOrder: function(callback) {
    var me = this,
      f = me.getView().getForm(),
      formValid = f.isValid(),
      order = me.getCurrentOrder(),
      headers = order.getChanges(),
      deleted = [],
      modified = [],
      added = []

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

    if (
      Ext.isEmpty(deleted) &&
      Ext.isEmpty(modified) &&
      Ext.isEmpty(added) &&
      Ext.Object.isEmpty(headers)
    ) {
      if (typeof callback === 'function') {
        callback.call(me)
      } else {
        Ecop.util.Util.showInfo('订单没有改变，无须保存!')
      }
      return
    }

    /*
     * Removes derived attributes and associations
     */
    delete headers.amount
    delete headers.cost
    delete headers.couponAmount

    Web.data.JsonRPC.request({
      method: 'order.upsert',
      params: [
        order.getId(),
        {
          header: headers,
          deleted: deleted,
          modified: modified,
          added: added
        }
      ],
      success: function(ret) {
        if (order.phantom) {
          order.set('orderId', ret)
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

  onCancelChanges: function() {
    this.getCurrentOrder().reject()
    this.loadOrder()
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
        'unitName',
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

  doAddPayment: function() {
    var me = this

    me.saveOrder(function() {
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
  }

  /*
   * ------------------------------------------------------------------------
   *
   * Coupon related code are not currently used. About to change in the
   * furture
   *
   * ------------------------------------------------------------------------
   */

  /*
  onQueryCoupon: function(queryplan) {
    queryplan.query = this.getCurrentOrder().get('orderId')
  },

  onCouponChange: function(field, newValue, oldValue) {
    var me = this,
      order = me.getCurrentOrder()
    if (newValue === 0) return
    order.set(
      'couponAmount',
      newValue ? field.getStore().getById(newValue).get('amount') : 0
    )
  }
  */
})
