/**
 * An enhanced TextField with a clear icon to clear the field. Used primary in
 * entering searching conditions.
 *
 * The code is almost entirely copied from original mui TextField. The only
 * added prop is the 'onClear' handler when the clear icon is clicked.
 *
 * TODO: this component is not used now due to :
 *
 *  1. its UI is not compatible with IE 11
 *  2. the clearable properby on Field conflicts with DatePicker.clearable and
 *     we do not know how to detect component type if Field
 */

import React from 'react'
import warning from 'warning'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import InputAdornment from '@material-ui/core/InputAdornment'
import Select from '@material-ui/core/Select/Select'
import IconButton from '@material-ui/core/IconButton'
import CancelIcon from '@material-ui/icons/Cancel'

const styles = {
  cancelIcon: {
    width: 36,
    height: 36
  }
}

function InputField(props) {
  const {
    autoComplete,
    autoFocus,
    children,
    className,
    classes,
    defaultValue,
    disabled,
    error,
    FormHelperTextProps,
    fullWidth,
    helperText,
    id,
    InputLabelProps,
    inputProps,
    InputProps,
    inputRef,
    label,
    multiline,
    name,
    onBlur,
    onChange,
    onClear,
    onFocus,
    placeholder,
    required,
    rows,
    rowsMax,
    select,
    SelectProps,
    type,
    value,
    ...other
  } = props

  warning(
    !select || Boolean(children),
    'Material-UI: `children` must be passed when using the `TextField` component with `select`.'
  )

  const helperTextId = helperText && id ? `${id}-helper-text` : undefined
  const InputElement = (
    <Input
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      defaultValue={defaultValue}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      name={name}
      rows={rows}
      rowsMax={rowsMax}
      type={type}
      value={value}
      id={id}
      inputRef={inputRef}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      inputProps={inputProps}
      endAdornment={
        <InputAdornment position="end">
          <IconButton classes={{ root: classes.cancelIcon }}>
            <CancelIcon onClick={onClear} />
          </IconButton>
        </InputAdornment>
      }
      {...InputProps}
    />
  )

  return (
    <FormControl
      aria-describedby={helperTextId}
      className={className}
      error={error}
      fullWidth={fullWidth}
      required={required}
      {...other}
    >
      {label && (
        <InputLabel htmlFor={id} {...InputLabelProps}>
          {label}
        </InputLabel>
      )}
      {select ? (
        <Select value={value} input={InputElement} {...SelectProps}>
          {children}
        </Select>
      ) : (
        InputElement
      )}
      {helperText && (
        <FormHelperText id={helperTextId} {...FormHelperTextProps}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}

InputField.propTypes = {
  /**
   * This property helps users to fill forms faster, especially on mobile devices.
   * The name can be confusing, as it's more like an autofill.
   * You can learn more about it here:
   * https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
   */
  autoComplete: PropTypes.string,
  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The default value of the `Input` element.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * If `true`, the input will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the label will be displayed in an error state.
   */
  error: PropTypes.bool,
  /**
   * Properties applied to the `FormHelperText` element.
   */
  FormHelperTextProps: PropTypes.object,
  /**
   * If `true`, the input will take up the full width of its container.
   */
  fullWidth: PropTypes.bool,
  /**
   * The helper text content.
   */
  helperText: PropTypes.node,
  /**
   * The id of the `input` element.
   * Use that property to make `label` and `helperText` accessible for screen readers.
   */
  id: PropTypes.string,
  /**
   * Properties applied to the `InputLabel` element.
   */
  InputLabelProps: PropTypes.object,
  /**
   * Properties applied to the `Input` element.
   */
  InputProps: PropTypes.object,
  /**
   * Properties applied to the native `input` element.
   */
  inputProps: PropTypes.object,
  /**
   * Use that property to pass a ref callback to the native input component.
   */
  inputRef: PropTypes.func,
  /**
   * The label content.
   */
  label: PropTypes.node,
  /**
   * If `dense` or `normal`, will adjust vertical spacing of this and contained components.
   */
  margin: PropTypes.oneOf(['none', 'dense', 'normal']),
  /**
   * If `true`, a textarea element will be rendered instead of an input.
   */
  multiline: PropTypes.bool,
  /**
   * Name attribute of the `input` element.
   */
  name: PropTypes.string,
  /**
   * @ignore
   */
  onBlur: PropTypes.func,
  /**
   * Callback fired when the value is changed.
   *
   * @param {object} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value`.
   */
  onChange: PropTypes.func,
  /**
   * @ignore
   */
  onFocus: PropTypes.func,
  /**
   * The short hint displayed in the input before the user enters a value.
   */
  placeholder: PropTypes.string,
  /**
   * If `true`, the label is displayed as required.
   */
  required: PropTypes.bool,
  /**
   * Number of rows to display when multiline option is set to true.
   */
  rows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * Maximum number of rows to display when multiline option is set to true.
   */
  rowsMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * Render a `Select` element while passing the `Input` element to `Select` as `input` parameter.
   * If this option is set you must pass the options of the select as children.
   */
  select: PropTypes.bool,
  /**
   * Properties applied to the `Select` element.
   */
  SelectProps: PropTypes.object,
  /**
   * Type attribute of the `Input` element. It should be a valid HTML5 input type.
   */
  type: PropTypes.string,
  /**
   * The value of the `Input` element, required for a controlled component.
   */
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ])
}

InputField.defaultProps = {
  required: false,
  select: false
}

export default withStyles(styles)(InputField)
