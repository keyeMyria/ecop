/* global App */

/**
 * The FileUploader widget is a **controlled* form component that display an
 * array of files in the `value` prop plus files that are being uploaded.
 * Image files are represented as a thumb, and other files as an icon.
 * For files being uploaded, a progress indicator will be shown on top of the
 * thumb or icon.
 */
import SparkMD5 from 'spark-md5'
import update from 'immutability-helper'
import classNames from 'classnames'

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withStyles } from 'material-ui/styles'
import FormControl from 'material-ui/Form/FormControl'
import FormHelperText from 'material-ui/Form/FormHelperText'
import Button from 'material-ui/Button'
import { InputLabel } from 'material-ui/Input'
import AddIcon from 'material-ui-icons/Add'
import DeleteIcon from 'material-ui-icons/Delete'
import FileDownloadIcon from 'material-ui-icons/FileDownload'
import PreviewIcon from 'material-ui-icons/RemoveRedEye'

import {
  jsonrpc,
  arrayBufferToBase64,
  Gallery,
  compressImage
} from 'homemaster-jslib'

const styles = theme => ({
  actionBar: {
    'label + &': {
      marginTop: theme.spacing.unit * 2
    }
  },
  button: {
    margin: theme.spacing.unit
  },
  hidden: {
    display: 'none'
  },
  thumbsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  thumbRoot: {
    margin: '5px 0',
    flexBasis: '30%',
    cursor: 'pointer'
  },
  imageWrapper: {
    paddingBottom: '100%',
    position: 'relative'
  },
  thumbImage: {
    position: 'absolute',
    top: 0,
    width: '100%'
  },
  uploading: {
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    opacity: 0.5
  },
  selected: {
    border: '1px solid grey'
  },
  progress: {
    textAlign: 'center',
    width: '100%',
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)'
  }
})

/**
 * Displays a thumb for the file already uploaded or being uploaded. Prop
 * `file` is an objec with the format:
 *
 * {
 *   name: the name of the fileobject for existing files
 *   progress: upload progress percentage
 *   dataUrl: the dataurl of the preview image of the file being uploaded
 *     compressed to max 300x300
 * }
 */
const FileThumb = props => {
  const { file, selected, classes, ...other } = props
  const uploading = file.progress || file.dataUrl

  return (
    <div
      className={classNames(classes.thumbRoot, {
        [classes.selected]: selected
      })}
      {...other}
    >
      {uploading ? (
        <div
          className={[classes.uploading, classes.imageWrapper]}
          style={{
            backgroundImage: `url(${file.dataUrl})`
          }}
        >
          <div> {`${file.progress.toFixed(0)}%`} </div>
        </div>
      ) : (
        <div className={classes.imageWrapper}>
          <img
            alt=""
            className={classes.thumbImage}
            src={`${App.imageUrl}/${file.name}@!attachment_thumb`}
          />
        </div>
      )}
    </div>
  )
}

class FileUploader extends Component {
  state = {
    previewOpen: false,
    selected: null,
    /**
     * [{progress: 0.5, dataUrl: 'xxxx'}, ...]
     */
    uploding: []
  }

