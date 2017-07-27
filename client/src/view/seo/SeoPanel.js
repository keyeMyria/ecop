Ext.define('Ecop.view.seo.SeoPanel', {
    extend: 'Ext.Panel',
    xtype: 'seo-panel',

    requires: [
        'Ecop.view.seo.SeoController',
        'Web.model.SeoEntry'
    ],

    controller: 'seo',
    viewModel: {
        stores: {
            entry: {
                model: 'Web.model.SeoEntry'
            }
        },
        data: {
            searchUrl: '/',
            currentEntry: null
        },
        formulas: {
            isNewEntry: function(get) {
                var entry = get('currentEntry');
                return entry && entry.phantom;
            },

            entryModified: {
                bind: {
                    bindTo: '{currentEntry}',
                    deep: true
                },
                get: function (entry) {
                    return entry && entry.dirty;
                }
            }
        }
    },

    layout: 'fit',

    items: [{
        xtype: 'grid',
        title: '搜索优化',
        cls: 'cursor-pointer',

        bind: {
            store: '{entry}'
        },
        enableColumnMove: false,

        tbar: [{
            xtype: 'textfield',
            fieldLabel: 'Url:',
            bind: '{searchUrl}',
            labelWidth: 30,
            width: 280
        }, {
            text: '搜 索',
            iconCls: 'x-fa fa-search',
            handler: 'onSearchUrl'
        }, {
            xtype: 'tbseparator'
        }, {
            text: '添 加',
            iconCls: 'x-fa fa-plus-circle',
            handler: 'onAddEntry'
        }],

        columns: {
            defaults: {
                sortable: false,
                menuDisabled: true,
                align: 'left'
            },
            items: [{
                xtype: 'rownumberer',
                width: 30
            }, {
                text: 'url',
                width: 300,
                dataIndex: 'url'
            }, {
                text: 'title',
                width: 300,
                dataIndex: 'title'
            }, {
                text: 'keywords',
                flex: 1,
                minWidth: 300,
                dataIndex: 'keywords'
            }, {
                text: 'description',
                flex: 2,
                dataIndex: 'description'
            }, {
                xtype: 'widgetcolumn',
                width: 50,
                menuDisabled: true,
                widget: {
                    xtype: 'button',
                    iconCls: 'x-fa fa-times-circle',
                    tooltip: '删除',
                    handler: 'onDeleteEntry'
                }
            }]
        },

        listeners: {
            cellclick: 'onCellClick'
        }
    }]
});