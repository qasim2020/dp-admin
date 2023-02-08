
let sendMail = function(elem) {

    let msg = `

${$("#message").val()}

---
${$("#name").val()}
${$("#email").val()} 

    `;

    msg = msg.split("\n").reduce( (total, val) => {

        return total += `<p>${val}</p>`;

    }, "" );

    console.log(msg);

    let data = {
        msgText: msg,
        toEmail: "hello@qasim.tech", 
        msgSubject: $("#email").val(),
        brand: "tech"
    }

    console.log(data);

    $("#submit_btn").html("Sending...");

    $.ajax({
        url: "/tech/gen/data/sendMsgToEmail/n",
        method: "POST",
        data: data,
        success: val => $("#submit_btn").html("Message Sent.")
    }).fail( err => $("#submit_btn").html( JSON.stringify(err.responseText) ) );

};

