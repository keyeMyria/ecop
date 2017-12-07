Ext.define('Web.ux.Renderers', {
    override: 'Ext.util.Format',
    requires: 'Ext.data.StoreManager',

    storeRenderer: function (store, valueField, displayField) {
        var me = this;
        return function (v) {
            return me.store(v, store, valueField, displayField);
        };
    },

    store: function (v, store, valueField, displayField) {
        var idx, node, ret = '';
        if (v === undefined) {return '';}
        if (typeof store === 'string') {
            store = Ext.StoreMgr.lookup(store);
            if (!store.isLoaded()) store.load();
        }

        if (store.isTreeStore) {
            node = store.getNodeById(v);
            if (node) {
                do {
                    ret = node.get(displayField || 'text') + (ret ? '->' : '') + ret;
                    node = node.parentNode;
                } while (!node.isRoot());
            }
            return ret;
        } else {
            idx = store.findExact(valueField || 'id', v);
            if (idx != -1) {
                ret = store.getAt(idx).get(displayField || 'text');
            }
        }

        return ret;
    },

    currencyRenderer: function (v, f) {
        return Ext.util.Format.currency(v);
    }
});