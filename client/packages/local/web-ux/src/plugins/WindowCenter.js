/*
 * Centers the window on view port instead of on container
 * Usage:
 *     xtype: {
 *         type: 'window',
 *         plugins: 'centeronviewport'
 *     }
 *
 *     win.center()
 */

Ext.define('Web.ux.plugins.WindowCenter', {
  extend: 'Ext.plugin.Abstract',
  alias: 'plugin.centeronviewport',

  init: function (win) {
    this.win = win;
    win.center = this.center.bind(win)
  },

  center: function () {
      var me = this
      , top  = window.pageYOffset || document.documentElement.scrollTop
      , left = window.pageXOffset || document.documentElement.scrollLeft
      , size = Ext.Element.getViewSize()
      ;

      me.setXY([
          left+(size.width-me.getWidth())/2,
          top+(size.height-me.getHeight())/2
      ]);
    return me;
  }
});
