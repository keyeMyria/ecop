/*
 * This override is intended for hide columns without sufficient permission
 * from being rendered
 */
Ext.define('Ecop.overrides.panel.Table', {
    override: 'Ext.panel.Table',

    initComponent: function () {
        var i, me = this, col, columns = [];

        if (me.columns.items) {
            for (i=0; i<me.columns.items.length; i++) {
                col = me.columns.items[i];
                if (col.permission===undefined || Ecop.auth.hasPermission(col.permission)) {
                    columns.push(col);
                }
            }
            me.columns.items = columns;
        }
        me.callParent(); // call the original overriden method
    }
});