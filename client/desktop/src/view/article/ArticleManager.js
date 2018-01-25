Ext.define('Ecop.view.article.ArticleManager', {
  extend: 'Ext.tab.Panel',
  xtype: 'article-manager',

  requires: [
    'Web.model.Article',
    'Ecop.view.article.ArticleManagerController',
    'Ecop.view.article.ArticlePanel',
    'Ecop.view.article.CasePanel'
  ],

  controller: 'article-manager',
  activeItem: 0,

  items: [
    {
      xtype: 'grid',
      reference: 'article-list',
      title: '搜索内容',
      cls: 'cursor-pointer',

      store: {
        model: 'Web.model.Article',
        sorters: {
          property: 'updateTime',
          direction: 'DESC'
        }
      },

      tbar: [
        {
          xtype: 'textfield',
          reference: 'searchText',
          fieldLabel: '标题/标签:',
          labelWidth: 60,
          plugins: 'cleartrigger',
          width: 280
        },
        {
          xtype: 'combo',
          reference: 'articleType',
          fieldLabel: '内容类型',
          labelWidth: 60,
          editable: false,
          value: 'tip',
          valueField: 'id',
          plugins: 'cleartrigger',
          store: 'articletype',
          width: 180
        },
        {
          text: '搜 索',
          iconCls: 'x-fa fa-search',
          handler: 'onSearchArticle'
        }
      ],

      columns: {
        defaults: {
          menuDisabled: true,
          align: 'left'
        },
        items: [
          {
            xtype: 'rownumberer',
            width: 30
          },
          {
            text: 'id',
            width: 100,
            dataIndex: 'articleId'
          },
          {
            text: 'url',
            width: 200,
            dataIndex: 'url'
          },
          {
            text: '类型',
            width: 80,
            dataIndex: 'articleType',
            formatter: 'store("articletype", "id", "text")'
          },
          {
            text: '标题',
            width: 300,
            dataIndex: 'title'
          },
          {
            text: '标签',
            width: 150,
            dataIndex: 'tags'
          },
          {
            xtype: 'checkcolumn',
            text: '发布',
            width: 50,
            align: 'center',
            dataIndex: 'published'
          },
          {
            text: '更新时间',
            width: 90,
            dataIndex: 'updateTime',
            formatter: 'date("Y-m-d")'
          }
        ]
      },

      buttonAlign: 'center',
      buttons: [
        {
          text: '添加文章',
          scale: 'medium',
          handler: 'onNewArticle',
          iconCls: 'x-fa fa-plus-circle'
        },
        {
          text: '添加案例',
          scale: 'medium',
          handler: 'onNewCase',
          iconCls: 'x-fa fa-plus-circle'
        }
      ],

      listeners: {
        cellclick: 'onOpenArticle'
      }
    }
  ]
})
