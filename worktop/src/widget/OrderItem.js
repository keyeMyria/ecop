import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import { jsonrpc } from 'homemaster-jslib'

const re_quantity = /^\d{1,2}(\.\d{0,2})?$/

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  model: {
    flexBasis: 140
  },
  boldInput: theme.custom.orderId,
  itemText: {
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    flexGrow: 1
  },
  quantity: {
    flexBasis: 90
  },
  quantityInput: {
    width: '100%'
  }
})

class OrderItem extends Component {
  defaultState = {
    itemId: null,
    model: '',
    quantity: '',
    itemText: '',
    errmsg: ''
  }

  state = { ...this.defaultState }

  setValue = value => {
    if (value === null) {
      // the controll is being edited
      return
    } else if (value === undefined) {
      // the control shall be cleared
      this.setState({ ...this.defaultState })
    } else if (this.state.itemId !== value.itemId) {
      jsonrpc({
        method: 'item.get',
        params: [value.itemId]
      }).then(item => {
        item &&
          this.setState({
            itemText: `${item.itemName},${item.specification}`,
            itemId: item.itemId,
            model: item.model,
            quantity: value.quantity
          })
      })
    } else {
      this.setState({ quantity: value.quantity })
    }
  }

  componentWillReceiveProps = nextProps => {
    if (!isEqual(this.props.value, nextProps.value)) {
      this.prevValue = nextProps.value
      this.setValue(nextProps.value)
    }
  }

  handleModelChange = e => {
    var { value } = e.target
    if (/^\d{0,8}$/.test(value) || !value) {
      this.setState(
        {
          itemId: null,
          model: value,
          itemText: '',
          errmsg: ''
        },
        this.handleChange
      )
    }
    if (value.length === 8) {
      jsonrpc({
        method: 'item.search',
        params: {
          text: value,
          brandId: 17,
          catId: '208'
        }
      }).then(ret => {
        if (isEmpty(ret)) {
          this.setState({
            errmsg: '未找到该宜家商品号!'
          })
        } else if (ret.length === 1) {
          const item = ret[0]
          this.setState(
            {
              itemText: `${item.itemName},${item.specification}`,
              itemId: item.itemId
            },
            this.handleChange
          )
          this.quantityInput.focus()
        }
      })
    }
  }

  handleQuantityChange = e => {
    const value = e.target.value.trim()

    if (re_quantity.test(value) || !value) {
      this.setState({ quantity: value }, this.handleChange)
    }
  }

  /**
   * Fire the onChange function if value is changed
   */
  handleChange = () => {
    const quantity = parseFloat(this.state.quantity)
    var currentValue
    // the combination is valid
    if (this.state.itemText && quantity > 0) {
      currentValue = {
        itemId: this.state.itemId,
        quantity
      }
    } else if (!this.state.model && !this.state.quantity) {
      // empty
      currentValue = undefined
    } else {
      // invalid value
      currentValue = null
    }
    // the value has changed
    if (!isEqual(currentValue, this.prevValue)) {
      this.prevValue = currentValue
      this.props.onChange(currentValue)
    }
  }

  render = () => {
    const { classes } = this.props
    return (
      <div className={classes.root}>
        <TextField
          className={classes.model}
          label="货号"
          required={false}
          value={this.state.model}
          InputProps={{ classes: { input: classes.boldInput } }}
          error={!!this.state.errmsg}
          helperText={this.state.errmsg}
          onChange={this.handleModelChange}
        />

        <Typography variant="title" className={classes.itemText}>
          {this.state.itemText}
        </Typography>

        <FormControl
          className={classes.quantity}
          disabled={!this.state.itemText}
        >
          <InputLabel>数量</InputLabel>
          <Input
            value={this.state.quantity}
            className={classes.boldInput}
            classes={{ input: classes.quantityInput }}
            onChange={this.handleQuantityChange}
            endAdornment={<InputAdornment position="end">米</InputAdornment>}
            inputRef={input => {
              this.quantityInput = input
            }}
          />
        </FormControl>
      </div>
    )
  }
}

OrderItem.propTypes = {
  classes: PropTypes.object,
  /**
   * The function to invoke when order item data is changed. The funciton will
   * be called with {itemId, quantity}, null or undefined, depending on whether
   * the value is valid, not completely valid or empty.
   * Note the itemId is the ERP itemId, not supplier item model.
   */
  onChange: PropTypes.func.isRequired,
  /**
   * To make the component a controlled one, pass `value` attribute in the
   * shape of {itemId:xxx, quantity:xxx}
   */
  value: PropTypes.object
}
export default withStyles(styles)(OrderItem)
