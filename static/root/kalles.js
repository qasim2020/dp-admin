let startShowOrder = function(id) {

    $(".open.quick.active").find(".fa-check").removeClass("d-none");

    $.ajax({
        url: `/${urlParams().brand}/admin/data/showOrder/${ id }`,
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

socket.on(`${urlParams().brand}newOrder`, (order) => {
    console.log(order);

    $("body > div").addClass("d-none");
    $(".alarm-page").removeClass("d-none");

    let meta = JSON.parse(order.meta);

    let items = meta.reduce( (total, val, key) => {

        return total += `<p class="itemRow items">
                             <strong> <span> ${val.quantity} x ${val.product.name} (Size: ${val.size.label}) </strong>;  item cost is <strong>PKR ${val.product.sale_price ? val.product.sale_price : val.product.price}</strong>
                         </p>`;
    }, "" );

    let orderHtml = `

    <p><strong>Customer</strong></p>
    <p>${order.name} - ${order.email} - ${order.mobile}</p>
    <p>${order.address}</p>
    <hr>
    <p><strong>Items</strong></p>
    <p>${items}</p>
    <hr>
    <p><strong>Total Cost</strong></p>
    <p>PKR ${order.cost}</p>
    <hr>
    <p><strong>Payment</strong></p>
    <p>${order.payment}</p>
    <button onclick="window.location.href='/${ urlParams().brand }/admin/page/showOrder/${order._id}'">View ➝</button>
    `;

    $(".alarm-page").find(".order").html(orderHtml);
    $(".alarm-page").find(".order, .skip, .accept, .reject").find("button").attr({ orderId: order._id });

    if (order.testing == "true") {
        $(".alarm-page").find(".accept").find("button").attr({ testing: "true" });
    } else {
        $(".alarm-page").find(".accept").find("button").attr({ testing: "false" });
    }

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
            msg.text = `Email was sent by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong> of current receipt amounting to <strong>PKR ${val.order.cost}</strong> to <strong>${val.order.name} (${val.order.email})</strong>.`;

        } else if ( type == "shop" ) {

            msg.hdg = "Sent Receipt to Shop's Email";
            msg.text = `Email was sent by <strong>${val.owner.person.name} (${val.owner.person.email})</strong> of current receipt amounting to <strong>PKR ${val.order.cost}</strong> to <strong>${val.owner.brandName} (${val.owner.email})</strong>.`;
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
                $(elem).append("<p class='success'>Email Sent Successfully</p>");
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
        url: `/${urlParams().brand}/admin/data/sendReceiptToEmail/n`,
        method: "POST",
        data: data,
        success: result => { 
            console.log(result) ;
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

let deleteMeFromStages = function( elem, _id, key, stageId ) {
    
    $(elem).find(".fa").addClass("d-none");
    $(elem).find(".fa-circle-notch").removeClass("d-none");

    let data =  {
        _id: _id,
        key: key, 
        keyId: stageId
    };

    console.log(data);

    $.ajax({
        url: `/${urlParams().brand}/admin/data/deleteItemInArray/${urlParams().brand}-orders`,
        method: "post",
        data: data,
        success: val => { 
            console.log(val);
            $(elem).closest(".bar.toggleable").remove();
        }
    }).fail( error => {
        console.log(error);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
    });

}

let sendReceiptToSlack = function(elem) {

    let val = JSON.parse( localStorage.getItem("val") );

    let meta = JSON.parse(val.order.meta);
    
    let items = meta.reduce( (total, val, key) => {

        return total += `${val.quantity} x ${val.product.name} (${val.size.label}) with item cost of  pkr ${val.product.sale_price ? val.product.sale_price : val.product.price} \n`;

    }, "" );

    let data = {
        msg: `
*receipt shared manually from dashboard!*

order no = ${val.order.ser}
status = ${val.order.status}
day/time = ${ getdatetime(val.order._id) }

customer
name = ${val.order.name}
address = ${val.order.address}
email = ${val.order.email}
mobile = ${val.order.mobile}

order 
${items}

total amount
*pkr ${val.order.cost}*

view receipt at : ${urlparams().origin}/${urlparams().brand}/gen/email/receipt/n?ser=${val.order.ser}&email=${val.order.email}

receipt sent by ${val.owner.person.name} (${val.owner.person.email}).`

    }

    $(elem).find(".fa-circle-notch").removeClass("d-none");
    $(elem).find(".error, .success").remove();

    let createAStage = function() {

        let msg = {};
        msg.text = `<p> 
                        <small>
                            Receipt created by <strong>${val.owner.person.name} (${val.owner.person.email})</strong>. 
                        </small>
                    </p>`;


        msg.hdg = "Sent Receipt to Slack";

        let slackData = {
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
            data: slackData,
            method: "POST",
            success: val => {
                console.log(val);
                $(elem).find(".fa").addClass("d-none");
                $(elem).find(".fa-check").removeClass("d-none");
                $(elem).append("<p class='success'>Slack Notification Sent Successfully</p>");
            }
        }).fail( err => {
            console.log(err);
            $(elem).find(".fa").addClass("d-none");
            $(elem).find(".fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).append(`<p class='error'>${responseTxt}</p>`);
        });

    };

    $.ajax({
        url: `/${urlParams().brand}/admin/data/sendReceiptToSlack/n`,
        method: "POST",
        data: data,
        success: val => {
            console.log(val);
            createAStage();
        },
    }).fail( err => {
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${responseTxt}</p>`);
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
                Note created by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong> on order # ${val.order.ser} amounting to <strong>PKR ${val.order.cost}</strong>. 
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
            msgSubject: "Special Note from Customer - (Test Created) - " + val.owner.person.name, 
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
                            Note created by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong> on order # ${val.order.ser} amounting to <strong>PKR ${val.order.cost}</strong>. 
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
            url: `/${urlParams().brand}/admin/data/sendReceiptToSlack/n`,
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
        url: `/${urlParams().brand}/admin/data/sendMsgToEmail/n`,
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

let generateAlarm = function(elem) {

    $(elem).find(".fa").addClass("d-none");
    $(elem).find(".fa-circle-notch").removeClass("d-none");
    $(elem).find(".error, .success").remove();

    $.ajax({
        url: `/${urlParams().brand}/admin/data/testPlaceOrder/n`,
        method: "GET",
        success: val => {
            console.log(val);
            $(elem).find(".fa").addClass("d-none");
            $(elem).find(".fa-check").removeClass("d-none");
            $(elem).append("<p class='success'>Alarm generated successfully!</p>");
        }
    }).fail( err => {
        console.log(err);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${responseTxt}</p>`);
    });
    
}

let setPaymentStatus = function(elem, orderId, status) {

    $(elem).closest(".section").find(".fa").addClass("d-none");
    $(elem).find(".fa-circle-notch").removeClass("d-none");
    $(elem).closest(".section").find(".error, .success").remove();

    let data = {
        payment: status
    };

    let createAStage = function() {

        let val = JSON.parse( localStorage.getItem("val") );

        let msg = {};
        msg.text = `<p> 
                        <small>
                            Status updated by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong>.
                        </small>
                    </p>`;


        msg.hdg = `Payment: ${status}`;

        let data = {
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
                $(elem).find(".fa").addClass("d-none");
                $(elem).find(".fa-check").removeClass("d-none");
                $(elem).append("<p class='success'>Order status updated !</p>");
            },
        }).fail( err => {
            console.log(err);
            $(elem).find(".fa").addClass("d-none");
            $(elem).find(".fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).append(`<p class='error'>${responseTxt}</p>`);
        });

    };

    $.ajax({
        url: `/${urlParams().brand}/admin/data/updateDocument/${urlParams().brand}-orders?_id=${orderId}`, 
        method: "POST",
        data: data,
        success: val => {
            console.log(val);
            return createAStage();
        },
    }).fail( err => {
        console.log(err);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${responseTxt}</p>`);
    });


};

let setOrderStatus = function(elem, orderId, status) {

    $(elem).closest(".section").find(".fa").addClass("d-none");
    $(elem).find(".fa-circle-notch").removeClass("d-none");
    $(elem).closest(".section").find(".error, .success").remove();

    let data = {
        status: status
    };

    let createAStage = function() {

        let val = JSON.parse( localStorage.getItem("val") );

        let msg = {};
        msg.text = `<p> 
                        <small>
                            Status updated by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong>.
                        </small>
                    </p>`;


        msg.hdg = `Order status changed to '${status}'`;

        let data = {
            _id: val.order._id, 
            key : "stages",
            item : {
                id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                time: getFormattedDate(),
                hdg: msg.hdg,
                msg: msg.text,
                type: "status"
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
                $(elem).append("<p class='success'>Order status updated !</p>");
            },
        }).fail( err => {
            console.log(err);
            $(elem).find(".fa").addClass("d-none");
            $(elem).find(".fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).append(`<p class='error'>${responseTxt}</p>`);
        });

    };

    $.ajax({
        url: `/${urlParams().brand}/admin/data/updateDocument/${urlParams().brand}-orders?_id=${orderId}`, 
        method: "POST",
        data: data,
        success: val => {
            console.log(val);
            return createAStage();
        },
    }).fail( err => {
        console.log(err);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${responseTxt}</p>`);
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
                        Note created by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong>.
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

let acceptOrder = function(elem, status) {

    if ( $(elem).attr("testing") == "true") {

        return $(elem).html("This is a test order. Order can not be accepted");

    };

    let orderId = $(elem).attr("orderId");

    let data = {
        status: status, 
    };

    let createAStage = function() {

        let val = JSON.parse( localStorage.getItem("val") );

        let msg = {};
        msg.text = `<p> 
                        <small>
                            Status updated by <strong>${val.owner.person.name} (${val.owner.person.email}) </strong>.
                        </small>
                    </p>`;


        msg.hdg = `Order status changed to '${status}'`;

        let data = {
            _id: val.order._id, 
            key : "stages",
            item : {
                id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                time: getFormattedDate(),
                hdg: msg.hdg,
                msg: msg.text,
                type: "status"
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
                $(elem).html("Order accepted !");
                return;
            },
        }).fail( err => {
            console.log(err);
            $(elem).find(".fa").addClass("d-none");
            $(elem).find(".fa-warning").removeClass("d-none");
            let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
            $(elem).append(`<p class='error'>${responseTxt}</p>`);
        });

    };

    $.ajax({
        url: `/${urlParams().brand}/admin/data/updateDocument/${urlParams().brand}-orders?_id=${orderId}`, 
        method: "POST",
        data: data,
        success: val => {
            console.log(val);
            return createAStage();
        },
    }).fail( err => {
        console.log(err);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${responseTxt}</p>`);
    });

}

let resetActionsOverlay = function(val) {
    $(".actions-page").find(".link.openOrder").attr({onclick: `openOrder(this, "${val.order._id}")`});
    $(".actions-page").find(".icons > .fa").addClass("d-none");
    $(".actions-page").find("div.open.xtoggle").find(".btn").html("Send");
    $(".actions-page").find(".error, .success").remove();
    $(".actions-page").addClass("d-none");
};

let editOrder = function(elem) {

    $(elem).find(".fa").addClass("d-none");
    $(elem).find(".fa-circle-notch").removeClass("d-none");
    $(elem).find(".error, .success").remove();

    let val = JSON.parse( localStorage.getItem("val") );

    console.log(val);

    let msg = {}, 
        order = val.order, 
        meta = val.meta;

    let items = meta.reduce( (total, val, key) => {

        return total += `<p>
                             <strong> <span> ${val.quantity} x ${val.product.name} (Size: ${val.size.label}) </strong>;  item cost is <strong>PKR ${val.product.sale_price ? val.product.sale_price : val.product.price}</strong>
                     </p>`;
    }, "" );

    msg.text = `<h3><strong>Old Order:-</strong></h3>
                <p><strong>Customer</strong></p>
                <p>${order.name} - ${order.email} - ${order.mobile}</p>
                <p>${order.address}</p>
                <hr>
                <p><strong>Items</strong></p>
                <p>${items}</p>
                <hr>
                <p><strong>Total Cost</strong></p>
                <p>PKR ${order.cost}</p>
                <hr>
                <p><strong>Payment</strong></p>
                <p>${order.payment}</p>
                <p> 
                    <small>
                        Order editing started by <strong>${val.owner.person.name}</strong>.
                    </small>
                </p>`;


    msg.hdg = `Order is being changed`;

    let data = {
        _id: order._id, 
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
            $(elem).append("<p class='success'>Stage Added. Redirecting to edit page...</p>");

            window.location.href=`/${ urlParams().brand }/admin/page/editOrder/${order._id}`;
            return;
        },
    }).fail( err => {
        console.log(err);
        $(elem).find(".fa").addClass("d-none");
        $(elem).find(".fa-warning").removeClass("d-none");
        let responseTxt = err.responseText == "{}" ? "Error. Invalid request." : err.responseText;
        $(elem).append(`<p class='error'>${responseTxt}</p>`);
    });

};
