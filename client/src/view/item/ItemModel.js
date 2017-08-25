Ext.define('Ecop.view.item.ItemModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.item',

  requires: ['Web.model.Image', 'Web.model.BomItem'],

  stores: {
    boms: {
      model: 'Web.model.BomItem',
      autoLoad: false,
      proxy: {
        type: 'jsonrpc',
        method: 'item.bom.get'
      }
    },

    images: {
      model: 'Web.model.Image',
      autoLoad: false,
      proxy: {
        type: 'jsonrpc',
        method: 'item.images.get'
      }
    }
  },

  data: {
    currentItem: null
  },

  formulas: {
    showRight: function(get) {
      var s = get('images'),
        record = get('selectedImage')
      return record && s.indexOf(record) < s.getCount() - 1
    },

    showLeft: function(get) {
      var s = get('images'),
        record = get('selectedImage')
      return record && s.indexOf(record) > 0
    },

    itemId: function(get) {
      var item = get('currentItem')
      return item.phantom ? '新商品' : item.getId()
    },

    title: function(get) {
      var item = get('currentItem')
      return item.phantom ? '新增商品' : '编辑商品: ' + item.get('itemName')
    },

    isNewItem: function(get) {
      return get('currentItem').phantom
    }
  }
})
