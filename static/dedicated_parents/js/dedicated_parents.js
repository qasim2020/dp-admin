let myFuncs = {

    validateEmail: function(mail) {
        console.log({mail});
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,3})+$/.test(mail)) {
           return true;
        }
        return false;
    }, 

    verifyEmail: function(e) {

        // validate form
        // send verify email
        // after verification - send a welcome email

        let test = true;

        $(e.target).closest("form").find(".error").remove();

        if (!(myFuncs.validateEmail( $("#email").val() ) ) ) {
            return $(e.target).html("Invalid Email");
        };

        $(e.target).closest("form").find("input").each( (key, val) => {
            let check = $(val).val();
            if (check.length == 0) {
                test = false;
            }
        });

        if (!(test)) {
            $(e.target).html("Missing fields!");
            return;
        }

        $(e.target).html("Sending...");

        let data = {
            firstName: $("#name").val(), 
            lastName: $("#last-name").val(), 
            email: $("#email").val()
        };

        $.ajax({
            url: `/dedicated_parents/gen/data/subscribeCustomer/n`, 
            data: data, 
            method: "POST", 
            success: val => $(e.target).html("Check your inbox!")
        }).fail( err => {
            $(e.target).html("Error!");
            $(e.target).closest("fieldset").append(`<p class="error">${err.responseText}</p>`);
        });

    }, 

};

// events
$("form").on("submit", e => e.preventDefault() );
$("#send-button").on("click", myFuncs.verifyEmail );
