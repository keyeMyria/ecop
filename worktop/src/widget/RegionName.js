import React, { Fragment, Component } from 'react'
import PropTypes from 'prop-types'
import { getRegionName, loadRegion } from 'homemaster-jslib/region'

/**
 * For lazy rendering an address text with correct region name
 */
export default class RegionName extends Component {
  constructor(props) {
    super(props)

    this.state = {
      regionName: ''
    }

    props.regionCode &&
      loadRegion(props.regionCode).then(() => {
        this.setState({ regionName: getRegionName(props.regionCode) })
      })
  }

  componentWillReceiveProps = nextProps => {
    if (this.props.regionCode !== nextProps.regionCode) {
      loadRegion(nextProps.regionCode).then(() => {
        this.setState({ regionName: getRegionName(nextProps.regionCode) })
      })
    }
  }

  render() {
    return <Fragment>{this.state.regionName}</Fragment>
  }
}

RegionName.props = {
  regionCode: PropTypes.number.isRequired
}
