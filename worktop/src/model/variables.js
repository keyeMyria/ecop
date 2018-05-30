/**
 * This a complete list of all process variables of the worktop process.
 *
 * The file serves only as documentation for the moment
 */

const variables = {
  actualMeasurementDate: {
    label: '实际测量日期',
    type: 'Date'
  },
  actualInstallationDate: {
    label: '实际安装日期',
    type: 'Date'
  },
  confirmedMeasurementDate: {
    label: '确认测量日期',
    type: 'Date'
  },
  customerMobile: {
    label: '顾客手机',
    type: 'String'
  },
  customerName: {
    label: '顾客名称',
    type: 'String'
  },
  customerRegionCode: {
    label: '所在地区',
    type: 'Integer'
  },
  customerStreet: {
    label: '详细地址',
    type: 'String'
  },
  externalOrderId: {
    label: '订单号',
    type: 'String'
  },
  assignedFactoryId: {
    label: '生产工厂',
    type: 'String'
  },
  factoryNumber: {
    label: '工厂编号',
    type: 'String'
  },
  installationFile: {
    label: '安装文件',
    type: 'Json'
  },
  isInstallationRequested: {
    label: '是否需安装',
    type: 'Boolean'
  },
  isMeasurementRequested: {
    label: '是否需测量',
    type: 'Boolean'
  },
  measurementFile: {
    label: '测量文件',
    type: 'Json'
  },
  orderFile: {
    label: '原始订单',
    type: 'Json'
  },
  orderId: {
    label: 'ERP订单号',
    type: 'Integer'
  },
  /**
   * [{itemId: 10023991, quantity: 2}, {itemId: 10024018, quantity: 3.2}]
   */
  orderItems: {
    label: '订单商品',
    type: 'Json'
  },
  productionDrawing: {
    label: '生产图纸',
    type: 'Json'
  },
  productionDrawingConfirmed: {
    label: '图纸审核通过',
    type: 'Boolean'
  },
  reasonDrawingRejected: {
    label: '图纸审核未通过原因',
    type: 'String'
  },
  receivingDate: {
    label: '发货日期',
    type: 'Date'
  },
  scheduledInstallationDate: {
    label: '预约安装日期',
    type: 'Date'
  },
  scheduledMeasurementDate: {
    label: '预约测量日期',
    type: 'Date'
  },
  shippingDate: {
    label: '发货日期',
    type: 'Date'
  },
  storeId: {
    label: '宜家商场号',
    type: 'String'
  }
}
