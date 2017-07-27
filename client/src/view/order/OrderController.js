/*
 * The controller associated with OrderPanel for manipulating a single order
 */
Ext.define('Ecop.view.order.OrderController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.order',

    requires: [
        'Ecop.view.order.PaymentWindow'
    ],

    getCurrentOrder: function () {
        return this.getViewModel().get('currentOrder');
    },

    onOrderItemChange: function (store, record, op, fields) {
        if (fields && fields[0] !== 'amount') {
            record.set('amount',
                record.get('sellingPrice') * record.get('quantity'));
            this.refreshAmount();
        }
    },

    loadOrder: function () {
        var me = this, order = me.getCurrentOrder(),
            itemStore = me.lookup('orderitems').getStore();

        Web.data.JsonRPC.request({
            method: 'order.data',
            params: [order.getId()],
            success: function (ret) {
                /*
                 * Merge detailed information into current order record,
                 * as order opened by a click on an order search list
                 */
                order.beginEdit();
                order.set(ret.header);
                order.endEdit();
                order.commit();

                me.getViewModel().set('originalStatus', order.get('orderStatus'));

                itemStore.loadData(ret.items);
                itemStore.commitChanges();
                me.setEditStatus();
            }
        });
    },

    /*
     * Only unpaid orders are allowed to be modified, except that:
     *
     */
    setEditStatus: function () {
        var me = this, view = me.getView(), grid= me.lookup('orderitems'),
            status = me.getCurrentOrder().get('orderStatus');

        if (status == 1) {
            grid.getView().plugins[0].enable();
            grid.getPlugin('edit').enable();
        } else {
            grid.getView().plugins[0].disable();
            grid.getPlugin('edit').disable();
        }
    },

    /*
     * Recalculate the order total amount in the order header
     */
    refreshAmount: function () {
        var me = this, order = me.getCurrentOrder(),
            itemStore = me.lookup('orderitems').getStore();
        order.set('amount',
            itemStore.sum('amount') + order.get('freight') - order.get('rebate'));
        order.set('cost',
            itemStore.sum('cost') + order.get('freightCost'));
    },

    onOrderItemDelete: function (btn) {
        btn.getWidgetRecord().drop();
        // refresh the row number
        this.lookup('orderitems').getView().refresh();
    },

    doAddItems: function (items) {
        var me = this, oi, i,
            itemStore = me.lookup('orderitems').getStore(),
            fields = ['itemId', 'itemName', 'specification', 'purchasePrice',
                'model', 'unitName', 'sellingPrice'];

        Ext.each(items, function(item) {
            // The selector widget could return frozen item when an item id is entered
            // directly. This check guard against this pssibility.
            if (item.get('itemStatus') === 2) {
                Ecop.util.Util.showError(
                    Ext.String.format('商品{0}已冻结，不能添加到订单！', item.getId()));
            } else {
                oi = {};
                for (i = 0; i < fields.length; ++i) {
                    oi[fields[i]] = item.get(fields[i]);
                }
                oi.quantity = 1;
                oi.amount = item.get('sellingPrice');
                itemStore.add(Web.model.OrderItem(oi));
            }
        });
    },

    saveOrder: function (callback) {
        var me = this, f = me.getView().getForm(), formValid = f.isValid(),
            order = me.getCurrentOrder(), headers = order.getChanges(),
            itemStore = me.lookup('orderitems').getStore()
            deleted = [], modified = [], added = [];

        if (formValid) {
            if (!order.get('recipientPhone') && ! order.get('recipientMobile')) {
                f.markInvalid({
                    recipientMobile: '必须输入手机或固定电话之一',
                    recipientPhone: '必须输入手机或固定电话之一'
                });
                formValid = false;
            } else {
                f.findField('recipientPhone').clearInvalid();
                f.findField('recipientMobile').clearInvalid();
            }
        }

        if (!formValid) {
            Ecop.util.Util.showError('输入数据存在错误，请检查。');
            return;
        }

        if (itemStore.getCount() === 0) {
            Ecop.util.Util.showError('不允许保存没有项目的订单！');
            return;
        }

        Ext.each(itemStore.getRemovedRecords(), function (r) {
            deleted.push(r.get('orderItemId'));
        });

        // update the order item position
        for (var i=0; i<itemStore.getCount(); i++) {
            itemStore.getAt(i).set('pos', i);
        }

        Ext.each(itemStore.getModifiedRecords(), function (r) {
            var fields = ['itemId', 'itemName', 'specification', 'model',
                'quantity', 'purchasePrice', 'sellingPrice', 'pos'], oi={};

            for (var i = 0; i < fields.length; ++i) {
                oi[fields[i]] = r.get(fields[i]);
            }
            if (typeof r.get('orderItemId')  === 'number') {
                modified.push([r.get('orderItemId'), oi]);
            } else {
                added.push([r.get('itemId'), oi]);
            }
        });

        if (Ext.isEmpty(deleted) && Ext.isEmpty(modified) &&
            Ext.isEmpty(added) && Ext.Object.isEmpty(headers)) {
            if (typeof callback === 'function') {
                callback.call(me);
            } else {
                Ecop.util.Util.showInfo('订单没有改变，无须保存!');
            }
            return;
        }

        /*
         * Removes derived attributes and associations
         */
        delete headers.amount;
        delete headers.cost;
        delete headers.couponAmount;

        Web.data.JsonRPC.request({
            method: 'order.modify',
            params: [
                order.getId(),
                {
                    header: headers,
                    deleted: deleted,
                    modified: modified,
                    added: added
                }
            ],
            success: function (ret) {
                if (order.phantom) {
                    order.set('orderId', ret);
                }
                if (typeof callback === 'function') {
                    callback.call(me);
                } else {
                    me.loadOrder();
                    Ecop.util.Util.showInfo('订单保存成功!');
                }
            }
        });
    },

    onBtnSwitchPrice: function (btn) {
        var me = this, itemIds = [],
            itemStore = me.lookup('orderitems').getStore()

        itemStore.each(function (oi) {
            itemIds.push(oi.get('itemId'));
        });
        Web.data.JsonRPC.request({
            method: 'order.price.get',
            params: [itemIds, btn.priceType],
            success: function (prices) {
                itemStore.each(function(oi) {
                    oi.set('sellingPrice', prices[oi.get('itemId')]);
                });
                btn.priceType = btn.priceType == 'B' ? 'C' : 'B';
                btn.setText(btn.priceType == 'B' ? 'B价' : 'C价');
            }
        });
    },

    onQueryCoupon: function (queryplan) {
        queryplan.query = this.getCurrentOrder().get('orderId');
    },

    onCouponChange: function (field, newValue, oldValue) {
        var me = this, order = me.getCurrentOrder();
        if (newValue === 0) return;
        order.set('couponAmount',
            newValue ? field.getStore().getById(newValue).get('amount') : 0);
    },

    onBtnPayment: function () {
        var me = this;

        // we add the form to the view instead to view port in order for the
        // form to access this controller
        me.paymentDialog = me.getView().add({
            xtype: 'payment-window',
            layout: 'fit' // TODO: this should be moved to PaymentWindow class
                          // but it seems a bug and can not be placed there.
        });
        me.paymentDialog.show().center();
    },

    onConfirmOrder: function () {
        var me = this,
            params = [me.getCurrentOrder().get('orderId')];

        if (!me.getViewModel().get('creditSales')) {
            params.push(me.lookup('paymentMethod').getValue());
            params.push(me.lookup('paymentAmount').getValue());
        }

        me.saveOrder(function(){
            Web.data.JsonRPC.request({
                method: 'order.pay',
                params: params,
                success: function () {
                    me.paymentDialog.close();
                    me.loadOrder();
                }
            });
        });
    }
});