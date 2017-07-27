Ext.define('Ecop.view.shipment.ShipmentModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.shipment',

    formulas: {
        pickingListUrl: function (get) {
            return Ext.String.format('/shipment_doc/{0}.pdf?uid={1}&token={2}',
                get('shipment.shipmentId'),
                Ecop.auth.currentUser.partyId,
                Web.JsonRPCProxy.token
            );
        },

        isCourier: function (get) {
            return get('shipment.shipmentMethod') === 1;
        }
    }
});