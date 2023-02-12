

//form should have email, password
$('form').on('submit',function(e) {
    e.preventDefault();
    console.log($(this).serialize());
    $('#signInSubmit').attr({value: "Signin in..."});
    $.ajax({
      type: "POST",
      url: '/7am/gen/data/checkSignIn/n',
      data: $(this).serialize(),
      success: (data) => {
        console.log(data);
        $('#signInSubmit').attr({value: "Done! Opening dashboard"});
        if (data.error) return 'Click on show collections to go home';
        window.location.href = `/${data.brand}/${data.role}/page/newDashboard/${data.brand}-products`;
      }
    }).fail( (err) => {
        console.log(err);
        $('#signInSubmit').attr({value: err.responseText});
    });
});


let searchItems = function(elem) {

    console.log("build this feature after comments feature");

};
