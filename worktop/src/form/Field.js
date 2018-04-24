import { createElement } from 'react'
import PropTypes from 'prop-types'

const Field = props => {
  const { component, name, form, ...others } = props

  const defaultProps = {
    required: !others.disabled,
    fullWidth: true,
    margin: 'normal',
    InputLabelProps: {
      shrink: true
    }
  }

  if (form) {
    Object.assign(defaultProps, {
      value: form.state.values[name],
      onChange: form.handleChange(name),
      error: !!form.getFieldError(name),
      helperText: form.getFieldError(name)
    })
  }

  return createElement(component, { ...defaultProps, ...others })
}

Field.propTypes = {
  /**
   * The UI component used for this field
   */
  component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  /**
   * Name of the field is used to derive the default onChange, error and
   * helperText
   */
  name: PropTypes.string,
  /**
   * The ValidatedForm instance that contains this field
   */
  form: PropTypes.object
}

export default Field
