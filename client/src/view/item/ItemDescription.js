Ext.define('Ecop.view.item.ItemDescription', {
  extend: 'Ext.Panel',

  xtype: 'item-desc',

  cls: 'item-desc',

  layout: {
    type: 'hbox',
    align: 'stretch'
  },

  dockedItems: {
    xtype: 'toolbar',
    dock: 'top',
    style: 'background-color: #FEFFB6;',
    items: [
      {
        xtype: 'component',
        html:
          '<b style="color:red;">注意事项:</b> 商品描述图宽度建议为790,大于790的将自动缩小为790。图片大小不得超过2MB,高度和宽度之比不得超过2，格式可以是gif/png/jpg。'
      }
    ]
  },

  items: [
    {
      xtype: 'panel',
      width: 250,
      border: false,

      layout: {
        type: 'vbox',
        align: 'stretch'
      },

      items: [
        {
          xtype: 'treepanel',

          reference: 'moduleTree',
          bind: {
            store: '{modules}'
          },
          root: {
            expanded: true
          },
          rootVisible: false,
          hideHeaders: true,
          scrollable: 'y',
          flex: 1,

          selModel: {
            allowDeselect: true
          },
          viewConfig: {
            plugins: [
              {
                ptype: 'treeviewdragdrop',
                containerScroll: true
              }
            ],
            listeners: {
              drop: 'onDescResourceMove',
              beforeDrop: 'onDescTreeBeforeDrop'
            }
          },

          listeners: {
            select: 'onDescTreeSelect'
          },

          columns: [
            {
              xtype: 'treecolumn',
              sortable: false,
              renderer: function(v, c, record) {
                return record.get('format')
                  ? record.get('text') + '.' + record.get('format')
                  : record.get('text')
              },
              flex: 1
            }
          ]
        },
        {
          xtype: 'dataview',
          maxHeight: 150,
          reference: 'moduleType',
          scrollable: true,
          hidden: true,
          tpl: [
            '<ul class="x-list-plain">',
            '<tpl for=".">',
            '<li class="x-boundlist-item">{text}</li>',
            '</tpl>',
            '</ul>'
          ],
          overItemCls: 'x-boundlist-item-over',
          itemSelector: '.x-boundlist-item',
          store: 'moduletype',
          listeners: {
            itemclick: 'onModuleTypeChoice'
          }
        }
      ],

      bbar: [
        {
          iconCls: 'x-fa fa-plus-circle',
          tooltip: '添加新模块到商品描述',
          text: '模块',
          handler: 'onDescBtnAddModule'
        },
        {
          xtype: 'filebutton',
          iconCls: 'x-fa fa-plus-circle',
          tooltip: '在当前位置添加新图片',
          afterTpl: Ecop.util.Util.imageInputTpl
            .join('')
            .replace('image/png', 'image/png, .psd'),
          text: '图片',
          listeners: {
            change: 'onDescImageAdd'
          },
          bind: {
            disabled: '{!moduleTree.selection}'
          }
        },
        {
          iconCls: 'x-fa fa-times-circle',
          tooltip: '删除选中的模块或图片',
          handler: 'onDescRemove',
          bind: {
            disabled: '{!moduleTree.selection}'
          }
        },
        {
          iconCls: 'x-fa fa-files-o',
          tooltip: '从其他商品拷贝描述',
          handler: 'onDescCopy'
        },
        {
          iconCls: 'x-fa fa-eye',
          tooltip: '预览完整的商品描述',
          handler: 'onDescPreview'
        }
      ]
    },
    {
      xtype: 'splitter'
    },
    {
      xtype: 'component',
      flex: 1,
      cls: 'preview',
      scrollable: 'y',
      reference: 'preview',

      tpl: Ext.create(
        'Ext.XTemplate',
        '<div class="wrapper">',
        '<tpl if="!Ext.isEmpty(values.childNodes)">',
        '<tpl for="childNodes">',
        '{[this.render(values)]}',
        '</tpl>',
        '<tpl else>',
        '{[this.render(values)]}',
        '</tpl>',
        '</div>',
        {
          render: function(resource) {
            if (resource.get('type') === 1) {
              return '<img src="' + resource.get('url') + '" />'
            } else {
              return resource.get('content')
            }
          }
        }
      )
    }
  ]
})
