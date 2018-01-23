Ext.define('Ecop.view.article.CasePanel', {
  extend: 'Ext.form.Panel',
  xtype: 'casepanel',

  requires: ['Ecop.view.article.CaseController', 'Ecop.view.article.CaseModel'],

  controller: 'case',
  cls: 'case-panel',
  viewModel: {
    type: 'case'
  },

  closable: true,
  layout: {
    type: 'hbox',
    align: 'stretch'
  },

  bind: {
    title: '{title}'
  },

  items: [
    {
      xtype: 'panel',
      bodyPadding: 2,
      layout: {
        type: 'vbox',
        align: 'stretch'
      },
      flex: 1,

      defaults: {
        margin: '0 0 5 0'
      },

      items: [
        {
          xtype: 'container',
          layout: 'hbox',

          defaults: {
            labelWidth: 45,
            margin: '0 10 0 0',
            labelAlign: 'right'
          },

          items: [
            {
              xtype: 'displayfield',
              labelWidth: 60,
              fieldLabel: '案例编号',
              width: 150,
              bind: {
                value: '{article.articleId}'
              }
            },
            {
              xtype: 'textfield',
              bind: '{article.tags}',
              allowOnlyWhitespace: false,
              fieldLabel: '标签',
              cls: 'required',
              minWidth: 150
            },
            {
              xtype: 'textfield',
              bind: '{article.title}',
              fieldLabel: '备注',
              minWidth: 300
            },
            {
              xtype: 'checkboxfield',
              bind: '{article.published}',
              fieldLabel: '发布'
            },
            {
              xtype: 'displayfield',
              bind: '{article.updateTime}',
              labelWidth: 65,
              fieldLabel: '更新时间',
              renderer: Ext.util.Format.dateRenderer('Y-m-d')
            }
          ]
        },
        {
          xtype: 'textarea',
          name: 'content',
          height: 60,
          allowBlank: false,
          bind: '{article.content}',
          labelWidth: 65,
          labelAlign: 'right',
          fieldLabel: '案例描述',
          cls: 'required'
        },
        {
          xtype: 'fieldset',
          title: '案例图片',
          margin: '10px 0 0 0',
          padding: '0 5px',

          layout: 'fit',
          flex: 1,
          items: [
            {
              xtype: 'panel',
              layout: 'fit',

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
                  iconCls: 'x-fa fa-eye',
                  tooltip: '显示图片',
                  disabled: true,
                  bind: {
                    href: '{imageUrl}',
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
                  '<div class="case-image-thumb">',
                  '<img src="{[Ecop.imageUrl]}/{name}@!attachment_thumb" />',
                  '</div>'
                ],
                itemSelector: 'div.case-image-thumb'
              }
            }
          ]
        }
      ],

      buttonAlign: 'center',
      buttons: [
        {
          text: '保存',
          scale: 'medium',
          handler: 'onSave'
        },
        {
          text: '取消',
          scale: 'medium',
          handler: 'onCancel'
        },
        {
          text: '删除',
          scale: 'medium',
          handler: 'onDelete',
          permission: 'article.delete',
          bind: {
            hidden: '{isNewArticle}'
          }
        }
      ]
    }
  ]
})
