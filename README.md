marionette-formview
===================

A Marionette.LayoutView that allows form data binding and custom validation by providing simple configuration

# Usage

## Data binding

You can bind data from your fields by providing an `id` for each one.
Your form object also need an `id` to process form binding, and a `submit` (id selector too) to bind a click event on it.
The `success` callback is called at the end of the validations if all are passed, and has the list of the parsed `fields` with its value and jQuery element

### HTML :

```html
<script type="text/template", id="my-formview-template">
    <form id="my-form-id">
        <input type="email" id="my-form-email-field">
        <input type="password" id="my-form-password-field">
        <button id="my-form-submit-element">Send</button>
    </form>
</script>
```

### Javascript :

```javascript
var MyFormView = Marionette.FormView.extend({
    template: "#my-formview-template",
    form: {
        id: "#my-form-id",
        submit: "#my-form-submit-element",
        fields: {
            email: {
                id: "#my-form-email-field"
            },
            password: {
                id: "#my-form-password-field"
            }
        },
        success: function(fields, formView) {
            console.log(fields);
            /* {
                email: {
                    value: "a@b.c", // Input value
                    el: {}          // jQuery form element
                },
                password: {
                    // [...]
                }
            } */
            console.log(formView); // This view instance
        }
    }
});
```

## Data validation

You can specify a validation function on your email field (for example) by declaring a `validate` function

You can also add a `message` attribute to pass to your error callback

Using the previous HTML sample :
```javascript
var MyFormView = Marionette.FormView.extend({
    template: "#my-formview-template",
    form: {
        id: "#my-form-id",
        submit: "#my-form-submit-element",
        fields: {
            email: {
                id: "#my-form-email-field",
                validate: function(email) {
                    console.log(email); // "a@b.c"
                    return /(\w[-._\w]*\w@\w[-._\w]*\w\.\w{2,4})/.test(email);
                    // An email regex example, it returns false with "a@b.c"
                    // You have to return true if you want your validation to succeed
                },
                message: 'Please enter a valid email'
            },
            password: { // There is no validation on this field
                id: "#my-form-password-field"
            }
        },
        success: function(fields, formView) {
            console.log(fields);
            /* {
                email: {
                    value: "a@b.c", // Input value
                    el: {}          // jQuery form element
                },
                password: {
                    // [...]
                }
            } */
            console.log(formView); // This view instance
        }
    },
    /* The "field:error" event is triggered on each field that do not pass your validation */
    onFieldError: function(field, message, fieldName, formView) {
        console.log(field);     // Your email field object
        console.log(message);   // Your message
        console.log(fieldName); // "email"
        field.el.addClass('error'); // Adding an error style to your field
        field.el.parent().append('<strong>'+fieldName+' : '+message+'</strong>'); // Displaying your message under the form or wherever you want it
    },
});
```

## Fields validation dependency

It is possible that one of your fields depends on another one. For example, we want our password to be confirmed by re-typing it. The validation have to fail otherwise. You can easily add a `depends` attribute to you field, as an array of string, representing the fields that you want inject as argument to your validation function.
The validation function always have the value of its field as first argument, and the injected ones right after.

Using the previous HTML sample :
```javascript
var MyFormView = Marionette.FormView.extend({
    template: "#my-formview-template",
    form: {
        id: "#my-form-id",
        submit: "#my-form-submit-element",
        fields: {
            email: {
                id: "#my-form-email-field",
                validate: function(email) {
                    console.log(email); // "a@b.c"
                    return /(\w[-._\w]*\w@\w[-._\w]*\w\.\w{2,4})/.test(email);
                    // An email regex example, it returns false with "a@b.c"
                    // You have to return true if you want your validation to succeed
                },
                message: 'Please enter a valid email'
            },
            password: { // There is no validation on this field
                id: "#my-form-password-field"
            },
            passwordConfirmation: {
                id: "#my-form-password-confirmation-field",
                depends: ['password'],
                validate: function(passwordConfirmation, password) {
                    console.log(password); // The value of the `password` field
                    console.log(passwordConfirmation); // The value of this field is always the first argument
                    return passwordConfirmation === password;
                },
                message: "Passwords are not equals"
            }
        },
        success: function(fields, formView) {
            console.log(fields);
            /* {
                email: {
                    value: "a@b.c", // Input value
                    el: {}          // jQuery form element
                },
                password: {
                    // [...]
                }
            } */
            console.log(formView); // This view instance
        }
    },
    /* The "field:error" event is triggered on each field that do not pass your validation */
    onFieldError: function(field, message, fieldName, formView) {
        console.log(field);     // Your email field object
        console.log(message);   // Your message
        console.log(fieldName); // "email"
        field.el.addClass('error'); // Adding an error style to your field
        field.el.parent().append('<strong>'+fieldName+' : '+message+'</strong>'); // Displaying your message under the form or wherever you want it
    },
});
```

# License

This project is distributed under the MIT License
