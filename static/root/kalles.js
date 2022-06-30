
let openOrder = function(elem, id) {

    $.ajax({
        url: `/${urlParams().brand}/gen/data/kallesReceipt/${ id }`,
        method: "GET",
        success: val => {
            console.log(val);
            $(".kallesReceipt").removeClass("d-none");
        }
    }).fail( err => console.log(err) );

};
