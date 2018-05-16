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
  itemId: {
    flexBasis: 140
  },
  boldInput: theme.custom.orderId,
  itemText: {
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    flexGrow: 1
  },
  quantity: {
    flexBasis: 100
  }
})

class OrderItem extends Component {
  defaultState = {
    itemId: '',
    quantity: '',
    itemText: '',
    errmsg: ''
  }

  state = { ...this.defaultState }

  handleItemIdChange = e => {
    var { value } = e.target
    if (/^\d{0,8}$/.test(value) || !value) {
      this.setState(
        {
          ...this.defaultState,
          itemId: value
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
              itemText: `${item.itemName},${item.specification}`
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
    } else {
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
          className={classes.itemId}
          label="货号"
          required={false}
          value={this.state.itemId}
          InputProps={{ classes: { input: classes.boldInput } }}
          error={!!this.state.errmsg}
          helperText={this.state.errmsg}
          onChange={this.handleItemIdChange}
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
   * be called with {itemId, quantity} or null, depending on whether the value
   * is valid.
   */
  onChange: PropTypes.func.isRequired
}
export default withStyles(styles)(OrderItem)
