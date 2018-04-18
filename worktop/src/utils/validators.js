import Validator from 'validatorjs'

const re_OrderIdPartial = /^(\d{0,9}|(S|$)(A|$)(M|$)(S|$)\d{0,8})$/i
const re_OrderId = /^(\d{9}|SAMS\d{8})$/

export const isValidOrderId = (orderId, partial = false) =>
  partial ? re_OrderIdPartial.test(orderId) : re_OrderId.test(orderId)

Validator.register(
  'IKEAOrderId',
  value => isValidOrderId(value),
  '订单号为9位数字或SAMS加8位数字'
)
