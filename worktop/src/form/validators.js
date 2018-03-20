import Validator from 'validatorjs'
import { getRegionDepth } from 'homemaster-jslib/region'

Validator.register(
  'mobile',
  value => /^1\d{10}$/.test(value),
  '手机号码格式为1开头的11位数字'
)

Validator.register(
  'phone',
  value => /^0\d{2,3}-\d{5,8}(-\d+){0,1}$/.test(value),
  '电话号码格式为：区号(0开头)-直线号码-分机'
)

/**
 * validate the field value is the same as another, typically used for password
 * verification. Use as:
 *
 *   password: 'required|min:6|fieldmatch:confirmation'
 *
 * where the name of the other field, `confirmation` here, is given as an
 * requirement.
 */
Validator.register('fieldmatch', function(val, req) {
  const matchvalue = this.validator.input[req]
  return !matchvalue || matchvalue === val
})

/**
 * validate that one of the two fields is not null or undefined. E.g. when used
 * to ensure not both mobile and phone are undefined, one could use:
 *
 *   mobile: 'mobile|notbothempty:phone'
 */
Validator.register('notbothempty', function(val, req) {
  const other = this.validator.input[req]
  return (
    (val !== undefined && val !== null && val !== '') ||
    (other !== undefined && other !== null && other !== '')
  )
})

/**
 * validate that the region code is at least at the given level
 *
 *   regionCode: 'required|regionlevel:3'
 */
Validator.register('regionlevel', function(val, req) {
  return getRegionDepth(val) >= req
})
