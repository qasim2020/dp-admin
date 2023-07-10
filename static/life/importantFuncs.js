$(document).on('click', '.subscribe > .submit', function() {

  if (!($(".subscribe").valid())) {

    return;

  }

  $(this).html('Subscribing...');

  $('.subscribe>.success').addClass('d-none');
  $('.subscribe>.error:not(input)').addClass('d-none');

  let data = {
    "email": $('#subscribe-input').val(),
  };

  data = JSON.stringify(data);

  $.ajax({
    url: '/life/gen/data/subscribeCustomer/n',
    type: 'post',
    data,
    headers: {
      'content-type': 'application/json',
    }
  }).done((msg) => {
    console.log(msg);
    $(this).html('Subscribed');
    $('.subscribe>.success').removeClass('d-none');
  }).fail((e) => {
    console.log(e);
    $(this).html('Subscribe');
    $('.error').removeClass('d-none').html(e.responseText);
    console.log(e.responseText);
  });
})

$(".subscribe").validate({

  rules: {
    'email': {
      required: true,
      email: true
    }
  },
  messages: {
    'email': {
      required: `Email is required before you press this button.`,
      email: `Email is invalid`,
    },
  },
  errorPlacement: function(error, element) {
    console.log(error, element);
    $(element).siblings('.error').removeClass('d-none').html(error);
  },

});

$(document).ready( () => {


    return; 

    console.log({subscriptionNotLogged: localStorage.getItem("subscriptionNotLogged") });

    if (localStorage.getItem("subscriptionNotLogged") != "false" ) {
        setTimeout(function(){
            console.log('showing overlay');
            $('.subscribe').removeClass('d-none');
            $('.overlay').removeClass('d-none');
        }, 10000);
    }

})

let hideModel = function() {

    localStorage.setItem("subscriptionNotLogged", false);
    $('.subscribe').addClass('d-none');
    $('.overlay').addClass('d-none');

};

let showModel = function() {

    $('.subscribe').removeClass('d-none');
    $('.overlay').removeClass('d-none');

};

