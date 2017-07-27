Ext.define('Ecop.util.Util', {

    requires: [
        'Ext.window.Toast',
        'Ext.window.MessageBox'
    ],

    statics : {
        /*
         * a custom afterTpl for filebutton to accept only gif, jpg and png
         * images and in the future also accepts multiple file selections by
         * adding 'multiple' attribute
         */
        imageInputTpl: [
            '<input id="{id}-fileInputEl" data-ref="fileInputEl" class="{childElCls} {inputCls}" ',
                'type="file" accept="image/gif, image/jpeg, image/png" size="1" name="{inputName}" role="{role}" ',
                '<tpl if="tabIndex != null">tabindex="{tabIndex}"</tpl>',
            '>'
        ],

        isItemId: function (itemId) {
            return Ext.isNumber(itemId) && itemId > 10000000 && itemId < 99999999;
        },

        /*
         * Used for encoding the ArrayBuffer object returned by
         * FileReader.readAsArrayBuffer into base64 stirng up use in JsonRPC
         * requests.
         */
        arrayBufferToBase64: function (buf) {
            return btoa(
                Array.prototype.map.call(new Uint8Array(buf), function (c) {
                    return String.fromCharCode(c);
                }).join('')
            );
        },

        showError: function (text, callback, scope) {
            Ext.Msg.show({
                title:'错误',
                msg: text,
                icon: Ext.Msg.ERROR,
                buttons: Ext.Msg.OK,
                fn: callback,
                scope: scope
            });
        },

        showInfo: function (text, callback, scope) {
            Ext.Msg.show({
                title:'信息',
                msg: text,
                icon: Ext.Msg.INFO,
                buttons: Ext.Msg.OK,
                fn: callback,
                scope: scope
            });
        },

        showToast: function(text) {
            Ext.toast({
                html: text,
                closable: false,
                align: 't',
                slideInDuration: 400,
                minWidth: 400
            });
        }
    }
});