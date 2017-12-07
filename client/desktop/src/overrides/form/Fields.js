/*
 * A convenient way to define some default values for fields across the entire
 * application
 */

Ext.define('Ecop.overrides.form.Fields', {
    override: 'Ext.form.field.Base',

    msgTarget: 'under'
});


Ext.define('Ecop.overrides.form.NumberField', {
    override: 'Ext.form.field.Number',

    allowExponential: false,
    hideTrigger: true
});
