Ext.define('Web.model.ShippingAddress', {
  extend: 'Ext.data.Model',

  idProperty: 'shippingAddressId',

  fields: [
    { name: 'shippingAddressId', type: 'int', critical: true },
    { name: 'recipient', type: 'string' },
    { name: 'regionCode', type: 'int' },
    { name: 'regionName', type: 'string', persist: false },
    { name: 'street', type: 'string' },
    { name: 'mobile', type: 'string' },
    { name: 'phone', type: 'string', allowNull: true }
  ],

  validators: [
    {
      type: 'presence',
      field: 'regionCode',
      message: '所在地区必须输入'
    },
    {
      type: 'presence',
      field: 'street',
      message: '街道地址必须输入'
    },
    {
      type: 'presence',
      field: 'mobile',
      message: '手机号码必须输入'
    },
    {
      type: 'format',
      field: 'mobile',
      matcher: /^1\d{10}$/,
      message: '手机号码格式为1开头的11位数字'
    },
    {
      type: 'format',
      field: 'phone',
      matcher: /^0[0-9]{2,3}-[0-9]{5,8}([*\-][0-9]+){0,1}$/,
      message: '固定电话格式如：021-12345678*90，必须输入区号'
    },
    {
      type: 'length',
      field: 'recipient',
      min: 2,
      message: '姓名最少2个字符'
    }
  ]
})
