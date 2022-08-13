let startShowOrder = function(id) {

    $(".open.quick.active").find(".fa-check").removeClass("d-none");

    $.ajax({
        url: `/${urlParams().brand}/gen/data/showReceipt/${ id }`,
        method: "GET",
        success: val => {
            console.log(val);
            localStorage.setItem("val", JSON.stringify(val) );
        },
    }).fail( err => console.log(err) );

};

let urlParams = function() {

    let url = {
        origin: window.location.origin, 
        brand: window.location.pathname.split("/")[1],
        permit: window.location.pathname.split("/")[2],
        requiredType: window.location.pathname.split("/")[3],
        module: window.location.pathname.split("/")[4],
        input: window.location.pathname.split("/")[5],
    };

    return url;

};

let socket = io();

socket.on(`${urlParams().brand}newOrder`, (noti) => {
    console.log(noti);
});

startShowOrder(urlParams().input);

let getFormattedDate = function() {
    let date = new Date();
    let dtg = date.toString().split(" ");
    let obj = {
        time: dtg[4],
        date: dtg[2],
        month: dtg[1],
        yr: dtg[3]
    }
    let time = obj.time.split(":");
    obj.time = time[0]+time[1]+ " hrs";
    return `${obj.time} · ${obj.date} ${obj.month} ${obj.yr}`;
};


