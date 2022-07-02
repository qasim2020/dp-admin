
let openOrder = function(elem, id) {

    $.ajax({
        url: `/${urlParams().brand}/gen/data/kallesReceipt/${ id }`,
        method: "GET",
        success: val => {
            console.log(val);
            $(".layerOne").addClass("d-none");
            $(".kallesReceipt").appendTo("body").removeClass("d-none");
            $(".actions-page").appendTo("body");
        }
    }).fail( err => console.log(err) );

};
