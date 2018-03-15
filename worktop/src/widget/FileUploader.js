/* global App */
import isEmpty from 'lodash/isEmpty'
import styled from 'styled-components'
import SparkMD5 from 'spark-md5'

import React, { Component } from 'react'

import { withStyles } from 'material-ui/styles'
import Toolbar from 'material-ui/Toolbar'
import Button from 'material-ui/Button'
import { InputLabel } from 'material-ui/Input'
import PhotoCameraIcon from 'material-ui-icons/PhotoCamera'

import { jsonrpc, arrayBufferToBase64, compressImage } from 'homemaster-jslib'

const styles = theme => ({
  toolbar: {
    paddingLeft: 0,
    paddingRight: 0
  },
  fileInput: {
    display: 'none'
  },
  button: {
    width: '100%',
    flex: 1,
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  }
})

const AttachmentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
`

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

/*
 * {
 *   name: the name of the fileobject to be uploaded
 *   dataUrl: the dataurl of the preview image of the file, compressed to max
 *            300x300
 * }
 */
const AttachmentThumb = props => {
  const { attachment, ...other } = props
  const uploading = attachment.progress || attachment.dataUrl

  return (
    <ThumbWrapper {...other}>
      {uploading ? (
        <div
          className="uploading"
          style={{
            backgroundImage: `url(${attachment.dataUrl})`
          }}
        >
          <div> {`${attachment.progress.toFixed(0)}%`} </div>
        </div>
      ) : (
        <div>
          <img
            alt=""
            src={`${App.imageUrl}/${attachment.name}@!attachment_thumb`}
          />
        </div>
      )}
    </ThumbWrapper>
  )
}

class FileUploader extends Component {
  state = {
    imageIdx: null
  }

  handleImageUpload = e => {
    if (e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    const { order, dispatch } = this.props
    const { attachments } = order.header
    const index = isEmpty(attachments) ? 0 : attachments.length
    var fileContent

    const uploadAttachment = content => {
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
          dispatch(uploadOrderAttachment(index, dataUrl))
          return jsonrpc({
            method: 'fileobject.add',
            params: [arrayBufferToBase64(content)],
            on: {
              progress: function(e) {
                // note percent could be missing if file size
                dispatch(updateAttachmentUploadProgress(index, e.percent || 0))
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
          // check to see if the image is already in attachments
          if (attachments && attachments.find(el => el.name === fname)) {
            throw new Error('File already in attachemnts')
          }
          return fname
        } else {
          return uploadAttachment(fileContent)
        }
      })
      .then(fname => {
        jsonrpc({
          method: 'order.attachment.add',
          params: [order.header.orderId, fname],
          success: () => {
            dispatch(orderAttachmentAdded(index, fname))
          }
        })
      })
      .catch(e => console.log(e))
  }

  render() {
    const { order, classes, history, location } = this.props
    // do not render till order is loaded
    if (!order) {
      return null
    }

    const ActionToolbar = (
      <Toolbar className={classes.toolbar}>
        <Button
          variant="raised"
          component="label"
          htmlFor="image-upload"
          color="primary"
          className={classes.button}
        >
          <PhotoCameraIcon />&nbsp;上传照片
          <input
            accept="image/*"
            className={classes.fileInput}
            id="image-upload"
            type="file"
            onChange={this.handleImageUpload}
          />
        </Button>
      </Toolbar>
    )

    return (
      <div className={classes.root}>
        {attachments && (
          <div style={{ padding: '0 0.5em', margin: '0.5em 0' }}>
            <InputLabel shrink={true} style={{ display: 'block' }}>
              相关照片
            </InputLabel>
            <AttachmentWrapper>
              {attachments.map((a, i) => (
                <AttachmentThumb
                  key={i}
                  attachment={a}
                  onClick={() => {
                    history.push(location.pathname, 'showImages')
                    this.setState({ imageOpen: true, imageIdx: i })
                  }}
                />
              ))}
            </AttachmentWrapper>
          </div>
        )}
      </div>
    )
  }
}

export default withStyles(styles)(FileUploader)
