Ext.define('Ecop.widget.CategorySelector', {
  extend: 'Web.ux.form.TreeCombo',
  xtype: 'categoryselector',

  editable: false, // no entering text directly
  rootVisible: false,
  treeHeight: 300,
  treeCls: 'cat-tree', // disables folder icon
  valueField: 'id',
  value: null,

  store: {
    autoLoad: false,
    proxy: {
      type: 'jsonrpc',
      method: 'category.get'
    }
  },

  initComponent: function() {
    var me = this

    me.callParent(arguments)
    me.tree.on({
      show: function() {
        var root = me.tree.getRootNode()
        if (!root.isExpanded()) {
          root.expand()
        }
      }
    })
  },

  /*
     * @public
     */
  setValue: function(value) {
    var node,
      label = '',
      me = this,
      tree = this.tree,
      inputEl = me.inputEl

    if (!value) {
      me.value = null
      me.setRawValue('')
      return
    }

    if (tree.store.isLoading()) {
      me.afterLoadSetValue = value
    }

    if (!tree.store.isLoaded()) {
      tree.store.load()
    }

    me.value = value
    node = me.tree.getStore().getNodeById(String(value))
    if (node) {
      do {
        label = node.get('text') + (label ? '->' : '') + label
        node = node.parentNode
      } while (!node.isRoot())
    }

    me.setRawValue(label)
    me.checkChange()
    return me
  }
})
