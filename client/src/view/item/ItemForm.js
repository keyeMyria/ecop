Ext.define('Ecop.view.item.ItemForm', {
  extend: 'Ext.form.Panel',

  xtype: 'item-form',

  requires: ['Ecop.widget.SkuInput', 'Ecop.widget.CategorySelector'],

  modelValidation: true,
  layout: {
    type: 'vbox',
    align: 'stretch'
  },

  listeners: {
    afterrender: 'afterItemFormRender'
  },

  items: [
    {
      xtype: 'fieldset',
      title: '基础信息',

      defaults: {
        xtype: 'container',
        layout: 'hbox',
        padding: '5 0 0 0'
      },

      items: [
        {
          defaults: {
            xtype: 'textfield',
            labelWidth: 50,
            labelAlign: 'right'
          },
          items: [
            {
              xtype: 'displayfield',
              fieldLabel: '商品号',
              width: 120,
              bind: '{itemId}'
            },
            {
              labelWidth: 65,
              fieldLabel: '商品名称',
              cls: 'required',
              flex: 2,
              bind: '{currentItem.itemName}'
            },
            {
              fieldLabel: '规格',
              flex: 1,
              bind: '{currentItem.specification}'
            },
            {
              fieldLabel: '型号',
              flex: 1,
              bind: '{currentItem.model}'
            }
          ]
        },
        {
          defaults: {
            xtype: 'numberfield',
            labelWidth: 50,
            labelAlign: 'right',
            minValue: 0,
            flex: 1
          },
          items: [
            {
              fieldLabel: '进价',
              bind: '{currentItem.purchasePrice}',
              permission: 'item.update.price.purchase'
            },
            {
              fieldLabel: '零售价',
              bind: '{currentItem.sellingPrice}'
            },
            {
              fieldLabel: '会员价',
              bind: '{currentItem.sellingPriceB}'
            }
          ]
        },
        {
          padding: '5 0',
          defaults: {
            xtype: 'combo',
            labelWidth: 50,
            labelAlign: 'right',
            editable: false,
            valueField: 'id',
            displayField: 'text',
            autoLoadOnValue: true
          },
          items: [
            {
              fieldLabel: '品牌',
              width: 180,
              cls: 'required',
              store: 'brand',
              displayField: 'brandName',
              bind: '{currentItem.brandId}'
            },
            {
              fieldLabel: '单位',
              width: 150,
              cls: 'required',
              store: 'unit',
              bind: '{currentItem.unitId}'
            },
            {
              fieldLabel: '国家',
              width: 150,
              cls: 'required',
              store: 'country',
              bind: '{currentItem.countryId}'
            },
            {
              xtype: 'numberfield',
              fieldLabel: '重量(kg)',
              minValue: 0,
              labelWidth: 70,
              width: 130,
              bind: {
                editable: '{currentItem.isSku}',
                value: '{currentItem.weight}'
              }
            },
            {
              xtype: 'categoryselector',
              fieldLabel: '商品分类',
              store: 'category',
              canSelectFolders: false,
              labelWidth: 75,
              permission: 'item.update.category',
              minWidth: 300,
              bind: '{currentItem.primaryCategoryId}'
            }
          ]
        }
      ]
    },
    {
      xtype: 'fieldset',
      title: '商品主图',

      layout: 'fit',
      flex: 1,
      items: [
        {
          xtype: 'panel',
          layout: 'fit',

          dockedItems: {
            xtype: 'toolbar',
            dock: 'top',
            style: 'background-color: #FEFFB6;',
            items: [
              {
                xtype: 'component',
                html:
                  '<b style="color:red;">注意事项:</b>' +
                  '商品主图宽度和高度必须至少有一个超过800，格式可以为gif/png/jpg，' +
                  '单张图片大小不超过500K。最多上传5张主图。'
              }
            ]
          },

          lbar: [
            {
              xtype: 'filebutton',
              iconCls: 'x-fa fa-plus-circle',
              afterTpl: Ecop.util.Util.imageInputTpl,
              tooltip: '新增图片',
              listeners: {
                change: 'onImageAdd'
              }
            },
            {
              xtype: 'filebutton',
              iconCls: 'x-fa fa-pencil',
              afterTpl: Ecop.util.Util.imageInputTpl,
              tooltip: '替换图片',
              listeners: {
                change: 'onImageUpdate'
              },
              bind: {
                disabled: '{!imageList.selection}'
              }
            },
            {
              iconCls: 'x-fa fa-times-circle',
              tooltip: '删除图片',
              handler: 'onImageDelete',
              bind: {
                disabled: '{!imageList.selection}'
              }
            },
            {
              iconCls: 'x-fa fa-arrow-left',
              tooltip: '往左移动',
              handler: 'onImageMoveLeft',
              disabled: true,
              bind: {
                disabled: '{!showLeft}'
              }
            },
            {
              iconCls: 'x-fa fa-arrow-right',
              tooltip: '往右移动',
              handler: 'onImageMoveRight',
              disabled: true,
              bind: {
                disabled: '{!showRight}'
              }
            },
            {
              iconCls: 'x-fa fa-download',
              tooltip: '下载图片',
              handler: 'onImageDownload',
              bind: {
                disabled: '{!imageList.selection}'
              }
            }
          ],

          items: {
            xtype: 'dataview',
            reference: 'imageList',
            bind: {
              store: '{images}',
              selection: '{selectedImage}'
            },
            focusCls: '',
            selectedItemCls: Ext.baseCSSPrefix + 'view-item-focused',
            itemTpl: [
              '<div class="dataview-item-image">',
              '<img src="{url}@160w_160h.jpg?t={[new Date().getTime()]}" />',
              '<div class="caption"><p>{title}</p><p>{imageId}({width}x{height})</p></div>',
              '</div>'
            ],
            itemSelector: 'div.dataview-item-image'
          }
        }
      ]
    },
    {
      xtype: 'fieldset',
      title: '套餐部件清单',
      permission: 'item.bom.manage',

      height: 220,
      layout: {
        type: 'vbox',
        align: 'stretch'
      },
      items: [
        {
          xtype: 'container',
          layout: {
            type: 'hbox',
            align: 'middle'
          },
          items: [
            {
              xtype: 'skuinput',
              flex: 1,
              listeners: {
                skuselect: 'onSkuSelect'
              }
            },
            {
              xtype: 'button',
              reference: 'btnAddSku',
              text: '添加部件',
              disabled: true,
              scale: 'large',
              height: 40,
              margin: '0 0 0 10',
              handler: 'onSkuAdd'
            }
          ]
        },
        {
          xtype: 'grid',
          reference: 'skuGrid',
          margin: '5 0 0 0',

          bind: {
            store: '{boms}'
          },
          plugins: {
            ptype: 'cellediting',
            clicksToEdit: 1
          },
          flex: 1,
          viewConfig: {
            plugins: {
              ptype: 'gridviewdragdrop'
            },
            listeners: {
              drop: 'onSkuGridDrop'
            }
          },
          columns: {
            defaults: {
              menuDisabled: true,
              draggable: false,
              resizable: false,
              sortable: false
            },
            items: [
              {
                text: '商品号',
                width: 80,
                align: 'center',
                dataIndex: 'itemId'
              },
              {
                text: '商品名称',
                width: 300,
                dataIndex: 'itemName'
              },
              {
                text: '规格',
                width: 150,
                dataIndex: 'specification'
              },
              {
                text: '型号',
                width: 150,
                dataIndex: 'model'
              },
              {
                text: '重量',
                width: 60,
                align: 'center',
                dataIndex: 'weight'
              },
              {
                text: '数量',
                width: 50,
                align: 'center',
                dataIndex: 'quantity',
                editor: {
                  xtype: 'numberfield',
                  allowDecimals: false,
                  allowBlank: false,
                  minValue: 1,
                  msgTarget: 'qtip'
                }
              },
              {
                xtype: 'widgetcolumn',
                width: 50,
                menuDisabled: true,
                widget: {
                  xtype: 'button',
                  iconCls: 'x-fa fa-times-circle',
                  tooltip: '删除',
                  handler: 'onSkuDelete'
                }
              }
            ]
          }
        }
      ]
    }
  ]
})
