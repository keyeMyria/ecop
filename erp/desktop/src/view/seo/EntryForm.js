Ext.define('Ecop.view.seo.EntryForm', {
  extend: 'Ext.window.Window',
  xtype: 'seo-form',

  modal: true,
  layout: 'fit',
  width: 500,
  height: 450,
  title: '编辑url',

  items: [
    {
      xtype: 'form',
      bodyPadding: 5,

      defaults: {
        anchor: '100%',
        xtype: 'textfield',
        labelWidth: 70,
        labelAlign: 'right'
      },

      items: [
        {
          fieldLabel: 'url',
          width: 120,
          bind: {
            value: '{currentEntry.url}',
            editable: '{isNewEntry}'
          }
        },
        {
          fieldLabel: 'title',
          bind: '{currentEntry.title}'
        },
        {
          xtype: 'textarea',
          fieldLabel: 'description',
          anchor: '100% -90',
          bind: '{currentEntry.description}'
        }
      ]
    }
  ],

  buttonAlign: 'center',
  buttons: [
    {
      text: '保存',
      handler: 'onSaveEntry',
      scale: 'medium',
      bind: {
        disabled: '{!entryModified}'
      }
    }
  ],

  listeners: {
    close: 'onFormClose'
  }
})
