/*
 * Add a clear trigger to textfield and subclasses like combo. Once clicked
 * the field value will be set to null. E.g.:
 *
 *   {
 *       xtype: 'textfield',
 *       plugins: 'cleartrigger',
 *   }
 *
 * The style 'x-form-clear-trigger' is provided by the default sencha theme
 * and needs not be defined in the package.
 */

Ext.define('Web.ux.plugins.ClearTrigger', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.cleartrigger',

    init: function (field) {
        field.setTriggers(Ext.merge(field.triggers, {
            clear: {
                cls: 'x-form-clear-trigger',
                hideOnReadOnly: true,
                hidden: false,
                handler: function () {
                    this.setValue(null);
                }
            }
        }));
    }
});
