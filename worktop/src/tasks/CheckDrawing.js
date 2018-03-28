import React, { Fragment } from 'react'
import validation from 'react-validation-mixin'
import compose from 'recompose/compose'
import update from 'immutability-helper'

import { withStyles } from 'material-ui/styles'
import Radio, { RadioGroup } from 'material-ui/Radio'
import TextField from 'material-ui/TextField'
import { InputLabel } from 'material-ui/Input'
import { FormControl, FormControlLabel } from 'material-ui/Form'
import green from 'material-ui/colors/green'
import Typography from 'material-ui/Typography'

import { strategy, ValidatedForm, Field } from 'form'
import FileUploader from 'widget/FileUploader'

const styles = theme => ({
  radioGroup: {
    'label + &': {
      marginTop: theme.spacing.unit * 2
    },
    display: 'flex',
    flexDirection: 'row'
  },
  pass: {
    color: green[500]
  }
})

class MakeDrawing extends ValidatedForm {
  state = {
    values: {
      productionDrawingConfirmed: false
    }
  }

  validatorTypes = strategy.createSchema(
    {
      reasonDrawingRejected: [
        { required_if: ['productionDrawingConfirmed', false] }
      ]
    },
    { 'required_if.reasonDrawingRejected': '拒绝原因必须输入' }
  )

  submitForm = () => {
    this.props.validate(error => {
      if (!error) {
        let values = { ...this.state.values }
        if (values.reasonDrawingRejected === '') {
          delete values.reasonDrawingRejected
        }
        this.props.submitForm(values)
      }
    })
  }

  onRadioChange = (e, v) => {
    let values = update(this.state.values, {
      productionDrawingConfirmed: {
        $set: v === 'pass'
      }
    })
    if (v === 'pass') {
      values.reasonDrawingRejected = ''
    }
    this.setState(
      {
        values
      },
      this.props.handleValidation('reasonDrawingRejected')
    )
  }

  render = () => {
    const { values } = this.state
    const { classes, variables } = this.props

    return (
      <Fragment>
        <FileUploader
          label="订单文件"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.orderFile}
        />

        <FileUploader
          label="测量文件"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.measurementFile}
        />

        <FileUploader
          label="生产图纸"
          fullWidth
          margin="normal"
          allowUpload={false}
          allowDelete={false}
          InputLabelProps={{
            shrink: true
          }}
          value={variables.productionDrawing}
        />

        {variables.productionDrawingConfirmed === false && (
          <Typography variant="headline" color="error">
            前次审核未通过，拒绝原因:<br />
            {variables.reasonDrawingRejected}
          </Typography>
        )}

        <FormControl required>
          <InputLabel shrink>审核结果</InputLabel>
          <RadioGroup
            className={classes.radioGroup}
            value={values.productionDrawingConfirmed ? 'pass' : 'reject'}
            onChange={this.onRadioChange}
          >
            <FormControlLabel
              value="pass"
              control={
                <Radio
                  classes={{
                    checked: classes.pass
                  }}
                />
              }
              label="通过"
            />
            <FormControlLabel value="reject" control={<Radio />} label="拒绝" />
          </RadioGroup>
        </FormControl>

        <Field
          component={TextField}
          name="reasonDrawingRejected"
          label="拒绝原因"
          disabled={values.productionDrawingConfirmed}
          multiline
          value={values.reasonDrawingRejected}
          onChange={this.handleChange('reasonDrawingRejected')}
          error={!!this.getFieldError('reasonDrawingRejected')}
          helperText={this.getFieldError('reasonDrawingRejected')}
        />
      </Fragment>
    )
  }
}

export default compose(withStyles(styles), validation(strategy))(MakeDrawing)
