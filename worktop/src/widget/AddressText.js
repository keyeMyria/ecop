import React, { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
import { getRegionName, loadRegion } from 'homemaster-jslib/region'

/**
 * For lazy rendering an address text with correct region name
 */
export default class AddressText extends Component {
  state = {
    regionName: ''
  }

  componentWillReceiveProps = nextProps => {
    if (this.props.regionCode !== nextProps.regionCode) {
      loadRegion(nextProps.regionCode).then(() => {
        this.setState({ regionName: getRegionName(nextProps.regionCode) })
      })
    }
  }

  render() {
    return (
      <Fragment>
        {this.state.regionName}
        {this.props.street}
      </Fragment>
    )
  }
}

AddressText.props = {
  regionCode: PropTypes.number,
  street: PropTypes.street
}
