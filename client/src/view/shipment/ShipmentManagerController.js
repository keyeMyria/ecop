Ext.define('Ecop.view.shipment.ShipmentManagerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.shipment-manager',

    requires: [
        'Ecop.view.shipment.ShipmentPanel'
    ],

    onSearchShipment: function () {
        var me = this, view = me.getView(),
            daterange = view.down('daterange').getValue(),
            f = me.lookup('search-form');

        if (!f.isValid()) {
            return;
        }

        Web.data.JsonRPC.request({
            method: 'shipment.search',
            params: [{
                startDate: Ext.util.Format.date(daterange.start, 'Y-m-d'),
                endDate: Ext.util.Format.date(daterange.end, 'Y-m-d'),
                dateType: me.lookup('dateType').getValue().datetype,
                shipmentStatus: me.lookup('shipmentStatus').getValue(),
                shipmentId: me.lookup('shipmentId').getValue()
            }],
            success: function (shipments) {
                var grid = me.lookup('shipment-list');
                grid.store.loadData(shipments);
                if (grid.store.getCount() === 0) {
                    Ecop.util.Util.showInfo('该时间段内没有找到符合条件的发货单。');
                }
            }
        });
    },

    onOpenShipment: function (view, td, cellIndex, shipment) {
        var view = this.getView(), sid = shipment.getId(),
            tab = view.down('#shipment-' + sid);

        if (tab) {
            view.setActiveTab(tab);
        } else {
            var p = Ext.widget('shipmentpanel', {
                itemId: 'shipment-' + sid,
                viewModel: {
                    data: {
                        shipment: shipment
                    }
                }
            });
            view.add(p);
            view.setActiveTab(p);
        }
    }

});