Ext.define('Ecop.internal.PartyWindow', {
  extend: 'Ext.window.Window',

  xtype: 'party-window',

  width: 300,
  height: 200,
  layout: 'fit',
  title: '新增客戶',
  closable: true,
  closeAction: 'hide',
  modal: true,

  items: [
    {
      xtype: 'form',
      bodyPadding: 10,

      defaults: {
        labelWidth: 60,
        anchor: '100%'
      },

      items: [
        {
          xtype: 'textfield',
          name: 'name',
          fieldLabel: '客戶名称',
          allowBlank: false
        },
        {
          xtype: 'numberfield',
          name: 'mobile',
          vtype: 'mobile',
          enforceMaxLength: true,
          maxLength: 11,
          validateOnChange: false,
          fieldLabel: '手机号码',
          allowBlank: false
        }
      ],

      buttonAlign: 'center',
      buttons: [
        {
          text: '添加'
        },
        {
          text: '取消',
          handler: function() {
            this.up('window').close()
          }
        }
      ]
    }
  ],

  doDestroy: function() {
    console.log('Party Window destroyed')
    this.callParent()
  }
})

Ext.define('Ecop.widget.CustomerPicker', {
  extend: 'Ext.form.field.ComboBox',
  requires: [
    'Web.model.User',
    'Web.ux.Util' // for gbkLength
  ],
  xtype: 'customerpicker',
  cls: 'customer-picker',

  queryMode: 'remote',
  store: {
    proxy: {
      type: 'jsonrpc',
      method: 'user.search'
    },
    model: 'Web.model.User'
  },

  minChars: 0,
  matchFieldWidth: false,
  forceSelection: true,

  /*
   * @private
   *
   * Save a reference to the party window for the add action
   */
  partyWindow: null,

  /*
   * The combination of `hidderTrigger`, `hideOnReadOnly` and `hidden`
   * ensures that the default picker trigger is always hidden, while the add
   * trigger will be only shown when the field is not readonly.
   */
  triggers: {
    add: {
      cls: 'x-fa fa-plus-circle',
      hideOnReadOnly: true,
      hidden: false,
      tooltip: '添加新顾客',
      handler: 'openAddDialog',
      scope: 'this'
    }
  },
  hideTrigger: true,

  valueField: 'partyId',

  // this is important for findRecordByDisplay to work properly
  displayField: 'partyId',

  tpl: [
    '<tpl for=".">',
    '<div class="x-boundlist-item">{partyType}{partyId} - {partyName},{mobile}</div>',
    '</tpl>'
  ],
  displayTpl: ['<tpl for=".">', '{partyType}{partyId} - {partyName}', '</tpl>'],

  validator: function(v) {
    var me = this
    if (!me.allowBlank && v && me.getValue() === null) {
      return '该输入项为必输项'
    }
    return true
  },

  /*
     * @private
     *
     * Start remote query when the user enters at least 5 digits for phone
     * number or at least 2 Chinese characters for user name. Note we have to
     * use custom code to determine length of Chinese characters since
     * javascript only supports unicode length
     */
  onBeforeQuery: function(queryPlan) {
    var me = this,
      q = queryPlan.query
    if (q.match(/^\d+$/)) return q.length >= 5
    return Ext.String.gbkLength(queryPlan.query) >= 4
  },

  /*
     * Since we used display template to alter the raw value of the textbox,
     * we shall customize how to find a record by display value
     */
  findRecordByDisplay: function(value) {
    return this.callParent([value.substr(1, 8)])
  },

  /*
     * When ever the value of a CustomerPicker widget is set to partyId, load
     * the party information first and use it to display widget text
     */
  setValue: function(value) {
    var me = this
    // this is very important to prevent infinitely recursive loads
    // since setValue will be called again when store is loaded
    if (typeof value === 'number' && value !== me.getValue()) {
      me.value = value
      me.store.load({
        params: { partyId: value }
      })
      return me
    } else {
      return me.callParent(arguments)
    }
  },

  openAddDialog: function() {
    var me = this
    if (!me.partyDialog) {
      me.partyDialog = Ext.widget('party-window')
    }
    me.partyDialog.show()
  },

  initComponent: function() {
    var me = this
    me.callParent(arguments)
    me.on('beforequery', me.onBeforeQuery, me)
    me.getPicker().setWidth(300)
  },

  doDestroy: function() {
    this.partyDialog && this.partyDialog.destroy()
    this.callParent()
  }
})
