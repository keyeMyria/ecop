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
 *     errMsg: '',
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

  handleChange = e => {
    const { value, name: field } = e.target
    this.setState(
      { values: { ...this.state.values, [field]: value } },
      this.props.handleValidation(field)
    )
  }

  activateValidation = e => {
    const { value, name: field } = e.target
    if (value && this.activatedFields.indexOf(field) === -1) {
      strategy.activateRule(this.validatorTypes, field)
      this.activatedFields.push(field)
      this.props.handleValidation(field)()
    }
  }

  /*
   * A separate handleChange for mobile field to enable input mask
   */
  handleChangeMobile = e => {
    var { value } = e.target
    // allow only numbers and max 11
    if (/^1\d{0,10}$/.test(value)) {
      this.setState(
        { values: { ...this.state.values, mobile: value } },
        this.props.handleValidation('mobile')
      )
    }
  }
}
