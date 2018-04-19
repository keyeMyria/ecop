/*
 * Extends Web.ux.form.TreeCombo with
 *
 *  1. Only allow selection of leaf node level
 *  2. Upon selection, show full name of the region in combox box
 */

Ext.define('Web.ux.form.RegionSelector', {
    extend: 'Web.ux.form.TreeCombo',
    requires: 'Web.store.RegionStore',
    alias: 'widget.regionselector',

    editable: false, // no entering text directly
    rootVisible: false,
    treeHeight: 300,
    valueField: 'id',
    displayField: 't',
    value: null,

    initComponent: function () {
        var me = this;

        me.store = Ext.getStore('regions');
        me.callParent(arguments);
        me.tree.on({
            show: function () {
                var root = me.tree.getRootNode();
                if (!root.isExpanded()){
                    root.expand();
                }
            }
        });
    },

    /*
     * @public
     */
    setValue: function (valueInit) {
        if (valueInit === undefined) {return; }

        var me = this,
            tree = this.tree,
            values = (valueInit === '') ? [] : valueInit,
            inputEl = me.inputEl;

        if (tree.store.isLoading()) {
            me.afterLoadSetValue = valueInit;
        }

        if (inputEl && me.emptyText && !Ext.isEmpty(values)) {
            inputEl.removeCls(me.emptyUICls);
        }

        me.value = valueInit;
        me.setRawValue(me.store.getRegionName(valueInit));
        me.checkChange();
        return me;
    },

    validator: function (value) {
        var me = this,
            node = me.store.getNodeById(me.value);

        if (me.value && node && !node.isLeaf()) {
            return '请选择区域到区县一级';
        } else {
            return true;
        }
    }
});
