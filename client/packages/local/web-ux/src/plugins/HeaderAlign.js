/*
 * Align the header of grid columns differently from those of the content area.
 * Use as:
 *
 * {
 *   xtype: 'grid',
 *   plugins: 'headeralign',
 *   columns: {
 *     items: [{
 *       align: 'left',
 *       headerAlign: 'center'
 *     }]
 *   }
 * }
 */

Ext.define('Web.ux.plugins.HeaderAlign', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.headeralign',

    init: function (grid) {
        var me = this;
        me.grid = grid;
        grid.on('afterrender', me.afterRender, me);
    },

    afterRender: function () {
        var c, cls = 'x-column-header-align-';
        for (var i=0; i < this.grid.columns.length; i++) {
            c = this.grid.columns[i];
            if (c.headerAlign && c.align !== c.headerAlign) {
                c.el.replaceCls(cls + c.align, cls + c.headerAlign);
            }
        }
    }
});
