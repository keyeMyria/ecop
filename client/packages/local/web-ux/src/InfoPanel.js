/*
 * The InfoPlugin adds an info panel to the panel object.
 */

Ext.define('Web.ux.InfoPanel', {
    extend: 'Ext.Component',
    alias: 'widget.infopanel',

    cls: 'ux-info-panel',
    hidden: true,

    constructor: function (config) {
        var me = this;
        if (!config.html) {
            config.html = me.createHtml({
                icon: config.icon,
                msg: config.msg
            });
        }
        me.callParent([config]);
    },

    /*
     *@private
     */
    createHtml: function (config) {
        var html = '';
        if (typeof config === 'object') {
            if (config.icon) {
                html = '<div class="ux-ip-icon ux-ip-' + config.icon + '"></div>';
            }
            html += '<div class="ux-ip-content">' + config.msg + '</div>';
        } else {
            html = config;
        }
        return html;
    },

    showInfo: function (options) {
        var me = this;
        if (options) {
            me.update(me.createHtml(options));
        }

        me.el.slideIn('t', {duration: 500});

        if (options && options.autoHide) {
            Ext.defer(me.hideInfo, options.autoHide, me);
        }
    },

    hideInfo: function () {
        this.el.slideOut('t', {duration: 500});
    }
});
