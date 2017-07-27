Ext.define('Ecop.widget.CustomerPicker', {
    extend: 'Ext.form.field.ComboBox',
    requires: [
        'Web.model.User',
        'Web.ux.Util' // for gbkLength
    ],
    xtype: 'customerpicker',

    queryMode: 'remote',
    store: {
        proxy: {
            type: 'jsonrpc',
            method: 'user.search'
        },
        model: 'Web.model.User'
    },

    minChars: 0,
    hideTrigger: true,
    matchFieldWidth: false,
    forceSelection: true,
    triggerAction: 'query',

    valueField: 'partyId',

    // this is important for findRecordByDisplay to work properly
    displayField: 'partyId',

    tpl: [
        '<tpl for=".">',
        '<div class="x-boundlist-item">{partyType}{partyId} - {partyName},{mobile}</div>',
        '</tpl>'
    ],
    displayTpl: [
        '<tpl for=".">',
        '{partyType}{partyId} - {partyName}',
        '</tpl>'
    ],

    validator: function (v) {
        var me = this;
        if (!me.allowBlank && v && me.getValue() === null) {
            return '该输入项为必输项';
        }
        return true;
    },

    initComponent: function () {
        var me = this;
        me.callParent(arguments);
        me.on('beforequery', me.onBeforeQuery, me);
        me.getPicker().setWidth(300);
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
        var me = this, q = queryPlan.query;
        if (q.match(/^\d+$/)) return q.length >= 5;
        return Ext.String.gbkLength(queryPlan.query) >= 4;
    },

    /*
     * Since we used display template to alter the raw value of the textbox,
     * we shall customize how to find a record by display value
     */
    findRecordByDisplay: function (value) {
        return this.callParent([value.substr(1,8)]);
    },

    /*
     * When ever the value of a CustomerPicker widget is set to partyId, load
     * the party information first and use it to display widget text
     */
    setValue: function(value) {
        var me = this;
        // this is very important to prevent infinitely recursive loads
        // since setValue will be called again when store is loaded
        if (typeof value === 'number' && value !== me.getValue()) {
            me.value = value;
            me.store.load({
                params: {partyId: value}
            });
            return me;
        } else {
            return me.callParent(arguments);
        }
    }

});
