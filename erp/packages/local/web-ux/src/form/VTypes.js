Ext.define('Web.ux.form.VTypes', {
    override: 'Ext.form.field.VTypes',

    phone: function (v) {
        return /^0[0-9]{2,3}-[0-9]{5,8}([*\-][0-9]+){0,1}$/.test(v);
    },
    phoneText: '固定电话格式如：021-12345678*90，必须输入区号',
    phoneMask: /[\d*\-]/,

    mobile: function (v) {
        return /^1\d{10}$/.test(v);
    },
    mobileText: '手机号码格式为1开头的11位数字',
    mobileMask: /\d/,

    docid: function (v) {
        return /^\d{8}$/.test(v);
    },
    docidMask: /\d/,
    docidText: '字段取值应为8位数字'
});
