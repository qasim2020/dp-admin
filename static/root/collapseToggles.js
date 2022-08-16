    let openLayer = function(elem, target) {

        console.log("close", elem);
        console.log("open", target);
        $(elem).addClass("d-none");
        $(target).removeClass("d-none");

    };

    let collapseToggle = function(elem) {
        if ($(elem).hasClass("opened")) {

            $(elem).closest(".collapseToggles").find(".bar.toggleable").removeClass("opened");
            $(elem).closest(".collapseToggles").find(".bar.toggleable").addClass("closed");
            $(elem).closest(".collapseToggles").find(".open").addClass("d-none");
            $(elem).closest(".collapseToggles").find(".opened").addClass("closed").removeClass("opened");
            $(elem).closest(".collapseToggles").find(".icon > .fa-minus, h3 > .fa-minus, .head .fa-minus").addClass("d-none");
            $(elem).closest(".collapseToggles").find(".icon > .fa-plus, h3 > .fa-plus, .head .fa-plus").removeClass("d-none");

            $(elem).find("span:nth-child(1)").removeClass("d-none");
            $(elem).find("span:nth-child(2)").addClass("d-none");
            $(elem).addClass("closed");
            $(elem).removeClass("opened");

        } else {

            $(elem).closest(".collapseToggles").find(".bar.toggleable").addClass("opened");
            $(elem).closest(".collapseToggles").find(".bar.toggleable").removeClass("closed");
            $(elem).closest(".collapseToggles").find(".open").removeClass("d-none");
            $(elem).closest(".collapseToggles").find(".closed").addClass("opened").removeClass("closed");
            $(elem).closest(".collapseToggles").find(".icon > .fa-minus, h3 > .fa-minus, .head .fa-minus").removeClass("d-none");
            $(elem).closest(".collapseToggles").find(".icon > .fa-plus, h3 > .fa-plus, .head .fa-plus").addClass("d-none");

            $(elem).find("span:nth-child(1)").addClass("d-none");
            $(elem).find("span:nth-child(2)").removeClass("d-none");
            $(elem).addClass("opened");
            $(elem).removeClass("closed");
        };
    };

    let smallCollapseToggle = function(elem) {

        if ($(elem).hasClass("opened")) {

            $(elem).closest(".toggleable").addClass("closed").removeClass("opened");
            $(elem).closest(".toggleable").find(".open").addClass("d-none");
            $(elem).closest(".toggleable").find("h3 > .fa-minus, .icon > .fa-minus, .head .fa-minus").addClass("d-none");
            $(elem).closest(".toggleable").find("h3 > .fa-plus, .icon > .fa-plus, .head .fa-plus").removeClass("d-none");

            $(elem).addClass("closed");
            $(elem).removeClass("opened");

        } else {

            $(elem).closest(".toggleable").addClass("opened").removeClass("closed");
            $(elem).closest(".toggleable").find(".open").removeClass("d-none");
            $(elem).closest(".toggleable").find("h3 > .fa-minus, .icon > .fa-minus, .head .fa-minus").removeClass("d-none");
            $(elem).closest(".toggleable").find("h3 > .fa-plus, .icon > .fa-plus, .head .fa-plus").addClass("d-none");

            $(elem).removeClass("closed");
            $(elem).addClass("opened");

        }


    };

    let xtoggle = function(elem) {

        if ( $(elem).closest(".xtoggle").find(".body").hasClass("d-none") ) {

            $(elem).closest(".xtoggle").find(".body").removeClass("d-none");
            $(elem).closest(".xtoggle").find(".fa-plus").addClass("d-none");
            $(elem).closest(".xtoggle").find(".fa-minus").removeClass("d-none");
            $(elem).closest(".xtoggle").siblings(".xtoggle").find(".body").addClass("d-none");
            $(elem).closest(".xtoggle").siblings(".xtoggle").find(".fa-plus").removeClass("d-none");
            $(elem).closest(".xtoggle").siblings(".xtoggle").find(".fa-minus").addClass("d-none");

        } else {

            $(elem).closest(".xtoggle").find(".body").addClass("d-none");
            $(elem).closest(".xtoggle").siblings(".xtoggle").find(".body").removeClass("d-none");
            $(elem).closest(".xtoggle").find(".fa-plus").removeClass("d-none");
            $(elem).closest(".xtoggle").find(".fa-minus").addClass("d-none");
            $(elem).closest(".xtoggle").siblings(".xtoggle").find(".fa-plus").addClass("d-none");
            $(elem).closest(".xtoggle").siblings(".xtoggle").find(".fa-minus").removeClass("d-none");

        }

    };

