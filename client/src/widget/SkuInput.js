Ext.define('Ecop.internal.SkuPicker', {
    extend: 'Ext.form.field.Picker',
    xtype: 'skupicker',

    mixins: ['Ext.util.StoreHolder'],

    /*
     * The picker (the dropdown) must have its zIndex managed by the same
     * ZIndexManager which is providing the zIndex of our Container.
     */
    onAdded: function() {
        var me = this
        me.callParent(arguments)
        if (me.picker) {
            me.picker.ownerCt = me.up('[floating]')
            me.picker.registerWithOwnerCt()
        }
    },

    createPicker: function() {
        var me = this

        me.picker = Ext.widget({
            xtype: 'grid',
            selModel: 'rowmodel',
            floating: true,
            height: 200,
            hidden: true,
            store: me.getStore(),
            columns: {
                defaults: {
                    menuDisabled: true,
                    sortable: false,
                    draggable: false,
                    resizable: false
                },
                items: [
                    {
                        text: '商品号',
                        width: 80,
                        align: 'center',
                        dataIndex: 'itemId'
                    },
                    {
                        text: '商品名称',
                        width: 300,
                        dataIndex: 'itemName'
                    },
                    {
                        text: '规格',
                        width: 150,
                        dataIndex: 'specification'
                    },
                    {
                        text: '型号',
                        width: 150,
                        dataIndex: 'model'
                    }
                ]
            },
            listeners: {
                select: me.onItemSelect,
                scope: me
            }
        })
        return me.picker
    },

    initComponent: function() {
        var me = this
        me.bindStore({
            proxy: {
                type: 'jsonrpc',
                method: 'item.sku.search'
            },
            model: 'Web.model.Item'
        })
        me.callParent()
        me.on('specialKey', me.onTextFieldSpecialKey, me)
        me.enableBubble('skuselect')
    },

    onItemSelect: function(grid, record) {
        var me = this
        if (me.isExpanded) me.collapse()
        me.fireEvent('skuselect', record)
    },

    onTextFieldSpecialKey: function(field, e) {
        var me = this,
            term = me.getRawValue(),
            store = me.getStore()

        if (e.getKey() !== e.ENTER) return
        if (Ext.String.trim(term) != term) {
            me.setRawValue((term = Ext.String.trim(term)))
        }
        if (term.length < 3) {
            Ecop.util.Util.showError('商品型号最少长度为３个字符。')
            return
        }

        store.load({
            params: [me.getRawValue()],
            callback: function() {
                if (store.count() === 1) {
                    me.onItemSelect(null, store.first())
                } else if (store.count() > 1) {
                    me.expand()
                }
            }
        })
    }
})

Ext.define('Ecop.widget.SkuInput', {
    extend: 'Ext.Container',
    xtype: 'skuinput',

    config: {
        value: null
    },

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    defaults: {
        xtype: 'container',
        layout: 'hbox',
        padding: '5 0 0 0'
    },

    viewModel: {
        data: null
    },

    items: [
        {
            defaults: {
                xtype: 'textfield',
                editable: false,
                labelWidth: 50,
                labelAlign: 'right'
            },
            items: [
                {
                    xtype: 'skupicker',
                    editable: true,
                    fieldLabel: '型号',
                    flex: 1
                },
                {
                    fieldLabel: '商品号',
                    bind: '{record.itemId}'
                }
            ]
        },
        {
            defaults: {
                xtype: 'textfield',
                editable: false,
                labelWidth: 50,
                labelAlign: 'right'
            },
            items: [
                {
                    labelWidth: 60,
                    fieldLabel: '商品名称',
                    flex: 2,
                    bind: '{record.itemName}'
                },
                {
                    fieldLabel: '规格',
                    flex: 1,
                    bind: '{record.specification}'
                }
            ]
        }
    ],

    initComponent: function() {
        var me = this
        me.callParent()
        me.down('skupicker').on('skuselect', me.onSkuSelect, me)
    },

    onSkuSelect: function(record) {
        var me = this
        me.getViewModel().set('record', record)
        me.setValue(record)
        me.down('skupicker').setRawValue(record.get('model'))
    }
})
