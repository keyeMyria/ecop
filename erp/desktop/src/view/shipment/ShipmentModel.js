Ext.define('Ecop.view.shipment.ShipmentModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.shipment',

  formulas: {
    pickingListUrl: function(get) {
      return Ext.String.format(
        '/shipment_doc/{0}.pdf?token={1}',
        get('shipment.shipmentId'),
        Ecop.csrfToken
      )
    },

    isCourier: function(get) {
      return get('shipment.shipmentMethod') === 1
    }
  }
})
