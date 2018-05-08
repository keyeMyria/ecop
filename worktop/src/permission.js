/* global App */

export function hasPermission(permission) {
  const { role } = App.userInfo

  if (role === 'admin') return true

  switch (permission) {
    case 'shipment.receive':
      return role === 'installer'
    case 'order.start':
      return role === 'factory'
    default:
      return false
  }
}

export function hasRole(role) {
  return role === App.userInfo.role
}
