let openOrder = function(elem, id) {

    $.ajax({
        url: `/${urlParams().brand}/gen/data/kallesReceipt/${ id }`,
        method: "GET",
        success: val => {
            console.log(val);
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

            // draw the receipt html
            let html = `
            <div class="receipt">

                <div class="imgRow">
                    <img src="{{split1 data.resources.[0].logo}}" alt="">
                    <button class="copyText" onclick="copyText(this)">Copy Receipt Link</button>
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
            let stages = val.order.stages && val.order.stages.reduce( (total, val, key) => {

                return total += `
                    <div class="collapsable">
                        <h3 class="collapsed d-none">${val.hdg}</h3>
                        <div class="open">
                            <p>${val.time}</p>
                            <p>${val.hdg}</p>
                            <div>${val.msg}</div>
                            <button>Edit</button> 
                            <button>Delete</button>
                        </div>
                    </div>
                `;

            }, "" )

            $("#attach_receipt").html(html);
            $("#attach_stages > .collapsable").remove();
            $("#attach_stages").append(stages);

            $("#send_receipt_to_shop").attr({ onclick: `sendReceiptToEmail('${val.owner.email}', '${val.order.ser}')` });
            $("#send_receipt_to_customer").attr({ onclick: `sendReceiptToEmail('${val.order.email}', '${val.order.ser}')` });

            // layers handling dont write after this
            if ( $("body > .kallesReceipt, body > .actions-page").length > 0 ) {
                $(".kallesReceipt").removeClass("d-none");
                return;
            };
            $(".kallesReceipt").appendTo("body").removeClass("d-none");
            $(".actions-page").appendTo("body");

        }
    }).fail( err => console.log(err) );

};

let sendReceiptToEmail = function(email, ser) {
    console.log("send this receipt on a certain email");

    let data = {
        email: email,
        ser: ser, 
    };

    console.log(data);

    $.ajax({
        url: `/${urlParams().brand}/gen/data/sendReceiptToEmail/n`,
        method: "POST",
        data: data,
        success: val => console.log(val),
    }).fail( err => console.log(err) );
}

let sendReceiptToSlack = function(slackId) {
    console.log("send this receipt to the slack channel");
}

let createLayer = function(type) {
    console.log("open the note layer");
}

let generateAlarm = function() {
    console.log("generate the alarm on this page");
}

let setOrderStatus = function(status) {
    console.log("set status of order to - " , status);
}

let addPaymentDetails = function(type) {
    console.log("open a place to add the payment details for this order");
}
