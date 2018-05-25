import Validator from 'validatorjs'

const re_IKEAOrderIdPartial = /^(\d{0,9}|(S|$)(A|$)(M|$)(S|$)\d{0,8})$/i
const re_IKEAOrderId = /^(\d{9}|SAMS\d{8})$/

const re_ERPOrderIdPartial = /^[1-9]\d{0,7}$/i
const re_ERPOrderId = /^[1-9]\d{7}$/

export const isValidIKEAOrderId = (orderId, partial = false) =>
  partial ? re_IKEAOrderIdPartial.test(orderId) : re_IKEAOrderId.test(orderId)

export const isValidERPOrderId = (orderId, partial = false) =>
  partial ? re_ERPOrderIdPartial.test(orderId) : re_ERPOrderId.test(orderId)

Validator.register(
  'IKEAOrderId',
  value => isValidIKEAOrderId(value),
  '订单号为9位数字或SAMS加8位数字'
)
