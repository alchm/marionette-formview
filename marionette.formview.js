/**
 * Created by baptiste on 2014-10-22.
 */
/******************************
 * FormView
 * A Marionette.LayoutView that allows form data binding and custom validation by providing simple configuration
 */
Marionette.FormView = (function(Marionette, $, _) {

    return Marionette.LayoutView.extend({

        /**
         * The "form" attribute must be an object with an "id" attribute used to specify the form element, and a "submit"
         * attribute to declare the submit element on which trigger the form action
         * It also needs a "fields" object to set up the fields (see example)
         */
        ///////////////////////////////////////

        /**
         * constructor
         * The constructor first verify the form declaration, then configure events to be added
         */
        constructor: function() {
            this._verifyFormDeclaration();
            this._configureEvents();
            // Setting up the inheritance to allow overriding
            Marionette.LayoutView.apply(this, arguments);
        },

        /**
         * parseForm
         * @trigger form:parse  (fields, result, formView)
         * This is the entry-point of the form parsing
         */
        parseForm: function() {
            var fields = this.bindForm();
            var result = this.validateFields(fields);
            // The success callback is called with fields and this form view as arguments
            // if the result is valid
            result.isValid ?  this.form.success(fields, this)
                              : // Process the form errors if not
                              this._processFormErrors(result.errors, fields);
            // Trigger the form:parse event with the fields and this form view as arguments
            this.triggerMethod('form:parse', fields, result, this);
        },

        /**
         * bindForm
         * @trigger before:form:bind    (formView)
         * @trigger form:bind           (fields, formView)
         * @returns Object filled up with fields value and its DOM element
         * Fetches data from the form using the fields definition
         */
        bindForm: function() {
            this.triggerMethod('before:form:bind', this);
            var fieldsValues = {};
            for (var fieldName in this.form.fields) {
                var field = $(this.form.id + " " + this.form.fields[fieldName].id);
                fieldsValues[fieldName] = {
                    el:     field,
                    value:  this.getFieldValue(field)
                };
            }
            this.triggerMethod('form:bind', fieldsValues, this);
            return fieldsValues;
        },

        /**
         * getFieldValue
         * Returns the value for a given jQuery element (a field)
         * For a number input, the number is parsed, and NaN is returned for other values
         * @param $el
         */
        getFieldValue: function($el) {
            switch ($el.prop('type')) {
                case 'checkbox':
                case 'radio':
                    return $el.prop('checked');
                    break;
                case 'number':
                    return parseInt($el.prop('value'),10);
                    break;
                default:
                    return $el.prop('value');
                    break;
            }
        },

        /**
         * validateFields
         * @param   fields      Array of fieldName => value
         * @trigger field:valid (field, fieldName, formView)
         * Calls related validation function on each field value
         * Injects the depending fields value in the validation function
         * if a "depends" array is set in the field declaration
         */
        validateFields: function(fields) {
            var errors  = {},
                isValid = true;
            // Each form bound field
            for (var fieldName in fields) {
                var field       = fields[fieldName],
                    fieldSchema = this.form.fields[fieldName];

                // The field has a validation function
                if (_.isFunction(fieldSchema.validate)) {

                    // Define if this validation has some dependencies
                    var args = _.isArray(fieldSchema.depends) ?
                        // Get the values to inject as arguments to the validate function
                        this._getValidationInjectionValues(fieldSchema.depends, fields)
                        : []; // Or set an array
                    // Set the value of this field as first argument
                    args.unshift(field.value);
                    // Apply an array of arguments
                    var fieldIsValid = fieldSchema.validate.apply(this, args);
                    if (fieldIsValid) {
                        // Trigger the field:valid event
                        this.triggerMethod('field:valid', field, fieldName, this);
                    } else {
                        // Set isValid to false
                        isValid = false;
                        // Add the field to the errors object
                        errors[fieldName] = field;
                    }

                }

            }
            return isValid ?
                { isValid: isValid } : { isValid: isValid, errors: errors };
        },

        /**
         * _getValidationInjectionValues
         * @private
         * @param   fieldsName  Array
         * @param   fields      Object
         * @returns Array
         * Returns values from fields to inject in a validation function by fieldsName
         */
        _getValidationInjectionValues: function(fieldsName, fields) {
            var values = [];
            // Each fieldsName
            _.each(fieldsName, function(fieldName) {
                // Push the associated value
                values.push(fields[fieldName].value);
            });
            return values;
        },

        /**
         * _validateFormDeclaration
         * @private
         * Throws and error in case of missing needed element of the form structure declaration
         * Verify the "form" attribute is an object and has id and submit attributes
         * Also verify that fields attribute is available
         * // todo: make it works or throw it.
         */
        _verifyFormDeclaration: function() {
            /*console.log('this on _verifyFormDeclaration: ');
            console.log(this);
            if (_.isObject(this.form))          { throw new Error('Missing form declaration'); }
            if (_.has(this.form, 'id'))         { throw new Error('Missing form.id attribute'); }
            if (_.has(this.form, 'submit'))     { throw new Error('Missing form.id attribute'); }
            if (_.isObject(this.form.fields))   { throw new Error('Missing form.fields object'); }*/
        },

        /**
         * _configureEvents
         * @private
         * Configure events from the form configuration
         */
        _configureEvents: function() {
            // If the events property is not set, create it
            if (!_.isObject(this.events)) { this.events = {}; }
            // Set the click event on the form.submit selector
            // parseForm is the method to call
            var self = this;
            this.events['click ' + this.form.submit] = function(e) {
                e.preventDefault();
                self.parseForm();
            };
            // Set the enter key press event on each field
            for (var fieldName in this.form.fields) {
                // Get the field id
                var fieldId = this.form.fields[fieldName].id;
                this.events['keypress ' + fieldId] = function(e) {
                    if (e.keyCode === 13) { // The enter key code
                        self.parseForm();
                    }
                }
            }
        },

        /**
         * _processFormErrors
         * @private
         * @param errorFields   Object
         * @param fields        Object
         * @trigger             field:error (field, msg, fieldName, formView)
         */
        _processFormErrors: function(errorFields, fields) {
            var self = this;
            // Each errors
            for (var fieldName in errorFields) {
                // The current bound field
                var field   = fields[fieldName],
                // Get the message from the field declaration
                    msg     = this.form.fields[fieldName].message;
                // Call the specific error callback of the current field if it has one
                if (_.isFunction(field.error)) {
                    field.error(field, msg, fieldName, self);
                }
                // And trigger the error event for the current field
                self.triggerMethod('field:error', field, msg, fieldName, self);

            }
        }

    });

})
(Marionette, $, _);