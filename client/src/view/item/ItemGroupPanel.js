Ext.define('Ecop.view.item.ItemGroupPanel', {
  extend: 'Ext.grid.Panel',
  xtype: 'itemgrouppanel',

  requires: [
    'Ext.grid.plugin.DragDrop',
    'Ext.grid.column.Action',
    'Web.ux.form.VTypes',
    'Web.model.ItemGroup',
    'Ecop.widget.ItemSelector'
  ],

  defaultListenerScope: true,

  cls: 'ig-manager itemgrid',

  store: {
    fields: [
      'label',
      'itemId',
      'itemName',
      'specification',
      'model',
      'sellingPrice',
      'sellingPriceB',
      'itemStatus'
    ],
    proxy: { type: 'memory', reader: 'json' }
  },

  viewConfig: {
    plugins: {
      ptype: 'gridviewdragdrop'
    },
    // highlight offline and inactive items
    getRowClass: function(record) {
      return ['', 'offline', 'inactive'][record.get('itemStatus')]
    }
  },

  dockedItems: [
    {
      xtype: 'form',
      dock: 'top',
      cls: 'ig-form',
      items: [
        {
          xtype: 'container',
          layout: 'hbox',
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
              labelWidth: 60
            },
            {
              xtype: 'checkbox',
              labelWidth: 60,
              name: 'shareDescription',
              fieldLabel: '共享描述'
            },
            {
              xtype: 'checkbox',
              labelWidth: 60,
              name: 'shareImage',
              fieldLabel: '共享主图'
            },
            {
              xtype: 'button',
              text: '添加商品',
              handler: 'onBtnAdd'
            }
          ]
        },
        {
          xtype: 'container',
          layout: 'hbox',
          items: [
            {
              xtype: 'textfield',
              name: 'groupItemName',
              fieldLabel: '组合商品名称',
              minLength: 5,
              minLengthText: '组合名称至少为5个字符',
              minWidth: 400
            },
            {
              xtype: 'numberfield',
              name: 'groupImageId',
              fieldLabel: '组合商品主图',
              vtype: 'docid'
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
        text: 'B价',
        width: 70,
        dataIndex: 'sellingPriceB',
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
      handler: 'onSave'
    }
  ],

  initComponent: function() {
    var me = this
    me.callParent(arguments)
    me.load()
  },

  onBtnAdd: function() {
    var me = this
    if (!me.selectorWin) {
      me.selectorWin = Ext.widget('itemselector', {
        closeAction: 'hide',
        height: 600,
        width: 1200,
        listeners: {
          itemselect: me.onAddItems,
          scope: me
        }
      })
    }
    me.selectorWin.show()
  },

  onAddItems: function(items) {
    var me = this,
      iids = [],
      store = me.getStore()

    // see if the item is already present by first compiling as list of all
    // item ids
    store.each(function(record) {
      iids.push(record.get('itemId'))
    })

    Ext.each(items, function(item) {
      if (iids.indexOf(item.get('itemId')) === -1) {
        store.add({
          thumb: true,
          itemId: item.get('itemId'),
          itemName: item.get('itemName'),
          specification: item.get('specification'),
          model: item.get('model'),
          sellingPrice: item.get('sellingPrice'),
          sellingPriceB: item.get('sellingPriceB')
        })
      }
    })
  },

  onSave: function() {
    var me = this,
      params,
      items = [],
      f = me.down('form').getForm()

    if (!f.isValid()) {
      Ext.Msg.alert('', '输入错误，请检查')
      return
    }

    if (me.store.count()) {
      params = f.updateRecord().getRecord().getData()
      delete params['items']

      if (
        me.store.findBy(function(record) {
          var label = record.get('label')
          return !label || label.trim() === ''
        }) > -1
      ) {
        Ext.Msg.alert('', '标签不能为空')
        return
      }

      me.store.each(function(record) {
        items.push({
          label: record.get('label'),
          thumb: record.get('thumb'),
          itemId: record.get('itemId')
        })
      })

      params['items'] = items
      params['groupBy'] = 'L'

      Web.data.JsonRPC.request({
        method: me.itemGroupId ? 'item.group.update' : 'item.group.add',
        params: [params],
        success: function(itemGroupId) {
          if (!me.itemGroupId) {
            f.getRecord().set('itemGroupId', itemGroupId)
            me.itemGroupId = itemGroupId
          }
          me.store.commitChanges()
          Ext.Msg.alert('', '商品组合已保存。')
        }
      })
    } else if (me.itemGroupId) {
      Web.data.JsonRPC.request({
        method: 'item.group.delete',
        params: [me.itemGroupId],
        success: function() {
          me.itemGroupId = null
          me.load()
          Ext.Msg.alert('', '商品组合已删除。')
        }
      })
    }
  },

  load: function(itemgroup) {
    var me = this,
      form = me.down('form').getForm()
    form.loadRecord(Ext.create('Web.model.ItemGroup', itemgroup))
    if (itemgroup) {
      me.itemGroupId = itemgroup.itemGroupId
      me.store.loadData(itemgroup.items)
      me.store.commitChanges()
    } else {
      me.itemGroupId = null
      form.reset()
      me.store.removeAll()
    }
  }
})
