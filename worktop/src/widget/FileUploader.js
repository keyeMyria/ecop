/* global App */
import styled from 'styled-components'
import SparkMD5 from 'spark-md5'

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { withStyles } from 'material-ui/styles'
import FormControl from 'material-ui/Form/FormControl'
import FormHelperText from 'material-ui/Form/FormHelperText'
import Button from 'material-ui/Button'
import { InputLabel } from 'material-ui/Input'
import AddIcon from 'material-ui-icons/Add'
import DeleteIcon from 'material-ui-icons/Delete'

import { jsonrpc, arrayBufferToBase64, compressImage } from 'homemaster-jslib'

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
    flexDdirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  }
})

const ThumbWrapper = styled.div`
  margin: 5px 0;
  flex-basis: 30%;
  cursor: zoom-in;

  > div {
    padding-bottom: 100%;
    position: relative;

    &.uploading {
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
      opacity: 0.5;
    }

    img {
      position: absolute;
      top: 0;
      width: 100%;
    }

    div {
      text-align: center;
      width: 100%;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`

/**
 * {
 *   name: the name of the fileobject to be uploaded
 *   dataUrl: the dataurl of the preview image of the file, compressed to max
 *            300x300
 * }
 */
const FileThumb = props => {
  const { file, ...other } = props
  const uploading = file.progress || file.dataUrl

  return (
    <ThumbWrapper {...other}>
      {uploading ? (
        <div
          className="uploading"
          style={{
            backgroundImage: `url(${file.dataUrl})`
          }}
        >
          <div> {`${file.progress.toFixed(0)}%`} </div>
        </div>
      ) : (
        <div>
          <img alt="" src={`${App.imageUrl}/${file.name}@!attachment_thumb`} />
        </div>
      )}
    </ThumbWrapper>
  )
}

class FileUploader extends Component {
  state = {
    selectedFile: null
  }

  handleImageUpload = e => {
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
          // check to see if the file is already in the control
          if (files && files.find(el => el.name === fname)) {
            throw new Error('File already exist')
          }
          return fname
        } else {
          return uploadFile(fileContent)
        }
      })
      .then(fname => {
        jsonrpc({
          method: 'order.attachment.add',
          success: () => {
            // dispatch(orderAttachmentAdded(index, fname))
          }
        })
      })
      .catch(e => console.log(e))
  }

  render() {
    var files

    const {
      classes,
      helperText,
      FormHelperTextProps,
      InputLabelProps,
      label,
      onChange,
      value,
      ...other
    } = this.props

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
              onChange={this.handleImageUpload}
            />
          </Button>
          <Button
            variant="fab"
            mini
            color="primary"
            disabled
            className={classes.button}
          >
            <DeleteIcon />
          </Button>
        </div>

        {files && (
          <div className={classes.thumbsContainer}>
            {files.map((f, i) => <FileThumb key={i} file={f} />)}
          </div>
        )}

        {helperText && (
          <FormHelperText {...FormHelperTextProps}>{helperText}</FormHelperText>
        )}
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
   * The value of the `Input` element, required for a controlled component.
   */
  value: PropTypes.arrayOf(PropTypes.string)
}

export default withStyles(styles)(FileUploader)
