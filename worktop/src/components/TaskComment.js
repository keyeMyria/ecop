import React, { Component } from 'react'
import PropTypes from 'prop-types'
import dateFormat from 'date-fns/format'

import { withStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'

import { screen } from 'homemaster-jslib'
import MultilineText from 'homemaster-jslib/MultilineText'

const commentStyles = theme => ({
  wrapper: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit
  },
  paperWidthSm: {
    maxWidth: 700,
    width: 400
  },
  comments: {
    overflowY: 'auto'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-around'
  }
})

const commentStyle = {
  root: {
    padding: 10
  }
}

let CommentItem = props => {
  const { comment, classes } = props
  return (
    <div className={classes.root}>
      <Typography color="textSecondary">
        {dateFormat(comment.time, 'YYYY/MM/DD HH:mm:ss')}
      </Typography>
      <p>
        <MultilineText content={comment.message} />
      </p>
    </div>
  )
}

CommentItem = withStyles(commentStyle)(CommentItem)

class CommentDialog extends Component {
  state = {
    comment: ''
  }

  handleChange = e => {
    this.setState({ comment: e.target.value })
  }

  onSubmit = () => {
    let { comment } = this.state

    comment = comment.trim()
    if (!comment) {
      this.props.onCancel()
    } else {
      this.props.onSubmitComment(comment)
      this.setState({ comment: '' })
    }
  }

  render() {
    const { open, comments, onCancel, classes } = this.props

    return (
      <Dialog
        open={open}
        onClose={onCancel}
        classes={{ paperWidthSm: classes.paperWidthSm }}
        fullScreen={screen.isMobile()}
      >
        {comments.length > 0 && (
          <div className={classes.comments}>
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
        <div className={classes.wrapper}>
          <TextField
            required
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true
            }}
            label="新增备注"
            rows={3}
            multiline
            value={this.state.comment}
            onChange={this.handleChange}
          />

          <div className={classes.buttonRow}>
            <Button variant="raised" color="primary" onClick={this.onSubmit}>
              确定
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}

CommentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  /**
   * A list of existing comments for display
   */
  comments: PropTypes.arrayOf(PropTypes.object),
  /**
   * The function to invoke when new comment is submitted
   */
  onSubmitComment: PropTypes.func.isRequired,
  /**
   * The function to invoke to close the dialog without doing anyting
   */
  onCancel: PropTypes.func.isRequired
}

export default withStyles(commentStyles)(CommentDialog)
