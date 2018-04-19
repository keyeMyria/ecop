Ext.define('Web.model.Party', {
  extend: 'Ext.data.Model',

  idProperty: 'partyId',

  fields: [
    {
      name: 'partyId',
      type: 'int'
    },
    {
      name: 'login',
      type: 'string',
      validators: [
        {
          type: 'length',
          min: 2,
          max: 20,
          bothMessage: '用户名长度为2-20个字符'
        },
        {
          type: 'format',
          matcher: /^[_a-zA-Z0-9\u4e00-\u9fa5]{2,20}$/,
          message: '用户名只能由字母、数字以及中文字符构成'
        }
      ]
    },
    {
      name: 'partyName',
      type: 'string',
      validators: [
        {
          type: 'length',
          min: 2,
          max: 20,
          bothMessage: '姓名长度为2-20个字符'
        }
      ]
    },
    {
      name: 'password',
      type: 'string',
      validators: [
        {
          type: 'length',
          min: 6,
          max: 12,
          bothMessage: '密码长度为6-12个字符'
        }
      ]
    },
    {
      name: 'email',
      type: 'string',
      allowNull: true,
      validators: [
        {
          type: 'email',
          message: '邮箱格式不正确'
        }
      ]
    },
    {
      name: 'mobile',
      type: 'string',
      validators: [
        {
          type: 'presence',
          message: '请输入手机号'
        },
        {
          type: 'format',
          matcher: /(^\s*$)|(^1\d{10}$)/,
          message: '手机号码格式为1开头的11位数字'
        }
      ]
    }
  ]
})
