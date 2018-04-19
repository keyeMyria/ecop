Ext.define('Web.model.Article', {
  extend: 'Ext.data.Model',

  idProperty: '_id',

  fields: [
    { name: '_id', type: 'string', critical: true },
    { name: 'articleId', type: 'string', persist: false },
    { name: 'articleType', type: 'string' },
    { name: 'url', type: 'string' },
    { name: 'tags', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'content', type: 'string' },
    { name: 'published', type: 'boolean', defaultValue: false },
    {
      name: 'updateTime',
      type: 'date',
      dateFormat: 'Y-m-d H:i:s',
      persist: false
    }
  ]
})
