Ext.define('Ecop.widget.DateRangeField', {
    extend: 'Ext.form.FieldSet',
    xtype: 'daterange',

    title: '日期范围',
    layout: 'hbox',
    padding: '0 5 5 0',

    items: [{
        xtype: 'radiogroup',
        defaults: {
            width: 80
        },
        items: [
            { boxLabel: '今天', name: 'daterange', inputValue: 1, checked: true, width: 50},
            { boxLabel: '最近一周', name: 'daterange', inputValue: 2},
            { boxLabel: '起始日期', name: 'daterange', inputValue: 3, itemId: 'range'}
        ]
    }, {
        xtype: 'datefield',
        itemId: 'startDate',
        disabled: true,
        width: 110,
        format: 'Y-m-d'
    }, {
        xtype: 'datefield',
        itemId: 'endDate',
        disabled: true,
        fieldLabel: '结束日期',
        margin: '0 0 0 5',
        width: 170,
        labelWidth: 60,
        format: 'Y-m-d',
        value: new Date()
    }],

    initComponent: function () {
        var me=this, startDate = new Date();
        me.callParent();
        me.down('#range').on('change', me.onBtn3Change, me);
        startDate.setDate(startDate.getDate() - 7);
        me.down('#startDate').setValue(startDate);
    },

    onBtn3Change: function (radio, newValue) {
        Ext.each(this.query('datefield'), function (cmp) {
            cmp.setDisabled(!newValue);
        });
    },

    getValue: function () {
        var me = this, sel = me.down('radiogroup').getValue().daterange,
            start = new Date(), end = new Date();
        /*
         * there could be a fleeting moment when two of the buttons are
         * selected simultaneously
         */
        if (Ext.isArray(sel)) {
            return;
        }

        switch (sel) {
            case 1:
                break;
            case 2:
                start.setDate(start.getDate() - 7);
                break;
            case 3:
                start = me.down('#startDate').getValue();
                end = me.down('#endDate').getValue()
        }

        return {start: start, end: end}
    }
});