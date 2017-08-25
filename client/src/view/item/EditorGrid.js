Ext.define('Ecop.view.item.EditorGrid', {
  extend: 'Ecop.widget.ItemBrowser',
  xtype: 'item-editor',

  requires: ['Ext.menu.Menu', 'Ecop.view.item.EditorController'],

  controller: 'item-editor',

  /*
   * For select multiple items and recategorize them together
   *
   * NOTE: with EXTJS 6.2 it is important to specify checkOnly here, otherwise
   * the use of 'gridviewdragdrop' plugin on the grid for moving items to
   * category tree will cause item selction to behave incorrectly.
   */
  selModel: {
    selType: 'checkboxmodel',
    checkOnly: true
  },

  plugins: {
    ptype: 'cellediting',
    clicksToEdit: 1
  },

  buttons: [
    {
      text: '保存变更',
      scale: 'medium',
      handler: 'onBtnSave'
    },
    {
      text: '添加新商品',
      scale: 'medium',
      permission: 'item.create',
      handler: 'onBtnNewItem'
    }
  ],
  buttonAlign: 'center',

  listeners: {
    rowcontextmenu: 'onContextMenu',
    celldblclick: 'onItemDblClick',
    destroy: 'onDestroy',
    afterrender: 'onItemEditorRender'
  }
})
