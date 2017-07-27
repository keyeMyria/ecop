Ext.define('Ecop.view.item.ItemWindow', {
    extend: 'Ext.window.Window',

    requires: [
        'Ecop.view.item.ItemForm',
        'Ecop.view.item.ItemDescription'
    ],

    xtype: 'item-window',
    cls: 'item-window',

    /*
     * controller
     * The view controller is inherited from the parent container EditorGrid.
     */

    closable: true,
    modal: true,
    bind: {
        title: '{title}'
    },
    layout: 'fit',

    items: [{
        xtype: 'tabpanel',

        items: [{
            xtype: 'item-form',
            title: '基础信息',
            reference: 'form',
            bodyPadding: 5
        }, {
            xtype: 'item-desc',
            title: '商品描述'
        }]
    }],

    buttons: [{
        text: '保存',
        scale: 'medium',
        handler: 'onItemSave'
    }, {
        text: '关闭',
        scale: 'medium',
        handler: 'onItemCancel'
    }],
    buttonAlign: 'center',
    listeners: {
        beforedestroy: 'beforeItemWinDestroy'
    }
});
