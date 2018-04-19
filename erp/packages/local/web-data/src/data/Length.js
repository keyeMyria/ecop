/*
 * The default Lenght validator also checks the presence of the field. So
 * a max = 30 would mean 'not null and max=30'.
 *
 * We override the validate function of Ext.data.Model so that empty values
 * are accepted by Length. Any way we have already separate presence check.
 */
Ext.define('Web.data.Length', {
    override: 'Ext.data.validator.Length',

    getValue: function (v) {
        if (v === undefined || v === null) {
            return 0;
        }
        return String(v).length;
    }

});
