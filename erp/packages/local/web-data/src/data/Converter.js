Ext.define('Web.data.Converter', {
    singleton: true,

    /*
     * The function strips a string and if the result is empty, return null
     */
    trimNull: function (v) {
        v = v && v.trim();
        return v === '' ? null : v;
    }
});