  handleUpload = e => {
    if (e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    var fileContent, files

    const uploadFile = content => {
      return compressImage(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.8
      })
        .then(
          image =>
            new Promise(resolve => {
              var reader = new FileReader()
              reader.onload = function() {
                resolve(reader.result)
              }
              reader.readAsDataURL(image)
            })
        )
        .then(dataUrl => {
          // dispatch(uploadOrderAttachment(index, dataUrl))
          return jsonrpc({
            method: 'fileobject.add',
            params: [arrayBufferToBase64(content)],
            on: {
              progress: function(e) {
                // note percent could be missing if file size
                // dispatch(updateAttachmentUploadProgress(index, e.percent || 0))
              }
            }
          })
        })
        .then(() => {
          console.log('File upload finished')
        })
    }

    compressImage(file, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.8
    })
      .then(
        image =>
          new Promise(function(resolve) {
            var reader = new FileReader()
            reader.onload = function() {
              fileContent = reader.result
              resolve(fileContent)
            }
            reader.readAsArrayBuffer(image)
          })
      )
      .then(content => {
        // check to see if the file with the md5 already exists
        const hash = new SparkMD5.ArrayBuffer()
        hash.append(content)
        return jsonrpc({
          method: 'fileobject.get.md5',
          params: [hash.end()]
        })
      })
      .then(fname => {
        if (fname) {
          // check to see if the file is already in the widget
          if (files && files.find(el => el.name === fname)) {
            throw new Error('File already exist')
          }
          return fname
        } else {
          return uploadFile(fileContent)
        }
      })
      .catch(e => console.log(e))
  }

  handleDownload = () => {}

  handleDelete = () => {
    const { value, onChange } = this.props
    const event = {
      target: {
        value: update(value, { $splice: [[this.state.selected, 1]] })
      }
    }
    this.setState({ selected: null })
    onChange(event)
  }

  handleSelect = idx => e => {
    if (idx === this.state.selected) {
      this.setState({ selected: null })
    } else if (idx < this.props.value.length) {
      this.setState({ selected: idx })
    }
    e.stopPropagation()
  }

  render() {
    const {
      classes,
      helperText,
      FormHelperTextProps,
      InputLabelProps,
      label,
      value,
      ...other
    } = this.props

    var files = value.map(f => ({ name: f }))

    return (
      <FormControl {...other}>
        {label && <InputLabel {...InputLabelProps}>{label}</InputLabel>}

        <div className={classes.actionBar}>
          <Button
            component="label"
            variant="fab"
            mini
            color="primary"
            htmlFor="file-upload"
            className={classes.button}
          >
            <AddIcon />
            <input
              accept="image/*"
              className={classes.hidden}
              id="file-upload"
              type="file"
              onChange={this.handleUpload}
            />
          </Button>
          <Button
            variant="fab"
            mini
            color="primary"
            disabled={this.state.selected === null}
            onClick={this.handleDelete}
            className={classes.button}
          >
            <DeleteIcon />
          </Button>
          <Button
            variant="fab"
            mini
            color="primary"
            disabled={this.state.selected === null}
            className={classes.button}
          >
            <FileDownloadIcon />
          </Button>
          <Button
            variant="fab"
            mini
            color="primary"
            disabled={!files.length}
            className={classes.button}
            onClick={() => this.setState({ previewOpen: true })}
          >
            <PreviewIcon />
          </Button>
        </div>

        {files && (
          <div
            className={classes.thumbsContainer}
            onClick={() => {
              this.setState({ selected: null })
            }}
          >
            {files.map((f, i) => (
              <FileThumb
                key={i}
                file={f}
                selected={i === this.state.selected}
                classes={classes}
                onClick={this.handleSelect(i)}
              />
            ))}
          </div>
        )}

        {helperText && (
          <FormHelperText {...FormHelperTextProps}>{helperText}</FormHelperText>
        )}
        <Gallery
          fullScreen
          open={this.state.previewOpen}
          images={files.map(a => ({
            url: `${App.imageUrl}/${a.name}`
          }))}
          initialImage={this.state.selected}
          onClose={() => {
            this.setState({ previewOpen: false })
          }}
        />
      </FormControl>
    )
  }
}

FileUploader.propTypes = {
  /**
   * If `true`, the input will indicate an error. This is normally obtained via context from
   * FormControl.
   */
  error: PropTypes.bool,
  /**
   * If `true`, the input will take up the full width of its container.
   */
  fullWidth: PropTypes.bool,
  /**
   * The helper text content.
   */
  helperText: PropTypes.node,
  /**
   * Properties applied to the `InputLabel` element.
   */
  InputLabelProps: PropTypes.object,
  /**
   * The label content.
   */
  label: PropTypes.string,
  /**
   * If `dense` or `normal`, will adjust vertical spacing of this and contained
   * components.
   */
  margin: PropTypes.oneOf(['none', 'dense', 'normal']),
  /**
   * Callback fired when the value is changed.
   *
   * @param {object} event The event source of the callback
   */
  onChange: PropTypes.func,
  /**
   * The files that the control represents, used for controlled mode.
   */
  value: PropTypes.arrayOf(PropTypes.string)
}

export default withStyles(styles)(FileUploader)
