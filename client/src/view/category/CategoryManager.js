Ext.define('Ecop.view.category.CategoryManager', {
    extend: 'Ext.tree.Panel',
    xtype: 'category-manager',

    requires: [
        'Ecop.view.category.CategoryController'
    ],

    controller: 'category',

    cls: 'cat-tree',

    store: {
        autoLoad: false,
        proxy: {
            type: 'jsonrpc',
            method: 'category.get'
        }
    },
    root: {
        expanded: true
    },
    useArrows: true,
    rootVisible: false,
    hideHeaders: true,

    columns: [{
        xtype: 'treecolumn',
        sortable: false,
        renderer: function (v, c, record) {
            return record.get('text') + ' [' + record.get('num') + ']';
        },
        flex: 1
    }],

    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        disabled: true,

        items: [{
            iconCls: 'x-fa fa-plus-circle',
            tooltip: '新增分类',
            handler: 'onAddCat'
        }, {
            iconCls: 'x-fa fa-minus-circle',
            tooltip: '删除分类',
            handler: 'onDeleteCat'
        }, {
            iconCls: 'x-fa fa-pencil',
            tooltip: '修改分类名称',
            handler: 'onEditCatLabel'
        }, {
            iconCls: 'x-fa fa-save',
            tooltip: '保存分类变更',
            handler: 'onSaveCatEdit'
        }, {
            iconCls: 'x-fa fa-times-circle',
            tooltip: '取消分类变更',
            handler: 'onCancelCatEdit'
        }]
    }],

    viewConfig: {
        plugins: [{
            ptype: 'treeviewdragdrop',
            containerScroll: true
        }],
        listeners: {
            drop: 'onMoveCat',
            beforeDrop: 'beforeMoveCat'
        }
    },

    listeners: {
        afterrender: 'onAfterRender'
    },

    enableEdit: function (enabled) {
        var me = this;
        if (enabled || enabled === undefined) {
            me.down('toolbar').enable();
            me.getView().plugins[0].dragZone.unlock();
        } else {
            me.down('toolbar').disable();
            me.getView().plugins[0].dragZone.lock();
        }
    },

    isModified: function () {
        return !Ext.isEmpty(this.controller.modified);
    }

});