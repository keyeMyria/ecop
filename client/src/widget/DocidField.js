Ext.define('Ecop.widget.DocidField', {
  extend: 'Ext.form.field.Number',
  xtype: 'idfield',

  allowDecimals: false,
  allowExponential: false,
  minValue: 10000000,
  maxLength: 8,
  enforceMaxLength: true,
  validateOnChange: false,
  keyNavEnabled: false,
  mouseWheelEnabled: false,
  hideTrigger: true
})
