import dateFormat from 'date-fns/format'

export default (date, format) => (date ? dateFormat(date, format) : '')
