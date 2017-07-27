Ext.define('Ecop.Application', {
    extend: 'Ext.app.Application',

    name: 'Ecop',

    requires: [
        'Ecop.view.login.Login',
        'Ecop.view.main.Main'
    ],

    launch: function () {
        Ext.widget('login-dialog');
    }

});
