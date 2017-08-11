Ext.define('Ecop.widget.CouponPicker', {
  extend: 'Ext.form.field.ComboBox',
  xtype: 'couponpicker',

  requires: ['Web.model.Coupon'],

  editable: false,
  store: {
    proxy: {
      type: 'jsonrpc',
      method: 'order.coupon.get'
    },
    model: 'Web.model.Coupon'
  },
  queryParam: 'orderId',

  valueField: 'uid',
  displayField: 'amount',

  tpl: [
    '<tpl for=".">',
    '<div class="x-boundlist-item">{couponName} - 满{minOrderAmount}减{amount}</div>',
    '</tpl>'
  ],

  plugins: 'cleartrigger',

  setValue: function(value) {
    var me = this
    // this is very important to prevent infinitely recursive loads
    // since setValue will be called again when store is loaded
    if (value && value !== me.getValue()) {
      Web.data.JsonRPC.request({
        method: 'coupon.data',
        params: [value],
        success: function(coupon) {
          me.store.loadData(coupon)
          me.doSetValue(value)
        }
      })
      return me
    } else {
      return me.callParent(arguments)
    }
  }
})
