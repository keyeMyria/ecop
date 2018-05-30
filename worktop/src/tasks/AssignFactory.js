import React, { Component, Fragment } from 'react'

import TextField from '@material-ui/core/TextField'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'

import { Field } from 'form'
import dateFormat from 'utils/date-fns'
import FileUploader from 'widget/FileUploader'

export default class AssignFactory extends Component {
  state = { values: {} }

  submitForm = () => {
    this.props.submitForm(this.state.values)
  }

  handleChange = e => {
    this.setState({ values: { assignedFactoryId: Number(e.target.value) } })
  }

  render = () => {
    const { values } = this.state
    const { variables } = this.props
    const taskName = variables.isInstallationRequested ? '安装' : '送货'

    return (
      <Fragment>
        {variables.scheduledInstallationDate && (
          <Field
            label={`预约${taskName}日期`}
            component={TextField}
            disabled
            value={dateFormat(
              variables.scheduledInstallationDate,
              'YYYY/MM/DD'
            )}
          />
        )}

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

        <FormControl component="fieldset" required fullWidth>
          <FormLabel component="legend">生产厂</FormLabel>
          <RadioGroup
            name="factory"
            row
            value={(
              values.assignedFactoryId || variables.assignedFactoryId
            ).toString()}
            onChange={this.handleChange}
          >
            <FormControlLabel
              value="10025173"
              control={<Radio color="primary" />}
              label="倍宜"
            />
            <FormControlLabel
              value="10025188"
              control={<Radio color="primary" />}
              label="上海工作站"
            />
          </RadioGroup>
        </FormControl>
      </Fragment>
    )
  }
}
