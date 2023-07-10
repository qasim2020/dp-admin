let subscribeMe = function(elem) {

    let input = $(elem).siblings("input");
    let email = input.val();

    $(".subscribe-error").addClass("d-none");
    $(".subscribe-success").addClass("d-none");

    if (!(email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g))) {

        console.log("invalid input field");
        $(".subscribe-error").removeClass("d-none");
        $(".subscribe-error > label").html("Please enter a valid email address.");
        return;

    };

    $(".subscribe-success").removeClass("d-none");
    $(".subscribe-success > label").html("Subscribing...");


    let data = {
      "email": email
    };

    data = JSON.stringify(data);
      
    $.ajax({
      url: 'https://qasimali.xyz/life/gen/data/subscribeCustomer/n',
      type: 'post',
      data,
      headers: {
        'content-type': 'application/json',
      }
    }).done((msg) => {
      console.log(msg);
      $(".subscribe-success").removeClass("d-none");
      $(".subscribe-success > label").html("Email sent! Check inbox to verify your email.");
      // $('.subscribe>.success').removeClass('d-none');
    }).fail((e) => {
      console.log(e);
      $(".subscribe-error").removeClass("d-none");
      $(".subscribe-error > label").html(e.responseText);
    });

};

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

