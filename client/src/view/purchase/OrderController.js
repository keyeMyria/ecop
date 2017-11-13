Ext.define('Ecop.view.purchase.OrderController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.po-order',

  requires: ['Ecop.widget.ItemSelector'],

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
    vm.get('orders').on({
      load: function(store) {
        // Use select method directly here will not work since the store change
        // has not yet be reflected in the grid yet
        setTimeout(function() {
          me
            .lookup('orderlist')
            .getSelectionModel()
            .select(0)
        }, 500)
      }
    })
    vm.bind('{orderEditable}', 'onOrderEditableChange', me)
  },

  getCurrentOrder: function() {
    return this.getViewModel().get('currentOrder')
  },

  loadOrder: function() {
    var me = this,
      vm = me.getViewModel(),
      order = me.getCurrentOrder()

    Web.data.JsonRPC.request({
      method: 'order.purchase.data',
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
      }
    })
  },

  onPOSelect: function(rowmodel, record) {
    var me = this
    me.getViewModel().set('currentOrder', record)
    me.loadOrder()
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
  },

  onOrderItemChange: function(store, record, op, fields) {
    if (fields && fields[0] !== 'amount') {
      record.set('amount', record.get('sellingPrice') * record.get('quantity'))
      this.refreshAmount()
    }
  },

  onOrderItemRightClick: function(table, record, tr, rowIndex, e) {
    var me = this,
      menu

    e.preventDefault()
    if (!me.contextMenu) {
      me.contextMenu = Ext.widget('menu', {
        width: 100,
        plain: true,

        items: [
          {
            itemId: 'removeItem',
            text: '删除订单项目'
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
      menuId = menuItem.getItemId()

    if (menuId === 'removeItem') {
      itemsGrid.getStore().remove(itemsGrid.getSelection()[0])
      // refresh the row number
      itemsGrid.getView().refresh()
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
      method: 'order.purchase.upsert',
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
        'model',
        'sellingPrice',
        'unitCost',
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
        oi.amount = item.get('sellingPrice')
        me.itemStore.add(Web.model.OrderItem(oi))
      }
    })
  }
})
