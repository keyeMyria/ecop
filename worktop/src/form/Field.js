import { createElement } from 'react'

export default function Field(props) {
  const { component, ...other } = props

  return createElement(
    component,
    Object.assign(
      {
        required: true,
        fullWidth: true,
        margin: 'normal',
        InputLabelProps: {
          shrink: true
        }
      },
      other
    )
  )
}
