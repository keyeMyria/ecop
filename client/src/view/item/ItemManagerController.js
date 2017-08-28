Ext.define('Ecop.view.item.ItemManagerController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.item-manager',

  requires: ['Ecop.view.item.ItemWindow'],

  /*
   * @private
   * the current selected record in the item grid
   */
  currentRecord: null,

  openItemWindow: function(record) {
    var me = this,
      view = me.getView(),
      vp = view.up('viewport')

    // we add the form to the view instead of to view port in order for the
    // form to access this controller
    me.itemWin = view.add({
      xtype: 'item-window',
      width: vp.getWidth() - 100,
      height: vp.getHeight() - 100,
      minHeight: Math.min(vp.getHeight(), 768),

      plugins: 'centeronviewport',

      viewModel: {
        data: {
          currentItem: record
        },
        /*
         * As a tree store can not be loaded with load(itemId), we add the store
         * with parameter to the view model here.
         */
        stores: {
          modules: {
            type: 'tree',
            autoLoad: false,
            proxy: {
              type: 'jsonrpc',
              method: 'item.modules.get',
              params: [record.getId()]
            }
          }
        }
      }
    })

    vp.mask()
    record.beginEdit()
    me.itemWin.show().center()
  },

  onContextMenu: function(table, record, tr, rowIndex, e) {
    var me = this,
      menu

    me.currentRecord = record
    e.preventDefault()

    if (!me.contextMenu) {
      me.contextMenu = Ext.widget('menu', {
        width: 100,
        plain: true,

        viewModel: {
          data: null,
          formulas: {
            hideOffline: function(get) {
              var item = get('item')
              return (
                (!Ecop.auth.hasPermission('item.inactivate') &&
                  item.get('isInactive')) ||
                item.get('isOffline')
              )
            }
          }
        },

        items: [
          {
            itemId: 'online',
            text: '商品上线',
            bind: {
              hidden: '{!item.isOffline}'
            }
          },
          {
            itemId: 'offline',
            text: '商品下线',
            bind: {
              hidden: '{hideOffline}'
            }
          },
          {
            itemId: 'inactive',
            text: '冻结商品',
            permission: 'item.inactivate',
            bind: {
              hidden: '{item.isInactive}'
            }
          },
          {
            itemId: 'openitem',
            text: '显示商品',
            bind: {
              hidden: '{!item.isOnline}'
            },
            href: ' ',
            hrefTarget: '_blank'
          }
        ],
        listeners: {
          click: me.onContextMenuClick,
          scope: me
        }
      })
    }

    menu = me.contextMenu
    menu.getViewModel().set('item', record)

    Ext.defer(function() {
      var i,
        items = menu.query('menuitem')

      for (i = 0; i < items.length; i++) {
        if (!items[i].isHidden()) {
          menu.showAt(e.getXY())
          // the href attribute of menu item can not be reset
          // we have to do this on the dom level **AFTER** the menu is rendered
          menu.down('#openitem') &&
            menu.down('#openitem').el.down('a').set({
              href: Ecop.siteUrl + '/item/' + record.get('itemId') + '.html'
            })
          menu.focus()
          break
        }
      }
    }, 50)
  },

  onContextMenuClick: function(menu, item, e) {
    var me = this,
      grid = me.getView(),
      status,
      menuId = item.getItemId()

    if (['openitem'].indexOf(menuId) !== -1) return

    status = ['online', 'offline', 'inactive'].indexOf(menuId)
    Web.data.JsonRPC.request({
      method: 'item.upsert',
      params: [
        {
          itemId: me.currentRecord.get('itemId'),
          itemStatus: status
        }
      ],
      success: function() {
        me.currentRecord.set('itemStatus', status)
        grid.getView().refresh()
      }
    })
  },

  onItemDblClick: function(grid, td, cellIndex, record) {
    var me = this

    if (cellIndex < 3) {
      me.openItemWindow(record)
    }
  },

  onBtnSave: function() {
    var s = this.getView().getStore(),
      modified = []

    Ext.each(s.getModifiedRecords(), function(item) {
      modified.push(Ext.merge({ itemId: item.getId() }, item.getChanges()))
    })

    if (!Ext.isEmpty(modified)) {
      Web.data.JsonRPC.request({
        method: 'item.upsert',
        params: [modified],
        success: function() {
          s.commitChanges()
        }
      })
    }
  },

  onBtnNewItem: function() {
    this.openItemWindow(Ext.create('Web.model.Item'))
  },

  onDestroy: function() {
    this.contextMenu.destroy()
  }
})
