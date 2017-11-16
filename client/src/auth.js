Ext.define('Ecop.auth', {
  statics: {
    currentUser: undefined,

    hasPermission: function(permission) {
      var me = this,
        perm = me.currentUser && me.currentUser.permission

      return (
        perm &&
        (perm === 'all' || me.currentUser.permission.indexOf(permission) !== -1)
      )
    }
  }
})
