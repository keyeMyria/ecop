Ext.define('Ecop.view.item.ItemWindow', {
  extend: 'Ext.window.Window',

  requires: [
    'Ecop.view.item.ItemForm',
    'Ecop.view.item.ItemDescription',
    'Ecop.view.item.ItemModel',
    'Ecop.view.item.ItemGroup',
    'Ecop.view.item.ItemController'
  ],

  xtype: 'item-window',
  cls: 'item-window',

  viewModel: {
    type: 'item'
  },
  controller: 'item',

  closable: true,
  modal: true,
  bind: {
    title: '{title}'
  },
  layout: 'fit',

  items: [
    {
      xtype: 'tabpanel',
      reference: 'tabpanel',

      items: [
        {
          xtype: 'item-form',
          title: '基础信息',
          reference: 'itemform',
          bodyPadding: 5
        },
        {
          xtype: 'item-desc',
          title: '商品描述',
          bind: {
            disabled: '{isNewItem}'
          }
        },
        {
          xtype: 'item-group',
          title: '商品组合',
          bind: {
            disabled: '{isNewItem}'
          }
        }
      ]
    }
  ],

  buttons: [
    {
      text: '保存',
      scale: 'medium',
      handler: 'onItemSave'
    },
    {
      text: '关闭',
      scale: 'medium',
      handler: 'onItemCancel'
    }
  ],
  buttonAlign: 'center',
  listeners: {
    beforedestroy: 'beforeItemWinDestroy'
  }
})
