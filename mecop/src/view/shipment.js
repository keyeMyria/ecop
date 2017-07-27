/*global wx, Ecop */
import React, {Component} from 'react'

import RaisedButton from 'material-ui/RaisedButton'
import AppBar from 'material-ui/AppBar'
import NumberPicker from 'react-widgets/lib/NumberPicker'

import jsonrpc from 'js-common/jsonrpc'
import {QrcodeScan} from 'js-common/svg-icons'

import 'react-widgets/lib/less/react-widgets.less'


export default class ShipmentPanel extends Component {
  initialState = {
    shipmentId: null,
    waybillCode: null,
    weight: null
  }

  constructor(props) {
    super(props)
    this.state = {...this.initialState}
  }

  onSubmit = () => jsonrpc({
    method: 'shipment.package.weight.set',
    params: [this.state.shipmentId, this.state.waybillCode, this.state.weight],
    success: ret => this.setState(this.initialState)
  })

  onScan = () => {
    var me = this;

    this.setState(this.initialState)

    if (Ecop.isWeixin) {
      wx.scanQRCode({
        needResult: 1,
        scanType: ['qrCode'],
        success: function (ret) {
          jsonrpc({
            method: 'shipment.waybill.scan',
            params: [ret.resultStr],
            success: ret => {
              me.setState(ret)
              me.refs.weightInput.focus()
            }
          })
        }
      })
    }
  }

  render = () => {
    return (
      <div>
        <AppBar title="面单录入" />

        <div style={{marginTop: '10px', textAlign: 'center'}}>
          <RaisedButton
            primary
            onTouchTap={this.onScan}
            label="扫描面单"
            icon={<QrcodeScan />}
          />
        </div>

        <div>
          <label>发货单号:</label>
          <span>{this.state.shipmentId}</span>
        </div>
        <div>
          <label>运单号:</label>
          <span>{this.state.waybillCode}</span>
        </div>

        <div>
          <label>重量:</label>
          <NumberPicker
            ref="weightInput"
            disabled={this.state.shipmentId === null}
            onChange={val => this.setState({weight: val})}
            step={0.1}
            value={this.state.weight}
            min={0}
            precision={1}
          />
        </div>

        <div style={{marginTop: '10px', textAlign: 'center'}}>
          <RaisedButton
            primary
            onTouchTap={this.onSubmit}
            label="提交重量"
            disabled={!(this.state.weight > 0)}
          />
        </div>
      </div>
    )
  }
}
