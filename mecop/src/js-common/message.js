import $ from 'jquery'
import React from 'react'
import {render} from 'react-dom'
import delay from 'lodash/delay'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import ActionInfo from 'material-ui/svg-icons/action/info'
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle'
import AlertWarning from 'material-ui/svg-icons/alert/warning'
import AlertError from 'material-ui/svg-icons/alert/error'
import {orange300, red700, green500, grey400} from 'material-ui/styles/colors'

import defaultTheme from 'js-common/mui-theme'


const iconStyles = {
  width: 48,
  height: 48
};


class MessageDialog extends React.Component {
    state = {
        open: false,
        icon: null,
        message: ''
    }

    handleClose = () => {
        // clear any pending close timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.setState({open: false})
        this.callback && this.callback();
    }

    show = (options) => {
        this.setState({
            open: true,
            icon: options.icon,
            message: options.message
        });

        if (options.autoHide) {
            this.timer = delay(this.handleClose, options.autoHide);
        };
        this.callback = options.callback;
    }

    success = (message, options) => {
        this.show(Object.assign(options || {}, {
            message: message,
            icon: <ActionCheckCircle color={green500} style={iconStyles} />
        }));
    }

    info = (message, options) => {
        this.show(Object.assign(options || {}, {
            message: message,
            icon: <ActionInfo color={grey400} style={iconStyles} />
        }));
    }

    error = (message, options) => {
        this.show(Object.assign(options || {}, {
            message: message,
            icon: <AlertError color={red700} style={iconStyles} />
        }));
    }

    warn = (message, options) => {
        this.show(Object.assign(options || {}, {
            message: message,
            icon: <AlertWarning color={orange300} style={iconStyles} />
        }));
    }

    render() {
        const actions = [
            <FlatButton
                label="确&nbsp;定"
                icon={<ActionCheckCircle />}
                primary
                onTouchTap={this.handleClose}
            />,
        ];

        return (
            <MuiThemeProvider muiTheme={defaultTheme}>
                <Dialog
                    actions={actions}
                    modal
                    open={this.state.open}
                    contentStyle={{maxWidth: 650}}
                >
                    <div style={{float: 'left'}}>{this.state.icon}</div>
                    <div style={{marginLeft: '70px'}}>{this.state.message}</div>
                </Dialog>
            </MuiThemeProvider>
        )
    }
}


/**
 *
 * The module exports a single object that will be lazily rendered a
 * MessageDialog component into the DOM upon first use.
 *
 *   import message from 'js-common/message'
 *   message.error('Something wrong', {autoHide: 2000})
 *
 */

var dialog;

function invoke(name, ...args) {
    if (!dialog) {
        dialog = render(<MessageDialog />, $('<div role="message"/>').appendTo($('body'))[0]);
    }
    dialog[name](...args);
}

export default ['show', 'success', 'info', 'error', 'warn'].reduce(
    (o, name) => {o[name] = invoke.bind(null, name); return o}, {}
);
