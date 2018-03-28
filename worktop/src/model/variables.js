/**
 * This a complete list of all process variables of the worktop process.
 */

const variables = {
  externalOrderId: {
    label: '订单号',
    type: 'String'
  },
  confirmedInstallationDate: {
    label: '确认安装日期',
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
    label: '顾客姓名',
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
  installFaucet: {
    label: '是否需要安装龙头',
    type: 'Boolean'
  },
  installSink: {
    label: '是否需要安装水槽',
    type: 'Boolean'
  },
  orderFile: {
    label: '原始订单',
    type: 'Json'
  },
  scheduledInstallationDate: {
    label: '预约安装日期',
    type: 'Date'
  },
  scheduledMeasurementDate: {
    label: '预约测量日期',
    type: 'Date'
  },
  storeId: {
    label: '宜家商场号',
    type: 'String'
  }
}

export default variables
