Ext.require('Web.data.Converter', function() {
  Ext.define('Web.model.SeoEntry', {
    extend: 'Ext.data.Model',

    idProperty: 'url',

    fields: [
      { name: 'url' },
      {
        name: 'title',
        defaultValue: null,
        convert: Web.data.Converter.trimNull
      },
      {
        name: 'keywords',
        defaultValue: null,
        convert: Web.data.Converter.trimNull
      },
      {
        name: 'description',
        defaultValue: null,
        convert: Web.data.Converter.trimNull
      }
    ]
  })
})
