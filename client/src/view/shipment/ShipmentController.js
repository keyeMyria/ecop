Ext.define('Ecop.view.shipment.ShipmentController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.shipment',

    requires: [
        'Ecop.util.Cainiao'
    ],

    getShipment: function () {
        return this.getViewModel().get('shipment');
    },

    /*
     * Reload the shipment data from server
     */
    loadShipment: function () {
        var me = this, shipment = me.getShipment(),
            skuStore = me.lookup('skus-grid').getStore(),
            packageStore = me.lookup('package-grid').getStore();

        Web.data.JsonRPC.request({
            method: 'shipment.data',
            params: [shipment.getId()],
            success: function (ret) {
                /*
                 * Merge extra information into current shipment record
                 */
                shipment.set(ret.header);
                shipment.commit();

                skuStore.loadData(ret.skus);
                packageStore.loadData(ret.packages);
            }
        });
    },

    onWaybillPrinted: function (shipperCode, documentId) {
        var me = this
        , packageStore = me.lookup('package-grid').getStore()
        , record;

        Web.data.JsonRPC.request({
            method: 'shipment.waybill.markPrinted',
            params: [shipperCode, documentId]
        }).then(function (printTime) {
            record = packageStore.findRecord('documentId', documentId);
            if (!record.get('packageStatus')) {
                record.set('packageStatus', 1);
            }
            record.set('printTime', printTime);
            record.commit();
        });
    },

    /*
     * Given the data of waybill, use Cainiao component to print it
     */
    doPrintWaybill: function (printData) {
        var me = this;

        Ecop.util.Cainiao.printWaybill(me.getShipment(), printData,
            me.onWaybillPrinted.bind(me));
    },

    /*
     * Request a new waybill and then print it
     */
    printNewWaybill: function (shipment) {
        var me = this;

        Web.data.JsonRPC.request({
            method: 'shipment.waybill.get',
            params: [shipment.getId()]
        }).then(function(printData) {
            me.loadShipment();
            me.doPrintWaybill(printData);
        });
    },

    onPrintNewWaybill: function () {
        var me = this
        , shipment = me.getShipment()
        , packageStore = me.lookup('package-grid').getStore();

        if (packageStore.getCount() > 0) {
            Ext.Msg.confirm('请确认', '是否需要打印新面单？', function(btnId) {
                if (btnId === 'yes') {
                    me.printNewWaybill(shipment);
                }
            });
        } else {
            me.printNewWaybill(shipment);
        }
    },

    onReprintWaybill: function () {
        var me = this
        , shipment = me.getShipment()
        , record = arguments[5];

        Ext.Msg.confirm('请确认', '重新打已印当前面单？', function(btnId) {
            if (btnId === 'yes') {
                Web.data.JsonRPC.request({
                    method: 'shipment.waybill.reprint',
                    params: [shipment.get('shipperCode'), record.get('documentId')]
                }).then(me.doPrintWaybill.bind(me));
            }
        });
    },

    onCancelWaybill: function () {
        var me = this
        , shipment = me.getShipment()
        , record = arguments[5];

        Ext.Msg.confirm('请确认', '是否取消当前面单？', function(btnId) {
            if (btnId === 'yes') {
                Web.data.JsonRPC.request({
                    method: 'shipment.waybill.cancel',
                    params: [shipment.get('shipperCode'), record.get('documentId')]
                }).then(function (success) {
                    if (success) {
                        record.drop();
                        Ecop.util.Util.showInfo('面单已取消。');
                    }
                });
            }
        });
    }
});