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

  onOrderItemRightClick: function(table, record, tr, rowIndex, e) {
    var me = this,
      menu

    e.preventDefault()
    if (!me.contextMenu) {
      me.contextMenu = Ext.widget('menu', {
        width: 100,
        plain: true,

        viewModel: me.getViewModel(),

        items: [
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
      menuId = menuItem.getItemId()

    if (menuId === 'removeItem') {
      itemsGrid.getStore().remove(itemsGrid.getSelection()[0])
      // refresh the row number
      itemsGrid.getView().refresh()
    }
  }
})
