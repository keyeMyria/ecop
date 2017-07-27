Ext.define('Ecop.view.article.ArticlePanel', {
    extend: 'Ext.FormPanel',
    xtype: 'articlepanel',

    requires: [
        'Web.model.Article',
        'Ecop.view.article.ArticleController',
        'Ecop.widget.CKEditor'
    ],

    controller: 'article',
    closable: true,

    viewModel: {
        data: {
            article: null
        },
        formulas: {
            isNewEntry: function(get) {
                var entry = get('article');
                return entry && entry.phantom;
            }
        }
    },

    layout: {
        type:'vbox',
        align: 'stretch'
    },
    bodyPadding: 5,

    bind: {
        title: '{article.title}'
    },

    items: [{
        xtype: 'container',
        layout: 'hbox',
        margin: '0 0 5 0',

        defaults: {
            labelWidth: 45,
            margin: '0 10 0 0',
            labelAlign: 'right'
        },

        items: [{
            xtype: 'combo',
            labelWidth: 65,
            bind: '{article.articleType}',
            store: 'articletype',
            fieldLabel: '文章类型',
            cls: 'required',
            editable: false,
            valueField: 'id',
            displayField: 'text'
        }, {
            xtype: 'displayfield',
            bind: {
                value: '{article.articleId}',
                hidden: '{!article.articleId}'
            },
            fieldLabel: '文章Id'
        }, {
            xtype: 'textfield',
            bind: '{article.title}',
            cls: 'required',
            fieldLabel: '标题',
            allowOnlyWhitespace: false,
            minWidth: 300
        }, {
            xtype: 'textfield',
            bind: '{article.url}',
            fieldLabel: 'url',
            minWidth: 150
        }, {
            xtype: 'textfield',
            bind: '{article.tags}',
            fieldLabel: '标签',
            minWidth: 150
        }, {
            xtype: 'checkboxfield',
            bind: '{article.published}',
            fieldLabel: '发布'
        }, {
            xtype: 'displayfield',
            bind: '{article.updateTime}',
            labelWidth: 65,
            fieldLabel: '更新时间',
            renderer: Ext.util.Format.dateRenderer('Y-m-d')
        }]
    }, {
        xtype: 'ckeditor',
        name: 'content',
        bind: '{article.content}',
        labelWidth: 65,
        labelAlign: 'right',
        fieldLabel: '文章内容',
        cls: 'required',
        flex: 1
    }],

    buttonAlign: 'center',
    buttons: [{
        text: '保存',
        scale: 'medium',
        handler: 'onSave'
    }, {
        text: '取消',
        scale: 'medium',
        handler: 'onCancel'
    }, {
        text: '删除',
        scale: 'medium',
        handler: 'onDelete',
        permission: 'article.delete',
        bind: {
            hidden: '{isNewEntry}'
        }
    }]
});