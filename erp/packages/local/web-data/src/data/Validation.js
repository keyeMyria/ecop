/*
 * By default in ExtJS there is no way to define a validation that only applies
 * to a field when it is not empty. So e.g. it is difficult to allow an email
 * field to be empty while ensure proper format for any value entered.
 *
 * We override the validate function of Ext.data.field.Field so that for non
 * presence validations, we skip if the value is null or undefined.
 */

Ext.define('Web.data.Validation', {
    override: 'Ext.data.field.Field',

    validate: function(value, separator, errors, record) {
        var me = this,
            ret = '',
            result, validator, validators, length, i;

        if (!me._validators) {
            me.compileValidators();
        }

        validators = me._validators;

        for (i = 0, length = validators.length; i < length; ++i) {
            validator = validators[i];

            /*
             *@overricde
             * The following line is added to skip any validator except Presence
             * when the field value is empty
             */
            if (validator.type !== 'presence' &&
                (value === null || value === undefined)) {
                continue;
            }

            result = validator.validate(value, record);

            if (result !== true) {
                result = result || me.defaultInvalidMessage;
                if (errors) {
                    errors.add(me.name, result);
                    ret = ret || result;
                } else if (separator) {
                    if (ret) {
                        ret += separator;
                    }
                    ret += result;
                } else {
                    ret = result;
                    break;
                }
            }
        }

        return ret || true;
    }
});