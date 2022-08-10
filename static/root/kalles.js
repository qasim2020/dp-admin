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
    order = order[0];
    console.log(order);

    $("body > div").addClass("d-none");
    $(".alarm-page").removeClass("d-none");

    console.log(order.meta);
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

let getDateTime = function(objectId) {
    let date = new Date(parseInt(objectId.toString().substring(0, 8), 16) * 1000);
    let dtg = date.toString().split(" ");
    let obj = {
        time: dtg[4],
        date: dtg[2],
        month: dtg[1],
        yr: dtg[3]
    }
    let time = obj.time.split(":");
    obj.time = time[0]+time[1]+ " hrs";
    return `${obj.time} · ${obj.date} ${obj.month} ${obj.yr.slice(2,4)}`;
};

let openOrder = function(elem, id) {

    return window.location.href = `/${urlParams().brand}/admin/page/showOrder/${ id }`,

    $.ajax({
        url: `/${urlParams().brand}/gen/data/kallesReceipt/${ id }`,
        method: "GET",
        success: val => {

            $(".layerOne").addClass("d-none");
            let meta = JSON.parse(val.order.meta);
            
            // draw items html for placing inside receipt
            let items = meta.reduce( (total, val, key) => {

                return total += `<p class="itemRow items">
                                     <span>${val.product.name} (${val.size.label}) <strong>x ${val.quantity} </strong></span>
                                     <span>${val.quantity} x PKR ${val.product.sale_price ? val.product.sale_price : val.product.price}</span>
                                 </p>`;
            }, "" );

            // get formatted date and time
            // draw the receipt html
            let html = `
            <div class="receipt">

                <div class="imgRow">
                    <img src="${val.owner.brandLogo.photo.medium}" alt="">
                </div>

                <div class="firstRow ">
                    
                    <div class="">
                        <h3>ORDER #</h3>
                        <p id="orderNo">${val.order.ser}</p>
                    </div>

                    <div class="">
                        <h3>STATUS</h3>
                        <p>${val.order.status}</p>
                    </div>
                
                </div>

                <div class="">
                    <h3>DATE/ TIME</h3>
                    <p>${getDateTime(val.order._id)}</p>
                </div>


                <div class="">
                    <h3>NAME</h3>
                    <p>${val.order.name}</p>
                </div>

                <div class="">
                    <h3>SHIPPING ADDRESS</h3>
                    <p>${val.order.address}</p>
                </div>
                <div class="">
                    <h3>EMAIL</h3>
                    <p>${val.order.email}</p>
                </div>

                <div class="">
                    <h3>MOBILE NUMBER</h3>
                    <p>${val.order.mobile}</p>
                </div>

                <h3 class="orderSummary">ORDER SUMMARY</h3>
            
                <article class="" >

                    ${items}

                    <p class="itemRow">
                        <span>Total Amount</span>
                        <span>PKR ${val.order.cost}</span>
                    </p>

                    <p>In'sha'Allah, you will receive this order in next 2 days. In case of a problem, please contact <br> 0331-7AM7AM7</p>

                </article>

            </div>
            `;

            // draw the stages
            let stagesOpened = $("#attach_stages > .bar.header > p").hasClass("opened") ? "opened" : "closed"; 
            let stages = val.order.stages && val.order.stages.reverse().reduce( (total, stage, key) => {

                stage.msg = stage.msg && stage.msg.length > 0 ? `<div>${stage.msg}</div>` : "";

                if (stagesOpened == "opened") {

                    return total += `
                        <div class="bar toggleable opened">
                            <div class="head">
                                <div class="left opened" onclick="smallCollapseToggle(this)">
                                    <p class="smallTime">${stage.time}</p>
                                    <p class="icon">
                                        <i class="fa fa-plus d-none"></i> 
                                        <i class="fa fa-minus"></i> 
                                    </p>
                                    <h3> ${stage.hdg} </h3>
                                </div>
                                <div class="right" onclick="deleteMeFromStages(this, '${val.order._id}', 'stages', '${stage.id}')" >
                                    <i class="fa fa-trash"></i>
                                    <i class="fa fa-circle-notch spin d-none"></i>
                                    <i class="fa fa-warning d-none"></i>

                                </div>
                            </div>
                            <div class="open">
                                <p> ${stage.msg} </p>
                            </div>
                        </div>
                    `;

                } else {
                    return total += `
                        <div class="bar toggleable closed">
                            <div class="head">
                                <div class="left closed" onclick="smallCollapseToggle(this)">
                                    <p class="smallTime">${stage.time}</p>
                                    <p class="icon">
                                        <i class="fa fa-plus"></i> 
                                        <i class="fa fa-minus d-none"></i> 
                                    </p>
                                    <h3> ${stage.hdg} </h3>
                                </div>
                                <div class="right" onclick="deleteMeFromStages(this, '${val.order._id}', 'stages', '${stage.id}')" >
                                    <i class="fa fa-trash"></i>
                                    <i class="fa fa-circle-notch spin d-none"></i>
                                    <i class="fa fa-warning d-none"></i>
                                </div>
                            </div>
                            <div class="open d-none">
                                <p> ${stage.msg} </p>
                            </div>
                        </div>
                    `;
                }

            }, "" )
            
            if ( $("body > .kallesReceipt, body > .actions-page").length > 0 ) {
                $("#pjax-container").find(".kallesReceipt, .actions-page").remove();
                $(".kallesReceipt").removeClass("d-none");
            } else {
                $(".kallesReceipt").appendTo("body").removeClass("d-none");
                $(".actions-page").appendTo("body");
            };

            resetActionsOverlay(val);

            $("#attach_receipt").html(html);
            $("#attach_stages > .bar.toggleable").remove();

            let elem = $("#attach_stages > .bar.header > p");

            if (stagesOpened == "opened") {
                $(elem).find("span:nth-child(1)").addClass("d-none");
                $(elem).find("span:nth-child(2)").removeClass("d-none");
            } else {
                $(elem).find("span:nth-child(1)").removeClass("d-none");
                $(elem).find("span:nth-child(2)").addClass("d-none");
            }

            $("#attach_stages").append(stages);

            $("#send_receipt_to_shop").attr({ onclick: `sendReceiptToEmail( ${ JSON.stringify(val) }, "shop" , this)` });
            $("#send_receipt_to_customer").attr({ onclick: `sendReceiptToEmail( ${ JSON.stringify(val) }, "customer", this )` });
            $("#send_receipt_to_slack").attr({ onclick: `sendReceiptToSlack( ${ JSON.stringify(val) }, this )` });
            $("#send_note_to_customer").attr({ onclick: `sendNote( ${ JSON.stringify(val) }, 'customer', this )` });
            $("#send_note_to_shop").attr({ onclick: `sendNote( ${ JSON.stringify(val) }, 'shop', this )` });

        }

    }).fail( err => console.log(err) );

};

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

    console.log("send this receipt to the slack channel");

    let val = JSON.parse( localStorage.getItem("val") );

    console.log(val);

    let meta = JSON.parse(val.order.meta);
    
    let items = meta.reduce( (total, val, key) => {

        return total += `${val.quantity} x ${val.product.name} (${val.size.label}) with item Cost of  PKR ${val.product.sale_price ? val.product.sale_price : val.product.price} \n`;

    }, "" );

    let data = {
        msg: `
*Receipt shared manually from Dashboard!*

Order No = ${val.order.ser}
Status = ${val.order.status}
Day/Time = ${ getDateTime(val.order._id) }

Customer
Name = ${val.order.name}
Address = ${val.order.address}
Email = ${val.order.email}
Mobile = ${val.order.mobile}

Order 
${items}

Total Amount
*PKR ${val.order.cost}*

View Receipt at : ${urlParams().origin}/${urlParams().brand}/gen/email/receipt/n?ser=${val.order.ser}&email=${val.order.email}

Receipt sent by ${val.owner.person.name} (${val.owner.person.email}).`

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
            msg.hdg = "Special Note from Shop";
        } else if ( type == "shop" ) {
            msg.hdg = "General Remarks";
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
