Ext.define('Ecop.view.item.EditorController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.item-editor',

  requires: ['Ecop.view.item.ItemWindow'],

  /*
   *@private
   */
  currentRecord: null,
  bomOrderChanged: false,
  imageModified: false,
  moduleModified: false,

  /*
   * Returns the item model that is currently being edited in the ItemForm
   */
  getCurrentItem: function() {
    return this.dialog ? this.dialog.getViewModel().get('currentItem') : null
  },

  createForm: function(record) {
    var me = this,
      view = me.getView(),
      vp = view.up('viewport')

    record = record || Ext.create('Web.model.Item')
    // we add the form to the view instead of to view port in order for the
    // form to access this controller
    me.dialog = view.add({
      xtype: 'item-window',
      width: vp.getWidth() - 100,
      height: vp.getHeight() - 100,
      minHeight: Math.min(vp.getHeight(), 768),
      viewModel: {
        data: {
          currentItem: record
        },
        stores: {
          modules: {
            type: 'tree',
            autoLoad: false,
            proxy: {
              type: 'jsonrpc',
              method: 'item.modules.get',
              params: [record.getId()]
            }
          }
        }
      }
    })

    vp.mask()
    record.beginEdit()
    me.dialog.show().center()
  },

  onContextMenu: function(table, record, tr, rowIndex, e) {
    var me = this,
      menu

    me.currentRecord = record
    e.preventDefault()

    if (!me.contextMenu) {
      me.contextMenu = Ext.widget('menu', {
        width: 100,
        plain: true,

        viewModel: {
          data: null,
          formulas: {
            hideOffline: function(get) {
              var item = get('item')
              return (
                (!Ecop.auth.hasPermission('item.inactivate') &&
                  item.get('isInactive')) ||
                item.get('isOffline')
              )
            }
          }
        },

        items: [
          {
            itemId: 'online',
            text: '商品上线',
            bind: {
              hidden: '{!item.isOffline}'
            }
          },
          {
            itemId: 'offline',
            text: '商品下线',
            bind: {
              hidden: '{hideOffline}'
            }
          },
          {
            itemId: 'inactive',
            text: '冻结商品',
            permission: 'item.inactivate',
            bind: {
              hidden: '{item.isInactive}'
            }
          },
          {
            itemId: 'openitem',
            text: '显示商品',
            bind: {
              hidden: '{!item.isOnline}'
            },
            href: ' ',
            hrefTarget: '_blank'
          },
          {
            itemId: 'qrcode',
            text: '下载二维码',
            permission: 'item.qrcode',
            bind: {
              hidden: '{!item.isOnline}'
            },
            // an 'href' config is required for the default browser click
            // event on 'a' element to be handled
            href: ' ',
            hrefTarget: '_top'
          }
        ],
        listeners: {
          click: me.onContextMenuClick,
          scope: me
        }
      })
    }

    menu = me.contextMenu
    menu.getViewModel().set('item', record)

    Ext.defer(function() {
      var i,
        items = menu.query('menuitem')

      for (i = 0; i < items.length; i++) {
        if (!items[i].isHidden()) {
          menu.showAt(e.getXY())
          // the href attribute of menu item can not be reset
          // we have to do this on the dom level **AFTER** the menu is rendered
          menu.down('#qrcode') &&
            menu.down('#qrcode').el.down('a').set({
              href: '/itemqr?itemId=' + record.get('itemId')
            })
          menu.down('#openitem') &&
            menu.down('#openitem').el.down('a').set({
              href: Ecop.siteUrl + '/item/' + record.get('itemId') + '.html'
            })
          menu.focus()
          break
        }
      }
    }, 50)
  },

  onContextMenuClick: function(menu, item, e) {
    var me = this,
      grid = me.getView(),
      status,
      menuId = item.getItemId()

    if (['qrcode', 'openitem'].indexOf(menuId) !== -1) return

    status = ['online', 'offline', 'inactive'].indexOf(menuId)
    Web.data.JsonRPC.request({
      method: 'item.upsert',
      params: [
        {
          itemId: me.currentRecord.get('itemId'),
          itemStatus: status
        }
      ],
      success: function() {
        me.currentRecord.set('itemStatus', status)
        grid.getView().refresh()
      }
    })
  },

  onItemEditorRender: function() {
    var me = this
    if (Ecop.auth.isVendor()) {
      me.getView().doItemSearch({})
    }
  },

  onItemDblClick: function(grid, td, cellIndex, record) {
    var me = this

    if (cellIndex < 3) {
      me.createForm(record)
    }
  },

  onBtnSave: function() {
    var s = this.getView().getStore(),
      modified = []

    Ext.each(s.getModifiedRecords(), function(item) {
      modified.push(Ext.merge({ itemId: item.getId() }, item.getChanges()))
    })

    if (!Ext.isEmpty(modified)) {
      Web.data.JsonRPC.request({
        method: 'item.upsert',
        params: [modified],
        success: function() {
          s.commitChanges()
        }
      })
    }
  },

  onBtnNewItem: function() {
    this.createForm(null)
  },

  onItemSave: function() {
    var me = this,
      boms = [],
      images = [],
      item = me.getCurrentItem(),
      params = item.getChanges(),
      bomStore = me.dialog.getViewModel().get('boms'),
      imageStore = me.dialog.getViewModel().get('images')

    if (!me.lookup('form').getForm().isValid()) {
      Ecop.util.Util.showError('输入数据存在错误，请检查。')
      return
    }

    if (
      me.bomOrderChanged ||
      !Ext.isEmpty(bomStore.getModifiedRecords()) ||
      !Ext.isEmpty(bomStore.getRemovedRecords())
    ) {
      bomStore.each(function(record) {
        boms.push([record.get('itemId'), record.get('quantity')])
      })
      params.boms = boms
    }

    if (me.imageModified) {
      imageStore.each(function(record) {
        images.push(record.get('imageId'))
      })
      params.images = images
    }

    if (me.moduleModified) {
      var root = me.lookup('moduleTree').getRootNode(),
        modules = {}

      root.eachChild(function(module) {
        var resources = []
        for (var i = 0; i < module.childNodes.length; i++) {
          resources.push(module.childNodes[i].get('rid'))
        }
        if (!Ext.isEmpty(resources)) {
          modules[module.getId()] = resources
        }
      })
      // empty modules is allowed to clear all description
      params.descriptionModules = modules
    }

    if (!Ext.Object.isEmpty(params)) {
      params.itemId = item.getId()
      Web.data.JsonRPC.request({
        method: 'item.upsert',
        params: [params],
        success: function() {
          item.set('isSku', Ext.isEmpty(boms))
          item.commit()
          bomStore.commitChanges()
          Ecop.util.Util.showInfo('商品保存成功。')
        }
      })
    } else {
      Ecop.util.Util.showInfo('商品未发生变化。')
    }
  },

  onItemCancel: function() {
    var me = this
    me.dialog = Ext.destroy(me.dialog)
  },

  beforeItemWinDestroy: function() {
    var me = this,
      item = me.getCurrentItem()
    me.getView().up('viewport').unmask()

    if (item.phantom) {
      Ext.destroy(item)
    } else {
      item.cancelEdit()
    }
  },

  // after the item form is rendered, load the boms and images store
  afterItemFormRender: function() {
    var me = this,
      f = me.dialog,
      item = me.getCurrentItem()
    me.bomOrderChanged = false
    me.imageModified = false

    if (!item.phantom) {
      f.getViewModel().get('images').load({
        params: [item.getId()]
      })

      if (!item.get('isSku')) {
        f.getViewModel().get('boms').load({
          params: [item.getId()]
        })
      }
    }
  },

  onDestroy: function() {
    this.contextMenu.destroy()
  },

  /*
   * =====================  BOM Manipulation  ===========================
   */

  onSkuSelect: function() {
    var btn = this.lookup('btnAddSku')
    btn.enable()
    btn.focus()
  },

  onSkuAdd: function() {
    var me = this
    ;(f = me.dialog), (sku = f
      .down('skuinput')
      .getValue()), (store = me.dialog.getViewModel().get('boms'))
    if (store.find('itemId', sku.getId()) !== -1) {
      Ecop.util.Util.showError('商品在部件清单中已存在。')
    } else if (sku.getId() === me.getCurrentItem().getId()) {
      Ecop.util.Util.showError('商品部件清单不能包含商品自身。')
    } else {
      store.add(Ext.apply({ quantity: 1 }, sku.getData()))
    }
  },

  onSkuDelete: function(btn) {
    btn.getWidgetRecord().drop()
  },

  /*
   * bom item order is changed via grid drag drop, which can not be properly
   * tracked by store methods
   */
  onSkuGridDrop: function() {
    this.bomOrderChanged = true
  },

  /*
   * =====================  Item Image Manipulation  =======================
   */

  /*
   * Client precheck of image based on usage, which can be either 'item-image'
    * (the default) or 'desc-image'.
   * Returns true if check passes or show fail message.
   */
  checkImageFile: function(file, usage) {
    if (!file) return

    // precheck image
    if (['image/jpeg', 'image/png', 'image/gif'].indexOf(file.type) == -1) {
      if (usage === 'item-image') {
        return Ecop.util.Util.showError('只支持jpg、png、gif格式的图片。')
      } else if (!Ext.String.endsWith(file.name, '.psd')) {
        return Ecop.util.Util.showError('只支持jpg、png、gif、psd格式的图片。')
      }
    }

    if (!Ext.String.endsWith(file.name, '.psd')) {
      if (usage === 'item-image' && file.size > 500 * 1024) {
        return Ecop.util.Util.showError('商品主图大小不能超过500KB。')
      }

      if (usage === 'desc-image' && file.size > 2 * 1024 * 1024) {
        return Ecop.util.Util.showError('商品描述图片大小不能超过2MB。')
      }
    }
    return true
  },

  /*
   * First check if the image already exists using md5 of the file. If yes
   * return the found image, otherwise add the image to repository
   */
  addOrUpdateImage: function(file, imgType, imageId) {
    var me = this,
      fileValue

    return new Ext.Promise(function(resolve) {
      var reader = new FileReader()
      reader.onload = function() {
        fileValue = {
          file: file,
          content: reader.result
        }
        resolve(fileValue)
      }
      reader.readAsArrayBuffer(file)
    })
      .then(function(value) {
        var hash
        if (Ext.String.endsWith(value.file.name, '.psd')) {
          return false
        } else {
          hash = new SparkMD5.ArrayBuffer()
          hash.append(value.content)
          return Web.data.JsonRPC.request({
            method: 'image.get.md5',
            params: [btoa(hash.end(true))]
          })
        }
      })
      .then(function(image) {
        if (image) {
          // an existing image
          return image
        } else {
          var params = [
            Ecop.util.Util.arrayBufferToBase64(fileValue.content),
            file.name,
            imgType
          ]
          if (imageId) params.push(imageId)
          return Web.data.JsonRPC.request({
            method: imageId ? 'image.update' : 'image.add',
            params: params,
            mask: {
              component: me.dialog,
              message: '图片上传中，请稍候...'
            }
          })
        }
      })
  },

  newImageOK: function(image) {
    if (this.dialog.getViewModel().get('images').getById(image.imageId)) {
      Ecop.util.Util.showError('图片已存在。')
    } else return true
  },

  onImageAdd: function(fileBtn) {
    var me = this,
      store = me.dialog.getViewModel().get('images'),
      file = fileBtn.el.down('input').dom.files[0]

    fileBtn.fileInputEl.dom.value = ''

    if (store.getCount() > 4) {
      Ecop.util.Util.showError('最多允许5张商品主图。')
      return
    }

    if (!me.checkImageFile(file, 'item-image')) return

    me.addOrUpdateImage(file, 'item').then(function(image) {
      if (me.newImageOK(image)) {
        store.add(Ext.create('Web.model.Image', image))
        me.imageModified = true
      }
    })
  },

  /*
   * Update an item image. Note that description image can not be updated
   */
  onImageUpdate: function(fileBtn) {
    var me = this,
      store = me.dialog.getViewModel().get('images'),
      image = me.lookup('imageList').selection,
      file = fileBtn.el.down('input').dom.files[0]

    fileBtn.fileInputEl.dom.value = ''
    if (!me.checkImageFile(file, 'item-image')) return

    me.addOrUpdateImage(file, 'item', image.getId()).then(function(response) {
      var idx = store.indexOf(image)
      // the original image is replaced
      if (image.getId() === response.imageId) {
        image.beginEdit()
        image.set(response)
        image.endEdit()
      } else if (me.newImageOK(response)) {
        // an existing image found
        image.drop()
        store.insert(idx, Ext.create('Web.model.Image', response))
        me.imageModified = true
      }
    })
  },

  onImageDelete: function() {
    var me = this
    me.lookup('imageList').selection.drop()
    me.imageModified = true
  },

  doImageMove: function(image, idx) {
    var me = this,
      s = image.store

    s.remove(image)
    s.insert(idx, image)
    me.imageModified = true
    // wait till UI is refreshed, not that robust
    Ext.defer(function() {
      me.lookup('imageList').setSelection(image)
    }, 50)
  },

  onImageMoveLeft: function() {
    var me = this,
      vm = me.dialog.getViewModel(),
      idx,
      s = vm.get('images'),
      image = vm.get('selectedImage')

    me.doImageMove(image, s.indexOf(image) - 1)
  },

  onImageMoveRight: function() {
    var me = this,
      vm = me.dialog.getViewModel(),
      s = vm.get('images'),
      image = vm.get('selectedImage')

    me.doImageMove(image, s.indexOf(image) + 1)
  },

  onImageDownload: function() {
    var me = this,
      image = me.lookup('imageList').selection
    window.open(image.get('url'))
  },

  /*
   * =====================  Item Description  ===========================
   */

  onDescShow: function() {
    var me = this,
      f = me.dialog,
      item = me.getCurrentItem()
    ;(me.moduleModified = false), (store = f.getViewModel().get('modules'))

    if (!store.isLoaded()) {
      if (!item.phantom) {
        store.load()
      } else {
        store.setRoot({ expanded: true })
      }
    }
  },

  getCurrentModuleIds: function() {
    var root = this.lookup('moduleTree').getRootNode(),
      mids = []
    for (i = 0; i < root.childNodes.length; i++) {
      mids.push(root.childNodes[i].getId())
    }
    return mids
  },

  onDescBtnAddModule: function() {
    var me = this,
      list = me.lookup('moduleType'),
      store = list.getStore()

    var filter = function() {
      store.filterBy(function(record) {
        return me.getCurrentModuleIds().indexOf(record.getId()) === -1
      })
    }

    if (list.isHidden()) {
      if (!store.isLoaded()) {
        store.load({ callback: filter })
      } else {
        filter()
      }
      list.show()
    } else {
      list.hide()
    }
  },

  onModuleTypeChoice: function(list, record) {
    var me = this,
      root = me.lookup('moduleTree').getRootNode(),
      all = list.getStore().getData().getSource(),
      idx = all.indexOfKey(record.getId()),
      i,
      node = {
        id: record.get('id'),
        text: record.get('text'),
        expanded: true,
        leaf: true,
        allowDrag: false
      }

    list.hide()

    // find the correct position to insert the module
    for (i = 0; i < root.childNodes.length; i++) {
      if (all.indexOfKey(root.getChildAt(i).getId()) > idx) break
    }
    root.insertChild(i, node)
  },

  onDescImageAdd: function(fileBtn) {
    var me = this,
      tree = me.lookup('moduleTree'),
      file = fileBtn.el.down('input').dom.files[0],
      rec = tree.selection

    fileBtn.fileInputEl.dom.value = ''

    if (!me.checkImageFile(file, 'desc-image')) return

    me.addOrUpdateImage(file, 'desc').then(function(image) {
      var imageNode = {
        rid: image.imageId,
        text: image.title,
        type: 1,
        format: image.format,
        url: image.url,
        leaf: true
      }

      if (rec.get('rid')) {
        // this is a resource
        rec.parentNode.insertBefore(imageNode, rec)
      } else {
        // this is a module
        rec.appendChild(imageNode)
      }
      me.moduleModified = true
    })
  },

  onDescRemove: function() {
    var me = this
    me.lookup('moduleTree').selection.remove()
    me.moduleModified = true
  },

  onDescResourceMove: function() {
    this.moduleModified = true
  },

  onDescCopy: function() {
    var me = this
    Ext.Msg.prompt('输入商品号/商品链接', '请输入大管家商品号或天猫商品链接。请注意当前全部描述均会被覆盖！', function(
      btnId,
      text
    ) {
      var itemId
      if (btnId === 'ok' && text) {
        itemId = Number(text.trim())
        if (Ecop.util.Util.isItemId(itemId)) {
          store.getProxy().params = [itemId]
          store.load()
          me.moduleModified = true
        } else {
          Web.data.JsonRPC.request({
            method: 'item.download.taobao',
            params: [me.getCurrentItem().get('itemId'), text],
            mask: {
              component: me.dialog,
              message: '商品拷贝中，请耐心等候...'
            },
            success: function() {
              Ecop.util.Util.showInfo('商品拷贝成功，请重新打开商品。', me.onItemCancel, me)
            }
          })
        }
      }
    })
  },

  /*
   * We can not use bind {data: selection} to automatically update preview
   * since the default Component.update method calls model.getData before
   * passing the data to template, so that the node structure would be lost
   */
  onDescTreeSelect: function(model, record) {
    var me = this,
      cmp = me.lookup('preview')
    cmp.setHtml(cmp.tpl.apply(record))
  },

  /*
   * Preview the whole item description
   */
  onDescPreview: function() {
    var me = this,
      cmp = me.lookup('preview'),
      html = ''
    me.lookup('moduleTree').getRootNode().eachChild(function(module) {
      html += cmp.tpl.apply(module)
    })
    cmp.setHtml(html)
  },

  /*
   * Prevent dropping a resource into module level
   */
  onDescTreeBeforeDrop: function(node, data, overModel, dropPosition) {
    if (!overModel.get('rid') && dropPosition === 'before') {
      return false
    }
  }
})
