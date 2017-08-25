Ext.define('Ecop.view.item.ItemGroup', {
  extend: 'Ext.grid.Panel',
  xtype: 'item-group',

  requires: [
    'Ext.grid.plugin.DragDrop',
    'Ext.grid.column.Action',
    'Web.ux.form.VTypes'
  ],

  viewConfig: {
    plugins: {
      ptype: 'gridviewdragdrop'
    },

    // highlight offline and inactive items
    getRowClass: function(record) {
      return ['', 'offline', 'inactive'][record.get('itemStatus')]
    }
  },

  bind: {
    store: '{groupitems}'
  },

  listeners: {
    afterRender: 'afterGroupRender'
  },

  dockedItems: [
    {
      xtype: 'form',
      dock: 'top',

      defaults: {
        xtype: 'container',
        layout: 'hbox',
        padding: 5
      },

      items: [
        {
          defaults: {
            margin: '0 0 0 5'
          },

          items: [
            /*{
                xtype: 'combo',
                name: 'groupBy',
                fieldLabel: '商品组类型',
                labelWidth: 70,
                store: new Ext.data.ArrayStore({
                    fields: ['code', 'text'],
                    data: [['L', '自定标签'], ['P', '商品属性']]
                }),
                value: 'L',
                valueField: 'code'
            }, */ {
              xtype: 'textfield',
              name: 'labelName',
              fieldLabel: '标签名称',
              labelWidth: 60,
              bind: '{itemGroup.labelName}'
            },
            {
              xtype: 'checkbox',
              labelWidth: 60,
              name: 'shareDescription',
              fieldLabel: '共享描述',
              bind: '{itemGroup.shareDescription}'
            },
            {
              xtype: 'checkbox',
              labelWidth: 60,
              name: 'shareImage',
              fieldLabel: '共享主图',
              bind: '{itemGroup.shareImage}'
            },
            {
              xtype: 'button',
              text: '添加商品',
              handler: 'onBtnAddItemToGroup'
            }
          ]
        },
        {
          defaults: {
            margin: '0 0 0 5'
          },

          items: [
            {
              xtype: 'textfield',
              name: 'groupItemName',
              fieldLabel: '组合商品名称',
              minLength: 5,
              minLengthText: '组合名称至少为5个字符',
              minWidth: 400,
              bind: '{itemGroup.groupItemName}'
            },
            {
              xtype: 'numberfield',
              name: 'groupImageId',
              fieldLabel: '组合商品主图',
              vtype: 'docid',
              bind: '{itemGroup.groupImageId}'
            }
          ]
        }
      ]
    }
  ],

  plugins: {
    ptype: 'cellediting',
    clicksToEdit: 1
  },

  columns: {
    defaults: {
      sortable: false,
      menuDisabled: true,
      align: 'left'
    },
    items: [
      {
        xtype: 'rownumberer',
        align: 'center',
        width: 35
      },
      {
        text: '标签',
        dataIndex: 'label',
        editor: {
          xtype: 'textfield',
          allowBlank: false
        }
      },
      {
        xtype: 'checkcolumn',
        text: '属性图',
        width: 60,
        dataIndex: 'thumb',
        align: 'center'
      },
      {
        text: '商品号',
        width: 80,
        align: 'center',
        dataIndex: 'itemId'
      },
      {
        text: '商品名称',
        width: 250,
        dataIndex: 'itemName',
        cellWrap: true
      },
      {
        text: '规格',
        width: 150,
        dataIndex: 'specification'
      },
      {
        text: '型号',
        width: 150,
        dataIndex: 'model',
        cellWrap: true
      },
      {
        text: 'C价',
        width: 70,
        dataIndex: 'sellingPrice',
        align: 'right',
        formatter: 'number("0.00")'
      },
      {
        xtype: 'actioncolumn',
        menuDisabled: true,
        width: 40,
        align: 'center',
        items: [
          {
            iconCls: 'x-fa fa-times-circle',
            tooltip: '删除商品',
            handler: function(view) {
              view.store.remove(arguments[5])
            }
          }
        ]
      }
    ]
  },

  buttonAlign: 'center',
  buttons: [
    {
      text: '保存',
      scale: 'medium',
      handler: 'onItemGroupSave'
    }
  ]
})
