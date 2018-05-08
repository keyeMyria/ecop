/* global App */

export function hasRole(role) {
  const { role: userRole } = App.userInfo

  if (typeof userRole === 'string') {
    return role === userRole
  } else {
    return userRole.indexOf(role) !== -1
  }
}

export function hasPermission(permission) {
  if (hasRole('admin')) return true

  switch (permission) {
    case 'task.view':
      return !hasRole('ikea_store') && !hasRole('ikea_icsc')
    case 'shipment.receive':
      return hasRole('installer')
    case 'shipment.send':
    case 'order.start':
      return hasRole('factory')
    default:
      return false
  }
}
