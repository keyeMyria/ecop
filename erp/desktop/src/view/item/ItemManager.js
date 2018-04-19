Ext.define('Ecop.view.item.ItemManager', {
  extend: 'Ext.Panel',
  xtype: 'item-manager',

  requires: ['Ecop.view.category.CategoryManager', 'Ecop.view.item.EditorGrid'],

  cls: 'item-manager',

  layout: {
    type: 'hbox',
    align: 'stretch'
  },

  /*
   * Since both CategroyManager and EditorGrid have their own view controllers,
   * events that originate from the two that need higher level coordination
   * can only be defined without a ViewController on ItemManager.
   */
  initComponent: function() {
    var me = this

    if (Ecop.auth.hasPermission('item.update.category')) {
      me.catman = Ext.widget('category-manager', {
        width: 300,
        title: '管理商品结构',

        collapsible: true,
        collapsed: true,
        collapseDirection: 'left',

        header: {
          items: [
            {
              xtype: 'button',
              enableToggle: true,
              tooltip: '激活结构管理',
              iconCls: 'x-fa fa-gear',
              toggleHandler: me.onToggleCatManage,
              scope: me
            }
          ]
        },

        listeners: {
          selectionchange: me.onTreeSelectionChange,
          afterRender: {
            fn: me.afterTreeRender,
            scope: me,
            single: true
          },
          scope: me
        }
      })
    }

    me.itemman = Ext.widget('item-editor', {
      title: '商品管理',
      flex: 1,

      viewConfig: {
        plugins: [
          {
            ptype: 'gridviewdragdrop',
            ddGroup: 'item-to-cat',
            dragText: '选择了{0}个商品',
            enableDrop: false
          }
        ],
        // seems we have to to repeat this
        getRowClass: function(record) {
          return ['', 'offline', 'inactive'][record.get('itemStatus')]
        }
      }
    })

    me.items = me.catman
      ? [me.catman, { xtype: 'splitter' }, me.itemman]
      : [me.itemman]
    me.callParent(arguments)
  },

  onToggleCatManage: function(btn, pressed, evt) {
    var me = this
    if (pressed) {
      me.catman.enableEdit()
      me.down('item-editor toolbar').disable()
      me.itemman.store.removeAll()
      me.mode = 'catman'
    } else {
      if (me.catman.isModified()) {
        // restore btn toggle state
        btn.toggle(true, true)
        Ecop.util.Util.showError('尚有未保存的商品结构变动。')
      } else {
        me.catman.enableEdit(false)
        me.down('item-editor toolbar').enable()
        me.mode = 'itemcat'
      }
    }
  },

  /*
   * @private
   */
  onTreeSelectionChange: function(selModel, selected) {
    var me = this,
      cat = selected[0],
      itemStore = me.down('item-editor').store

    if (me.mode === 'catman' || !cat.isLeaf()) {
      return
    }

    Web.data.JsonRPC.request({
      method: 'item.search',
      params: { catId: cat.get('id') },
      success: function(items) {
        itemStore.loadData(items)
      }
    })
  },

  /*
   * @private
   */
  afterTreeRender: function(tree) {
    var me = this

    // override default implementation of Ext.tree.ViewDropZone.getPosition
    // to allow dropping node on leaf node. Note this has to be done after
    // tree is rendered

    Ext.override(tree.getView().plugins[0].dropZone, {
      getPosition: function(e, node) {
        var view = this.view,
          record = view.getRecord(node),
          y = e.getY(),
          noAppend = false, // set this always to false
          noBelow = false,
          region = Ext.fly(node).getRegion(),
          fragment

        if (record.isRoot()) {
          return 'append'
        }

        if (this.appendOnly) {
          return noAppend ? false : 'append'
        }

        if (!this.allowParentInserts) {
          noBelow = record.hasChildNodes() && record.isExpanded()
        }

        fragment = (region.bottom - region.top) / (noAppend ? 2 : 3)
        if (y >= region.top && y < region.top + fragment) {
          return 'before'
        } else if (
          !noBelow &&
          (noAppend || (y >= region.bottom - fragment && y <= region.bottom))
        ) {
          return 'after'
        } else {
          return 'append'
        }
      }
    })

    me.itcDropTarget = new Ext.dd.DropZone(tree.getEl(), {
      ddGroup: 'item-to-cat',

      // overrides
      getTargetFromEvent: function(e) {
        return e.getTarget('tr.' + Ext.baseCSSPrefix + 'grid-row')
      },

      /*
       * If user is trying to move item to a non-leaf category node, or
       * if the target category is the same as the source category,
       * indicate that the drop would fail. Note this just apply a css
       * to the drop source, it will **NOT** prevent the actual drop.
       */
      onNodeOver: function(node, source, e, data) {
        if (
          Ext.fly(node).hasCls(Ext.baseCSSPrefix + 'grid-tree-node-leaf') &&
          tree.getView().getRecord(node).get('id') !==
            data.records[0].get('primaryCategoryId')
        ) {
          return this.dropAllowed
        } else {
          return this.dropNotAllowed
        }
      },

      onNodeDrop: function(node, source, e, data) {
        var items = [],
          rec = tree.getView().getRecord(node),
          newCatId = rec.get('id')

        // check whether a drop is possible, see onNodeOver
        if (
          !rec.isLeaf() ||
          newCatId == data.records[0].get('primaryCategoryId')
        ) {
          return false
        }

        Ext.each(data.records, function(item) {
          items.push({
            itemId: item.get('itemId'),
            primaryCategoryId: newCatId
          })
        })

        Web.data.JsonRPC.request({
          method: 'item.upsert',
          params: [items],
          success: function() {
            me.down('item-editor').store.remove(data.records)
          }
        })
      }
    })
  }
})
