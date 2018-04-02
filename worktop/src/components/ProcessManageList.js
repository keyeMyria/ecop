import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import compose from 'recompose/compose'

import { withStyles } from 'material-ui/styles'

import { searchProcess } from 'model/actions'

const styles = {
  root: {}
}

class ProcessManageList extends Component {
  componentDidMount = () => {
    this.refresh()
  }

  refresh = () => {
    this.props.dispatch(searchProcess())
  }

  render() {
    const { processes } = this.props
    console.log(this.props)

    return (
      <div>Hallo this is a list of {processes.length} items</div>
    )
  }
}

ProcessManageList.propTypes = {
  /**
   * A list of camunda `process` objects in prop `processes`
   */
  processes: PropTypes.arrayOf(PropTypes.object)
}

const mapStateToProps = state => ({
  processes: state.process.processList
})

export default compose(connect(mapStateToProps), withStyles(styles))(
  ProcessManageList
)
