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
import IconButton from 'material-ui/IconButton'
import { InputLabel } from 'material-ui/Input'
import AddIcon from '@material-ui/icons/Add'
import DeleteIcon from '@material-ui/icons/Delete'
import FileDownloadIcon from '@material-ui/icons/FileDownload'
import PreviewIcon from '@material-ui/icons/RemoveRedEye'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'

import {
  jsonrpc,
  arrayBufferToBase64,
  compressImage,
  downloadFile,
  uniqueId,
  message
} from 'homemaster-jslib'
import Gallery from 'homemaster-jslib/Gallery'

const styles = theme => ({
  actionBar: {
    display: 'flex',
    flexDirection: 'row',
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
  spacer: {
    flex: 1
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
 * `file` is either an object for existing file:
 * {
 *   name: the name of the fileobject for existing files
 * }
 *
 * or for an uploading file:
 * {
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
          <div className={classes.progress}>
            {`${file.progress.toFixed(0)}%`}
          </div>
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
  constructor(props) {
    super(props)

    this.state = {
      previewOpen: false,
      selected: null,
      expanded: props.initiallyExpanded,
      /**
       * [{progress: 0.5, dataUrl: 'xxxx'}, ...]
       */
      uploding: []
    }
    // generate unique id for input control widget
    this._id = `FileUploader-${uniqueId()}`
  }

  uploadFile = (file, content) => {
    this.setState({ expanded: true })

    return compressImage(file, {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.8
    })
      .then(
        thumb =>
          new Promise(resolve => {
            var reader = new FileReader()
            reader.onload = function() {
              resolve(reader.result)
            }
            reader.readAsDataURL(thumb)
          })
      )
      .then(thumbDataUrl => {
        // dispatch(uploadOrderAttachment(index, thumbDataUrl))
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
  }

  handleUpload = e => {
    var fileContent
    e.stopPropagation()

    if (e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    const compressOptions = Object.assign(
      {},
      FileUploader.defaultProps.imageCompressOptions,
      this.props.imageCompressOptions
    )

    var p = this.props.compressImage
      ? compressImage(file, compressOptions)
      : Promise.resolve(file)

    p
      .then(
        file =>
          new Promise(function(resolve) {
            var reader = new FileReader()
            reader.onload = function() {
              // keep the result in outer scope var fileContent
              fileContent = reader.result
              resolve(fileContent)
            }
            reader.readAsArrayBuffer(file)
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
        return fname || this.uploadFile(file, fileContent)
      })
      .then(fname => {
        // check to see if the file is already in the widget
        const { value: files } = this.props
        if (files && files.indexOf(fname) !== -1) {
          message.error('文件已存在')
        } else {
          const event = {
            target: {
              value: files
                ? update(files, {
                    $push: [fname]
                  })
                : [fname]
            }
          }
          this.props.onChange(event)
        }
      })
  }

  handleDownload = () => {
    const fileName = this.props.value[this.state.selected]
    downloadFile(`${App.imageUrl}/${fileName}`, fileName)
  }

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
    e.stopPropagation()
    if (idx === this.state.selected) {
      this.setState({ selected: null })
    } else if (idx < this.props.value.length) {
      this.setState({ selected: idx })
    }
  }

  render() {
    const {
      allowDelete,
      allowDownload,
      allowUpload,
      classes,
      compressImage: compressImageProp,
      FormHelperTextProps,
      helperText,
      imageCompressOptions,
      initiallyExpanded,
      InputLabelProps,
      label,
      maximalFiles,
      readOnly,
      value,
      ...other
    } = this.props

    const { selected, expanded } = this.state
    var files = value ? value.map(f => ({ name: f })) : []

    return (
      <FormControl {...other}>
        {label && <InputLabel {...InputLabelProps}>{label}</InputLabel>}

        <div className={classes.actionBar}>
          {allowUpload && (
            <Button
              component="label"
              variant="fab"
              mini
              color="primary"
              disabled={files.length === maximalFiles}
              htmlFor={this._id}
              className={classes.button}
            >
              <AddIcon />
              <input
                accept="image/*"
                className={classes.hidden}
                id={this._id}
                type="file"
                onChange={this.handleUpload}
              />
            </Button>
          )}

          {allowDelete && (
            <Button
              variant="fab"
              mini
              color="primary"
              className={classes.button}
              disabled={selected === null || !expanded}
              onClick={this.handleDelete}
            >
              <DeleteIcon />
            </Button>
          )}

          {allowDownload && (
            <Button
              variant="fab"
              mini
              color="primary"
              className={classes.button}
              disabled={selected === null || !expanded}
              onClick={this.handleDownload}
            >
              <FileDownloadIcon />
            </Button>
          )}

          <Button
            variant="fab"
            mini
            color="primary"
            className={classes.button}
            disabled={!files.length}
            onClick={() => this.setState({ previewOpen: true })}
          >
            <PreviewIcon />
          </Button>

          <div className={classes.spacer} />

          {files.length > 0 && (
            <IconButton onClick={() => this.setState({ expanded: !expanded })}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </div>

        {expanded &&
          files.length > 0 && (
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
                  selected={i === selected}
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
          initialImage={selected}
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
   * Wheter deleting selected file from the control is allowed
   */
  allowDelete: PropTypes.bool,
  /**
   * Whether downloading selected file is allowed
   */
  allowDownload: PropTypes.bool,
  /**
   * Whether uploading new file is allowed
   */
  allowUpload: PropTypes.bool,
  /**
   * If `true`, images will be compressed before uploaded.
   */
  compressImage: PropTypes.bool,
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
   * Configuration object to be passed to compressImage method
   */
  imageCompressOptions: PropTypes.object,
  /**
   * Whether the `FileUploader` should be initially displayed as expaned
   */
  initiallyExpanded: PropTypes.bool,
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
   * If defined, limits the files that can be uploaded
   */
  maximalFiles: PropTypes.number,
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

FileUploader.defaultProps = {
  allowDelete: true,
  allowDownload: true,
  allowUpload: true,
  compressImage: true,
  imageCompressOptions: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.8
  },
  initiallyExpanded: true
}

export default withStyles(styles)(FileUploader)
