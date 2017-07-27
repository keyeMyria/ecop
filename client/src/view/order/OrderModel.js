Ext.define('Ecop.view.order.OrderModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.order',

    formulas: {
        restAmount: function (get) {
            return get('currentOrder.amount') - get('currentOrder.couponAmount');
        },

        profit: function (get) {
            return get('restAmount') - get('currentOrder.cost');
        },

        margin: function (get) {
            var amount = get('restAmount');
            return amount ? get('profit') / amount : 0;
        },

        title: function (get) {
            return typeof get('currentOrder.orderId') === 'string' ? '新建订单' : get('currentOrder.recipientName');
        },

        downloadUrl: function (get) {
            return Ext.String.format('/order/{0}.pdf?uid={1}&token={2}',
                get('currentOrder.orderId'),
                Ecop.auth.currentUser.partyId,
                Web.JsonRPCProxy.token);
        },

        /*
         * If an order is completed, disable the save button
         */
        saveButtonDisabled: function (get) {
            return get('originalStatus') === 4;
        },

        /*
         * An order in bid status is editable
         */
        orderEditable: function (get) {
            return get('originalStatus') === 1;
        }
    }
});
