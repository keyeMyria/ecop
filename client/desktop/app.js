// This is used only for development
Ext.Loader.setConfig({
  disableCaching: false,
  paths: {
    Ecop: 'http://' + window.location.hostname + ':8080/ecop/client/desktop/src',
    'Web.ux':
      'http://' +
      window.location.hostname +
      ':8080/ecop/client/packages/local/web-ux/src',
    Web:
      'http://' +
      window.location.hostname +
      ':8080/ecop/client/packages/local/web-data/src'
  }
})
Ext.ariaWarn = Ext.emptyFn

/*
 * Below are absolutely necessaries dependencies. There is no need to repeat
 * thesse elsewhere
 */

Ext.require([
  'Ext.data.Store',
  'Ext.data.ArrayStore',
  'Ext.data.TreeStore',
  'Ext.data.validator.Presence',
  'Ext.data.validator.Length',

  'Ext.layout.container.Fit',
  'Ext.layout.container.Border',
  'Ext.tip.QuickTipManager',
  'Ext.tab.Panel',
  'Ext.view.View',

  'Ext.form.Panel',
  'Ext.form.FieldSet',
  'Ext.form.RadioGroup',
  'Ext.form.field.Checkbox',
  'Ext.form.field.ComboBox',
  'Ext.form.field.Number',
  'Ext.form.field.Display',
  'Ext.form.field.Date',
  'Ext.form.field.File',
  'Ext.form.field.FileButton',

  'Ext.grid.column.RowNumberer',
  'Ext.grid.column.Widget',
  'Ext.grid.column.Template',
  'Ext.grid.plugin.CellEditing',
  'Ext.grid.plugin.DragDrop',
  'Ext.selection.CheckboxModel',
  'Ext.tree.Column',
  'Ext.tree.plugin.TreeViewDragDrop',

  'Ext.app.ViewModel',
  'Ext.Promise',

  'Web.ux.overrides.Locale',
  'Web.ux.plugins.ClearTrigger',
  'Web.ux.plugins.HeaderAlign',
  'Web.ux.plugins.WindowCenter',

  'Web.data.JsonRPC',
  'Web.JsonRPCProxy',
  'Web.store.enum',

  'Ecop.util.Util',
  'Ecop.auth',
  'Ecop.overrides.form.Fields',
  'Ecop.overrides.panel.Table',
  'Ecop.overrides.Container'
])

Ext.application('Ecop.Application')
