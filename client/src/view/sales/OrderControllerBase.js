Ext.define('Ecop.view.sales.OrderControllerBase', {
  extend: 'Ext.app.ViewController',

  requires: ['Ecop.widget.ItemSelector'],

  itemStore: null, // save a reference to items grid store
  orderType: null, // 'P' or 'S', to be overriden
  rpcSaveMethod: null, // to be overriden

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
  },

  getCurrentOrder: function() {
    return this.getViewModel().get('currentOrder')
  },

  /*
   * Set the order header and items data as returned by the json rpc method
   * order.sales.data or order.purchase.data
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

  /*
   * Using Ctrl+S one can always save any changes to the order. Even when the
   * order is already closed, the staff shall still be able to change the order
   * status and internal memo. The fields that can be changed on a closed order
   * is controlled by the UI, i.e. OrderPanel
   */
  onCtrlS: function(evt) {
    // do not trigger Ctrl+S on sales order
    evt.stopEvent()
    this.doSaveOrder()
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

    order.set(
      'amount',
      me.itemStore.sum('amount') + order.get('freight') - order.get('rebate')
    )
  },

  onOrderItemChange: function(store, record, op, fields) {
    if (fields && fields[0] !== 'amount') {
      record.set('amount', record.get('sellingPrice') * record.get('quantity'))
      this.refreshAmount()
    }
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
    delete header.effectiveCost

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
          'sellingPrice',
          'unitCost',
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

  onBtnAddItem: function() {
    var me = this
    if (!me.selectorWin) {
      me.selectorWin = me.getView().add(
        Ext.widget('itemselector', {
          closeAction: 'hide',
          width: 1200,
          height: 600,
          plugins: 'centeronviewport',
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

    me.selectorWin.show().center()
  },

  onBtnRemoveItem: function() {
    var me = this,
      itemsGrid = this.lookup('itemsGrid')

    Ext.each(itemsGrid.getSelection(), function(oi) {
      itemsGrid.getStore().remove(oi)
    })
    // refresh the row number
    itemsGrid.getView().refresh()
    // this ensures Ctrl+S works properly after item removal
    itemsGrid.focus()
  },

  doAddItems: function(items) {
    var me = this,
      oi,
      i,
      fields = [
        'itemId',
        'itemName',
        'specification',
        'model',
        'sellingPrice',
        'unitId'
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
        if (me.orderType === 'S') {
          oi.unitCost = item.get('purchasePrice')
        }
        me.itemStore.add(Web.model.OrderItem(oi))
      }
    })
  },

  doSaveOrder: function(callback) {
    var me = this,
      f = me.getOrderForm(),
      vm = me.getViewModel(),
      formValid = f.isValid(),
      order = me.getCurrentOrder(),
      changes

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
      method: me.rpcSaveMethod,
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
        // if this is a new order, refresh the order data
        if (ret) {
          me.setOrderData(ret)
        } else {
          order.commit()
          vm.set('originalStatus', order.get('orderStatus'))
          me.itemStore.commitChanges()
        }
        if (typeof callback === 'function') {
          callback.call(me)
        } else {
          Ecop.util.Util.showInfo('订单保存成功!')
        }
      }
    })
  }
})
