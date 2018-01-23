Ext.define('Ecop.view.article.CaseController', {
  extend: 'Ecop.view.article.BaseArticleController',
  alias: 'controller.case',

  /*
   * First check if the image already exists using md5 of the file. If yes
   * return the found image, otherwise add the image to repository
   */
  addImage: function(file, imgType, imageId) {
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
        var hash = new SparkMD5.ArrayBuffer()
        hash.append(value.content)
        return Web.data.JsonRPC.request({
          method: 'fileobject.get.md5',
          params: [btoa(hash.end(true))]
        })
      })
      .then(function(image) {
        if (image) {
          // an existing image
          return image
        } else {
          return Web.data.JsonRPC.request({
            method: 'fileobject.add',
            params: [Ecop.util.Util.arrayBufferToBase64(fileValue.content)],
            mask: {
              component: me.getView(),
              message: '图片上传中，请稍候...'
            }
          })
        }
      })
  },

  onImageAdd: function(fileBtn) {
    var me = this,
      store = me.getViewModel().get('images'),
      file = fileBtn.el.down('input').dom.files[0]

    fileBtn.fileInputEl.dom.value = ''

    if (store.getCount() > 8) {
      Ecop.util.Util.showError('最多允许9张案例图片。')
      return
    }

    if (['image/jpeg', 'image/png', 'image/gif'].indexOf(file.type) == -1) {
      Ecop.util.Util.showError('只支持jpg、png、gif格式的图片。')
      return
    }

    me.addImage(file).then(function(image) {
      if (store.findRecord('name', image)) {
        Ecop.util.Util.showError('图片已存在。')
        return
      }

      store.add({ name: image })
      me.imageModified = true
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
      vm = me.getViewModel(),
      idx,
      s = vm.get('images'),
      image = vm.get('selectedImage')

    me.doImageMove(image, s.indexOf(image) - 1)
  },

  onImageMoveRight: function() {
    var me = this,
      vm = me.getViewModel(),
      s = vm.get('images'),
      image = vm.get('selectedImage')

    me.doImageMove(image, s.indexOf(image) + 1)
  },

  onSave: function() {
    var me = this,
      params,
      vm = me.getViewModel(),
      s = vm.get('images'),
      f = me.getView().getForm(),
      article = me.getModel()

    if (!f.isValid()) {
      return
    }

    if (!s.getCount()) {
      return Ecop.util.Util.showError('案例图片不能为空')
    }

    params = article.phantom
      ? article.getData()
      : article.getData({ changes: true, critical: true })

    if (me.imageModified) {
      params.images = []
      s.each(function(image) {
        params.images.push(image.get('name'))
      })
    } else {
      delete params.images
    }

    Web.data.JsonRPC.request({
      method: 'article.save',
      params: [params],
      success: function(response) {
        Ecop.util.Util.showInfo('案例保存成功。')
        article.set(response)
        article.commit()
      }
    })
  }
})
