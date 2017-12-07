Ext.define('Web.ux.form.VeriCodeField', {
    extend: 'Ext.form.field.Text',
    alias: 'widget.vericodefield',
    requires: [
        'Ext.form.trigger.Component'
    ],

    triggers: {
        button: {
            type: 'component',
            hideOnReadOnly: false
        }
    },

    cls: 'ux-vericode',

    /*
     * We only allow numbers in the control
     */
    maskRe: /\d/,
    enforceMaxLength: true,
    maxLength: 6,
    emptyText: '请输入短信验证码',

    /*
     *@cfg {Number} delay
     * Number of seconds to delay till user can press the send button again
     */
    delay: 60,

    /**
     * @cfg {String} buttonText
     * The button text to display on the upload button. Note that if you supply a value for
     * {@link #buttonConfig}, the buttonConfig.text value will be used instead if available.
     */
    buttonText: '发送验证码',

    /*
     *@cfg {Boolean}
     * Whether he send button is initially active.
     */
    buttonDisabled: false,

    /**
     * @cfg {Number} buttonMargin
     * The number of pixels of space reserved between the button and the text field.
     */
    buttonMargin: 5,

    /**
     * @property {Ext.button.Button} button
     * A reference to the trigger Button component created for this upload field. Only populated after this component is
     * rendered.
     */

    // private
    timer: null,
    extraFieldBodyCls: Ext.baseCSSPrefix + 'form-vericode-wrap',
    inputCls: Ext.baseCSSPrefix + 'form-text-vericode',
    remaining: 0,

    // @private
    applyTriggers: function(triggers) {
        var me = this,
            triggerCfg = (triggers || {}).button;

        if (triggerCfg) {
            triggerCfg.component = Ext.apply({
                xtype: 'button',
                ownerCt: me,
                id: me.id + '-button',
                ui: me.ui,
                disabled: me.disabled || me.buttonDisabled,
                text: me.buttonText,
                style: 'margin-left:' + me.buttonMargin + 'px',
                inputName: me.getName(),
                listeners: {
                    scope: me,
                    click: me.onBtnClick
                }
            }, me.buttonConfig);

            return me.callParent([triggers]);
        }
    },

    // @private
    onRender: function() {
        var me = this,
            button, buttonEl, trigger;

        me.callParent(arguments);

        trigger = me.getTrigger('button');
        button = me.button = trigger.component;
        buttonEl = button.el;

        // Ensure the trigger element is sized correctly upon render
        trigger.el.setWidth(buttonEl.getWidth() + buttonEl.getMargin('lr'));
        if (Ext.isIE) {
            me.button.getEl().repaint();
        }
    },

    /**
     * Overridden to do nothing
     * @method
     */
    setValue: Ext.emptyFn,

    reset : function(){
        var me = this;
        if (me.timer) {
            clearInterval(me.timer);
        }
        if (me.rendered) {
            me.button.setText('发送验证码');
            me.inputEl.dom.value = '';
        }
        me.callParent();
    },

    onBtnClick: function () {
        var me = this;
        if (!me.fireEvent('beforesend')) {
            return
        }
        me.remaining = 60;
        me.button.disable();
        me.inputEl.dom.value = '';
        me.timer = setInterval(function () {
            if (me.remaining-- > 0) {
                me.button.setText(me.remaining + '秒后重发');
            } else {
                clearInterval(me.timer);
                me.timer = null;
                me.button.setText('发送验证码');
                me.button.enable();
            }
        }, 1000);
        me.fireEvent('send');
    },

    onShow: function(){
        this.callParent();
        // If we started out hidden, the button may have a messed up layout
        // since we don't act like a container
        this.button.updateLayout();
    },

    enableButton: function (enabled) {
        var me = this;
        if (enabled) {
            me.button.enable();
        } else {
            me.button.disable();
        }
    },

    onDisable: function(){
        var me = this;
        me.callParent();
        me.button.disable();
        if (me.timer) {
            clearInterval(me.timer);
        }
    },

    onEnable: function(){
        this.callParent();
        this.button.enable();
    },

    onDestroy: function(){
        this.button = null;
        this.callParent();
    },

    privates: {
        getFocusEl: function() {
            return this.inputEl;
        }
    }
});
