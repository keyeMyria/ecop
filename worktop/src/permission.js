/* global App */

export default function hasPermission(permission) {
  const { permission: userPermissions, group } = App.userInfo
  return userPermissions === 'all' && group === undefined
}
