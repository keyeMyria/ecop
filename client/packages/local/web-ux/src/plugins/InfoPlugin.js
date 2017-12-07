/*
 * Usage:
 *     plugins: [{
 *         ptype: 'infoplugin',
 *         iconCls: 'error',
 *         msg: 'Hello World'
 *     }],
 */

Ext.define('Web.ux.plugins.InfoPlugin', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.infoplugin',
    requires: 'Web.ux.InfoPanel',

    init: function (p) {
        var config = {
            xtype: 'infopanel'
        };

        Ext.apply(config, this.config);
        p._infoPanel = p.insert(0, config);

        p.showInfo = p._infoPanel.showInfo.bind(p._infoPanel);
        p.hideInfo = p._infoPanel.hideInfo.bind(p._infoPanel);
    }
});
