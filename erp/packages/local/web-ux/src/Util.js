/*
 * we can not override Ext.String since the production build code can not find
 * Ext.String
 */
Ext.define('Web.ux.Util', {}, function () {
    Ext.apply(Ext.String, {
        /*
         * The function converts the full-width Chinese number and symbols to their
         * half-width ASCII equivalent.
         */
        fullToHalf: function (str) {
            var result = "", code;
            for (var i = 0; i < str.length; i++) {
                code = str.charCodeAt(i);
                if (code >= 65281 && code <= 65373) {
                    result += String.fromCharCode(code - 65248);
                } else if (code === 12288) { // space character
                    result += ' ';
                } else {
                    result += str.charAt(i);
                }
            }
            return result;
        },

        gbkLength: function (str) {
            var realLength = 0, len = str.length, charCode;
            for(var i = 0; i < len; i++){
                charCode = str.charCodeAt(i);
                if (charCode >= 0 && charCode <= 128) {
                    realLength += 1;
                } else {
                    // 如果是中文则长度加2
                    realLength += 2;
                }
            }
            return realLength;
        }
    });
});
