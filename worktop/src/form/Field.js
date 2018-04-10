import { createElement } from 'react'

export default function Field(props) {
  const { component, ...others } = props

  return createElement(
    component,
    Object.assign(
      {
        required: !others.disabled,
        fullWidth: true,
        margin: 'normal',
        InputLabelProps: {
          shrink: true
        }
      },
      others
    )
  )
}
