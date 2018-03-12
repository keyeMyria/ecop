import React from 'react'
import pure from 'recompose/pure'
import SvgIcon from 'material-ui/SvgIcon'

const SvgIconCustom = global.__MUI_SvgIcon__ || SvgIcon

let PaperPlane = props => (
  <SvgIconCustom {...props}>
    <path d="M23.625 0.147c0.281 0.201 0.415 0.522 0.362 0.857l-3.429 20.571c-0.040 0.254-0.201 0.469-0.429 0.603-0.121 0.067-0.268 0.107-0.415 0.107-0.107 0-0.214-0.027-0.321-0.067l-6.067-2.478-3.241 3.951c-0.161 0.201-0.402 0.308-0.656 0.308-0.094 0-0.201-0.013-0.295-0.054-0.335-0.121-0.563-0.442-0.563-0.804v-4.674l11.571-14.183-14.317 12.388-5.29-2.17c-0.308-0.121-0.509-0.402-0.536-0.737-0.013-0.321 0.147-0.629 0.429-0.79l22.286-12.857c0.134-0.080 0.281-0.121 0.429-0.121 0.174 0 0.348 0.054 0.482 0.147z" />
  </SvgIconCustom>
)

PaperPlane = pure(PaperPlane)
PaperPlane.muiName = 'SvgIcon'

export default PaperPlane
