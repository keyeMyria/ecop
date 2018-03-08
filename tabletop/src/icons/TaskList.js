import React from 'react'
import pure from 'recompose/pure'
import SvgIcon from 'material-ui/SvgIcon'

const SvgIconCustom = global.__MUI_SvgIcon__ || SvgIcon

let TaskList = props => (
  <SvgIconCustom {...props}>
    <path d="M3,5H9V11H3V5M5,7V9H7V7H5M11,7H21V9H11V7M11,15H21V17H11V15M5,20L1.5,16.5L2.91,15.09L5,17.17L9.59,12.59L11,14L5,20Z" />
  </SvgIconCustom>
)

TaskList = pure(TaskList)
TaskList.muiName = 'SvgIcon'

export default TaskList
