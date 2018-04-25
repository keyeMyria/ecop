/* global App */

export default function hasPermission(permission) {
  const { permission: userPermissions, group } = App.userInfo

  if (userPermissions === 'all' && group === undefined) return true
  if (permission === 'shipment.receive' && group === 'installer') return true
}
