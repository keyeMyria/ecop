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
          name: 'partyName',
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
          itemId: 'btnAdd',
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
  ]
})

Ext.define('Ecop.widget.PartyPicker', {
  extend: 'Ext.form.field.ComboBox',
  requires: [
    'Web.model.Party',
    'Web.ux.Util' // for gbkLength
  ],
  xtype: 'partypicker',
  cls: 'party-picker',

  config: {
    partyType: 'C'
  },

  queryMode: 'remote',
  store: {
    model: 'Web.model.Party',
    proxy: {
      type: 'jsonrpc',
      method: 'party.search'
    }
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
   * @overrite private
   *
   * The default implementation from ComboBox.js is overriden to allow sending
   * additional `partyType` parameter to `party.search` when doing autocomplete
   */
  getParams: function(queryString) {
    var params = {},
      param = this.queryParam

    if (param) {
      params[param] = queryString
      params.partyType = this.getPartyType()
    }
    return params
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
    if (q.match(/^\d+$/)) return q.length >= 6
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
   * When ever the value of a PartyPicker widget is set to partyId, load
   * the party information first and use it to display widget text. For newly
   * created party, the method can also be called with a returned `Party`
   * object.
   */
  setValue: function(value) {
    var me = this
    /*
     * Note when setValue is called with a partyId, the store has to be loaded
     * first. And after the store is loaded, the setValue will be called again
     * with the same partyId. So we shall be careful not to load the store
     * again and again.
    */
    if (typeof value === 'number' && value !== me.getValue()) {
      me.value = value
      me.store.load({
        params: { partyId: value }
      })
      return me
      // note typeof null is also 'object'
    } else if (typeof value === 'object' && value && value.partyId) {
      me.value = value.partyId
      me.store.setData([value])
      return me.callParent([me.value])
    } else {
      return me.callParent(arguments)
    }
  },

  openAddDialog: function() {
    var me = this
    if (!me.partyDialog) {
      me.partyDialog = Ext.widget('party-window')
      me.partyDialog.down('#btnAdd').on('click', me.onAddParty, me)
    }
    me.partyDialog.show()
  },

  onAddParty: function() {
    var me = this,
      dlg = me.partyDialog,
      form = dlg.down('form').getForm(),
      params = form.getValues()

    if (form.isValid()) {
      params.partyType = me.getPartyType()
      Web.data.JsonRPC.request({
        method: 'party.create',
        params: [params],
        success: function(party) {
          me.setValue(party)
          form.reset()
          dlg.close()
        }
      })
    }
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
