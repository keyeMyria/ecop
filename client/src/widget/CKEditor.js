Ext.define('Ecop.widget.CKEditor', {
    extend: 'Ext.form.field.TextArea',
    xtype: 'ckeditor',

    config: {
        /*
         * In order to keep the size of ckeditor in sync with the widget, we
         * have to use the component layout logic and not pure css. So set
         * this to false and add a listener to resize event.
         */
        liquidLayout: false
    },

    afterRender: function () {
        var me = this;
        me.callParent();
        me.editor = CKEDITOR.replace(me.inputEl.dom, {
            filebrowserUploadUrl: '/upload',
            language: 'zh-cn',
            extraAllowedContent: 'map[!name]; area[title,!href,shape,coords]; img[usemap]'
        });
        // the delay is necessary so that when the widget is first intialized
        // the ckeditor will have enough time to be full initialized so that
        // editor.resize method can be used
        me.on('resize', me.onTextElResize, me, {delay: 300});
    },

    getRawValue: function(){
        return this.editor ? this.editor.getData() : '';
    },

    setValue: function(value){
        this.editor.setData(value);
    },

    onTextElResize: function (me, width, height) {
        me.editor.resize(width-me.labelEl.getWidth(), height);
    },

    onDestroy: function () {
        this.editor.destroy();
        this.callParent();
    }
});