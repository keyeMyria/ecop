import { Component } from 'react'
import strategy from 'react-validatorjs-strategy'

/**
 * A componentent that handles common form validation based on
 * react-validatorjs-strategy. It also provides input maske and validation
 * for a mobile number field.
 *
 * It assumes the form field values are stored in the component state in the
 * following shape:
 *
 *   state = {
 *     values: {
 *       mobile: '',
 *       vericode: ''
 *     }
 *   }
 */
export default class ValidatedForm extends Component {
  activatedFields = []

  getValidatorData = () => this.state.values

  getFieldError = field => this.props.getValidationMessages(field)[0]

  clearField = field => () => {
    this.setState(
      {
        values: {
          ...this.state.values,
          [field]: ''
        }
      },
      this.props.handleValidation(field)
    )
  }

  handleChange = (field, type) => e => {
    var value

    switch (type) {
      case 'checkbox':
        value = e.target.checked
        break
      case 'datepicker':
        value = e
        break
      default:
        value = e.target.value
    }

    this.setState(
      {
        values: {
          ...this.state.values,
          [field]: value
        }
      },
      this.props.handleValidation(field)
    )
  }

  activateValidation = field => e => {
    // note that this won't work well for checkbox, which always have a value
    const { value } = e.target
    if (value && this.activatedFields.indexOf(field) === -1) {
      strategy.activateRule(this.validatorTypes, field)
      this.activatedFields.push(field)
      this.props.handleValidation(field)()
    }
  }
}