let sendReceiptToEmail = function(type, elem) {

    let updateInStage = function(result) {

        let msg = {};

        if (type == "customer") {

            msg.hdg = "Sent Receipt to Customer's Email";
            msg.text = `Email sent by Customer`;

        } else if ( type == "shop" ) {

            msg.hdg = "Sent Receipt to Shop's Email";
            msg.text = `<p><small>Email was sent by Customer</small></p>`;
        }

        let data = {
            _id: val.order._id, 
            key : "stages",
            item : {
                id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                time: getFormattedDate(),
                hdg: msg.hdg,
                msg: msg.text,
                type: "email"
            }
        };

        $.ajax({
            url: `/${urlParams().brand}/gen/data/saveItemInArray/${urlParams().brand}-orders`,
            data: data,
            method: "POST",
            success: val => {
                console.log(val);
                $(elem).find(".fa").addClass("d-none");
                $(elem).find(".fa-check").removeClass("d-none");
                $(elem).append("<p class='success'>Note Sent Successfully</p>");
            }
        }).fail( err => {
            console.log(err);
            $(elem).find(".fa").addClass("d-none");
            $(elem).find(".fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).append(`<p class='error'>${err.responseText}</p>`);
        });

    };

    $(elem).find(".fa-circle-notch").removeClass("d-none");
    $(elem).find(".error, .success").remove();

    let data = {};

    let val = JSON.parse( localStorage.getItem("val") );

    if ( type == "customer" ) {
        data = {
            orderEmail: val.order.email,
            orderSer: val.order.ser,
            toEmail: val.order.email
        };
    } else if ( type == "shop" ) {
        data = {
            orderEmail: val.order.email,
            orderSer: val.order.ser,
            toEmail: val.owner.email
        };
    } else {
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        $(elem).append("<p class='error'>Wrong Input please</p>");
    };

    $.ajax({
        url: `/${urlParams().brand}/gen/data/sendReceiptToEmail/n`,
        method: "POST",
        data: data,
        success: result => { 
            updateInStage(result);
        }
    }).fail( err => {
        console.log(err);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${err.responseTxt}</p>`);
    });

}

let sendNote = function( type, elem ) {

    $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
    $(elem).closest("div.open.xtoggle").find(".icons > .fa-circle-notch").removeClass("d-none");
    $(elem).closest("div.open.xtoggle").find(".btn").html("Saving...");

    if ( $(elem).closest("div").find("textarea").val() == "" ) {
        $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
        $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
        let responseTxt = "Error. Enter a comment.";
        $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
        return;
    } else if ($(elem).closest("div").find("textarea").val().length < 10) {
        $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
        $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
        let responseTxt = "Error. Comment must be longer than 10 characters..";
        $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
        return;
    }

    let val = JSON.parse( localStorage.getItem("val") );
    let data = {};

    data.msgText = `
        <p> ${ $(elem).closest("div").find("textarea").val() } </p> 
        <p> 
            <small>
                Note created by Customer
            </small>
        </p>
        <p>
            <small>
                <a href="${urlParams().origin}/${urlParams().brand}/gen/email/receipt/n?ser=${val.order.ser}&email=${val.order.email}">View Order Receipt.</a>
            </small>
        </p>
    `;

    if ( type == "customer" ) {
        Object.assign( data , {
            orderEmail: val.order.email,
            orderSer: val.order.ser,
            toEmail: val.order.email,
            msgSubject: "Special Note from Shop - " + val.owner.person.name, 
        }) ;
    } else if ( type == "shop" ) {
        Object.assign( data , {
            orderEmail: val.order.email,
            orderSer: val.order.ser,
            toEmail: val.owner.email,
            msgSubject: "Special Note from Customer ", 
        }) ;
    } else {
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        $(elem).append("<p class='error'>Wrong Input please</p>");
    };

    let createAStage = function() {

        let msg = {};
        msg.text = `<p> ${ $(elem).closest("div").find("textarea").val() } </p> 
                    <p> 
                        <small>
                            Note created by Customer. 
                        </small>
                    </p>`;


        if (type == "customer") {
            msg.hdg = "Note from Shop";
        } else if ( type == "shop" ) {
            msg.hdg = "Note from Customer";
        }

        let data = {
            _id: val.order._id, 
            key : "stages",
            item : {
                id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                time: getFormattedDate(),
                hdg: msg.hdg,
                msg: msg.text,
                type: "note"
            }
        };

        $.ajax({
            url: `/${urlParams().brand}/gen/data/saveItemInArray/${urlParams().brand}-orders`,
            data: data,
            method: "POST",
            success: val => {
                console.log(val);
                $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
                $(elem).closest("div.open.xtoggle").find(".fa-check").removeClass("d-none");
                $(elem).closest("div.open.xtoggle").find(".btn").html("Sent..! 3/3!");
                return console.log("note sending completed");
            }
        }).fail( err => {
            console.log(err);
            $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
            $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
        });

    };

    let sendMsgToSlack = function() {

        console.log("send this receipt to the slack channel");

        let msg = {};
        if (type == "customer") {
            msg.hdg = "Sent a Note to Customer from Dashboard!";
        } else if ( type == "shop" ) {
            msg.hdg = "Local Test - Sent a Note to Shop from Dashboard!";
        }


        let data = {
            msg: `
*${msg.hdg}*

${ $(elem).closest("div").find("textarea").val() }

Note sent by ${val.owner.person.name} (${val.owner.person.email}).`
        }

        $.ajax({
            url: `/${urlParams().brand}/gen/data/sendReceiptToSlack/n`, // TODO: Make these specific for 'gen' purpose not-exploitable
            method: "POST",
            data: data,
            success: val => {
                console.log(val);
                $(elem).closest("div.open.xtoggle").find(".btn").html("Sending... 2/3");
                createAStage();
                return;
            },
        }).fail( err => {
            console.log(err);
            $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
            $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
        }); 

    };

    $.ajax({
        url: `/${urlParams().brand}/gen/data/sendMsgToEmail/n`, // TODO: Make these specific for gen purpose not-exploitable
        method: "POST",
        data: data,
        success: result => { 
            console.log(result);
            $(elem).closest("div.open.xtoggle").find(".btn").html("Sending... 1/3");
            sendMsgToSlack();
        }
    }).fail( err => {
        console.log(err);
        $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
        $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
    });

}

let addPaymentDetails = function(type, elem ) {

    $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
    $(elem).closest("div.open.xtoggle").find(".icons > .fa-circle-notch").removeClass("d-none");
    $(elem).closest("div.open.xtoggle").find(".btn").html("Sending...0/3");

    if ( $(elem).closest("div").find("textarea").val() == "" ) {
        $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
        $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
        let responseTxt = "Error. Enter a comment.";
        $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
        return;
    } else if ($(elem).closest("div").find("textarea").val().length < 10) {
        $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
        $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
        let responseTxt = "Error. Comment must be longer than 10 characters..";
        $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
        return;
    }

    let val = JSON.parse( localStorage.getItem("val") );
    let data = {};

    let msg = {};
    msg.text = `<p> ${ $(elem).closest("div").find("textarea").val() } </p> 
                <p> 
                    <small>
                        Note created by Customer.
                    </small>
                </p>`;


    msg.hdg = `Payment Updated: ${type}`;

    data = {
        _id: val.order._id, 
        key : "stages",
        item : {
            id : Date.now().toString(36) + Math.random().toString(36).substr(2),
            time: getFormattedDate(),
            hdg: msg.hdg,
            msg: msg.text,
            type: "payment"
        }
    };

    $.ajax({
        url: `/${urlParams().brand}/gen/data/saveItemInArray/${urlParams().brand}-orders`,
        data: data,
        method: "POST",
        success: val => {
            console.log(val);
            $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
            $(elem).closest("div.open.xtoggle").find(".fa-check").removeClass("d-none");
            $(elem).closest("div.open.xtoggle").find(".btn").html("Saved!");
            return console.log("note sending completed");
        }
    }).fail( err => {
        console.log(err);
        $(elem).closest("div.open.xtoggle").find(".icons > .fa").addClass("d-none");
        $(elem).closest("div.open.xtoggle").find(".icons > .fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).closest("div.open.xtoggle").find(".btn").html(responseTxt);
    });

}
