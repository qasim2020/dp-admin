( function() {

    let placeholder = `

        <style>

        [e-ser] {
            border: 4px solid red !important;
        }

        .btn-webEdit {
            background: white;
            border: 0px;
            margin: 0px;
            border-radius: 0px;
            width: 100%;
        }

        .cards {
            position: fixed;
            top: 57px;
            left: 10px;
            z-index: 100000;
            background: white;
            border: 2px solid black;
            max-height: 500px;
            overflow: scroll;
            width: 500px;
            max-width: 95vw;
        }

        .cards > div {
            font-family: inherit;
        }

        .cards > .inputs {
            float: left;
            width: 78%;
            margin: 4px 0px 0px 8px;
        }

        .cards > .buttons {
            float: right;
            border: transparent;
            background: white;
            position: sticky;
            top: 40px;
            padding: 0px;
            margin: 0px 7px 0 0;
            width: 18%;
            box-sizing: border-box;
        }

        .cards > .buttons > p {
            margin: 3px;
            background: whitesmoke;
            padding: 3px 6px;
            font-size: 10px;
            text-align: left;
            white-space: nowrap;
            overflow: scroll;
            font-weight: bold;
            color: black;
        }

        .cards > .buttons > p:hover {
            cursor: pointer;
        } 

        .cards > .buttons > p.active {
            background: black;
            color: white;
            font-weight: bold;
        }

        .cards > .inputs > div > label {
            font-weight: bold;
            font-size: 12px;
            color: black;
        }

        .cards > .inputs > div {
            margin-bottom: 10px;
            padding: 10px;
            background: whitesmoke;
            border: 1px dashed black;
        }

        .cards > .inputs > button {
            background: whitesmoke;
            border: 1px dashed black;
            border-radius: 0px;
            margin-bottom: 10px;
        }

        .box-label {
            margin-bottom: 0px;
            color: black;
        }

        </style>

        <div class="cards" id="draggable">
            <button class="btn-webEdit" onclick="$('.cards > div').toggleClass('d-none')">TOGGLE WEBEDITOR</button>
            <div class="buttons">
                
                <p><span>Banner</span></p>
                <p><span>Header</span></p>
                <p><span>Slides</span></p>
                <p><span>Card One</span></p>
                <p><span>Footer Logo</span></p>
                <p><span>Footer Contact</span></p>

            </div>

            <div class="inputs">

                

            </div>
        </div>

        <div class="placeholders d-none">

            <div class="href placeholder">
                <p>
                    <input type="text" placeholder="https://...." onkeyup="inputChanged(this)">
                </p>
            </div>

            <div class="img placeholder">

                <p>
                    <span>ENTER IMAGE LINK</span>
                    <input type="text" placeholder="https://...." onkeyup="inputChanged(this)">
                    <p class="error one d-none">Image does not exist. Please enter correct URL.</p>
                </p>

                <p>
                    <span>OR UPLOAD IMAGE MANUALLY</span>
                    <input class="" type="file" name="image-upload" value="" accept="image/*" onchange="readURL(this);">
                    <p class="error two d-none">Image does not exist. Please enter correct URL.</p>
                </p>
            
            </div>

        </div>

        ey<script src="/root/codemirror/js/codemirror.js"></script>
        <script src="/root/codemirror/js/xml.js"></script>

    `;
    
    $('body').append(placeholder);
    $( "#draggable" ).draggable();

    let webEdits = $("[we-ser] [e-ser]").map( (key,val) => { 
        $(val).attr({"e-ser": key});
        return val 
    }).get();

    let sideBtns = $("[we-ser]").get().reduce( (total, val) => {

        total += `<p connection="${ $(val).attr("we-ser") }" onclick="openConnection(this)"><span>${ $(val).attr("we-label") }</span></p>`;

        return total;

    }, "");

    let cards = webEdits.reduce( (total,val) => {

        let tagName = $(val).attr("e-type");

        let inputs = $(val).attr("e-attr").split(",").reduce( (total,val2, key) => {
            let string;
            if (val2.trim() == "html") {
                string = `
                    <label>${ val2.trim() }</label>
                    <input type='text' value='${ $(val).html().trim() }' connection="${ $(val).attr("e-ser") }" onkeyup="updateHTML(this, '${ val2.trim() }')">
                    `;
            } else {
                string = `
                    <label>${ val2.trim() }</label>
                    <input type='text' value='${ $(val).attr(val2.trim()) }' connection="${ $(val).attr("e-ser") }" onkeyup="updateHTML(this, '${ val2.trim() }')">
                    `;
            };
            return total += string;
        },"");

        total = total + `
            <div parentConnection="${ $(val).closest("[we-ser]").attr("we-ser") }" connection="${ $(val).attr("e-ser") }" class="d-none"> 
                <p class="box-label"> ${ $(val).attr("e-label") } </p> 
                ${inputs} 
            </div>`;

        return total;

//         let string = '';
// 
//         switch (true) {
//             case (tagName == "a"):
//                 string = `
//                     <label>${ $(val).attr("e-label") }</label>
//                     <input type='text' value='${ $(val).html().trim().toString() }' connection="${ $(val).attr("e-ser") }" onkeyup="updateHTML(this)">
//                     <label>LINK</label>
//                     <input type='text' value='${ $(val).attr("href") }' connection="${ $(val).attr("e-ser") }" onkeyup="updateHTML(this)">
//                 `;
//                 total = total + `<div> ${string} </div>`;
//                 break;
//             case (tagName == "img"):
//                 string = `
//                     <label>${ $(val).attr("e-label") }</label>
//                     <input type='text' value='${ $(val).attr("src") }' connection="${ $(val).attr("e-ser") }" onkeyup="updateHTML(this)">
//                 `;
//                 total = total + `<div> ${string} </div>`;
//                 break;
//             default:
//                 string = `
//                     <label>${ $(val).attr("e-label") }</label>
//                     <input type='text' value='${ $(val).html().trim().toString() }' connection="${ $(val).attr("e-ser") }" onkeyup="updateHTML(this)">
//                 `;
//                 total = total + `<div class="" connection="${ $(val).attr("e-ser") }"> ${string} </div>`;
//                 break;
//         }
// 
//         return total;
// 
    },"");


    $(".cards > .buttons").html( sideBtns );
    $(".cards > .inputs").html( cards + "<button onclick='storeHTML(this)'>Save</button>");

})();

let openConnection = function(elem) {

    $(elem).siblings("p").removeClass("active");
    $(elem).addClass("active");
    let connection = $(elem).attr("connection");
    $(`.cards > .inputs > div`).addClass("d-none");
    $(`.cards > .inputs > div[parentConnection=${ connection }]`).removeClass("d-none");
    $(`.cards > .inputs > button`).html("Save");

};

$(".cards > .buttons > *:eq(0)").trigger("click");

let updateHTML = function(elem, attr) {

    let e = $(elem).attr("connection");

    console.log( attr );

    if (attr == "html") {

        $(`[e-ser=${e}]`).html( $(elem).val() );

    } else {
      
        $(`[e-ser=${e}]`).attr( attr , $(elem).val() );

    };

    return;

};

let storeHTML = function(elem) {

    console.log("store me now");

    let connection = $(".cards > .buttons > *.active").attr("connection");

    let string = $(`[we-ser=${connection}]`).html();

    data = {
        string: string.trim(),
        ser : connection,
    };

    console.log(data);

    $(elem).html("Saving...").attr({disabled: true});

    $.ajax({
        url: "/7am/admin/data/storeHTML/n",
        method: "POST",
        data: data,
        success: val => {
            console.log(val);
            $(elem).html("Good!").attr({disabled: false});
        },
        error: (err, status, response) => {
            console.log(err);
            console.log(err.responseText);
            $(elem).html("Error while saving, try again.").attr({disabled: false});
        }
    });

};

let readURL = function (elem) {

    $(elem).closest(".placeholder").find("p.error").addClass("d-none");

    let afterCloudinary = function(val) {

        console.log(val);
        $(elem).closest(".placeholder").find("p.error.two").html("Uploading Image — Done. Saving...").removeClass("d-none");

        $(elem).closest(".webEditor").find('input[type="text"]').val(val.url);
        $(elem).closest('.placeholder').prev().attr({ 
            src: val.url, 
            public_id: val.public_id.split('/')[ val.public_id.split('/').length - 1 ] 
        }); 
        $(".btn.saving").addClass("d-none");

        $(elem).closest(".webEditor").attr({lock: "false"});
        saveSlide( $(elem).closest(".webEditor") );
        $(elem).closest(".placeholder").find("p.error.two").html("Uploading Image – Done. Saving – Done.").removeClass("d-none");
        // inputChanged( $(elem).closest(".webEditor").find('input[type="text"]') );

    };

    let uploadCloudinary = function(img) {

        let data = {
            public_id: $(elem).closest('.placeholder').prev().attr("public_id"),
            img: img,
            // width: $(elem).closest('.placeholder').prev().css('width').match(/\d+/g)[0],
            // height: $(elem).closest('.placeholder').prev().css('height').match(/\d+/g)[0],
            };

        $(elem).closest(".placeholder").prev().attr({ src : img });
        // $(".btn.saving").html("UPLOADING IMAGE...").removeClass("d-none");
        $(elem).closest(".placeholder").find("p.error.two").html("Uploading Image...").removeClass("d-none");
        console.log(data);

        $.ajax({
            url: "/{{data.brand}}/{{data.permit}}/data/uploadCloudinary/n",
            method: "POST",
            data: data,
            success: val => afterCloudinary(val),
            error: (err, status, response) => console.log(err.responseText)
        });
    };

    if (elem.files && elem.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            return uploadCloudinary(e.target.result);
        };
        reader.readAsDataURL(elem.files[0]);
    }
}

let inputChanged = function(elem) {
    console.log(" input changed");
    $(elem).closest(".placeholder").find("p.error").addClass("d-none");

    let type = $(elem).closest(".placeholder").prev().prop("tagName");

    if ( $(elem).val() == "" ) {
        $(elem).closest(".placeholder").find("p.error.one").html("Please enter a value.").removeClass("d-none");
        return console.log(" no value entered ");
    }

    function checkImage(url) {
        console.log( url.match(/^(http)s*/g) );
        if ( url.match(/^(http)s*:\/\//g) == null ) {
              $(elem).closest(".placeholder").find("p.error.one").html("Image does not exist. Please enter correct link.").removeClass("d-none");
              return console.log("invalid url");
        }

        $(elem).closest(".placeholder").find("p.error.one").html("Checking Image Link...").removeClass("d-none");

        try {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.send();
            request.onload = function() {
            status = request.status;
                if (request.status == 200) {
                    console.log(" image exists ");
                    $(elem).closest(".placeholder").find("p.error.one").html("Image Exists. Saving...").removeClass("d-none");
                    $(elem).closest(".webEditor").attr({lock: false});
                    $(elem).closest(".placeholder").prev().attr({ src : $(elem).val() });
                    saveSlide( $(elem).closest(".webEditor") );
                    $(elem).closest(".placeholder").find("p.error.one").html("Image Exists. Save Completed.").removeClass("d-none");
                } else {
                    $(elem).closest(".placeholder").find("p.error.one").html("Image does not exist. Please enter correct link.").removeClass("d-none");
                    console.log(" image does not exist" );
                }
            }
            request.onerror = function(val) {
                $(elem).closest(".placeholder").find("p.error.one").html("Image does not exist. Please enter correct link.").removeClass("d-none");
                console.log(" image does not exist " );
            }
        } catch (e) {
            $(elem).closest(".placeholder").find("p.error.one").html("Image does not exist. Please enter correct link.").removeClass("d-none");
            console.log(e);
        }
    }


    if (type == "IMG") {
        console.log( "check if this image src is valid or not" );
        $(elem).closest(".webEditor").attr({lock: true});
        checkImage( $(elem).val() );
        return;
    } else if (type == "A") {
        console.log( "Change Src to Href  also");
        $(elem).closest(".webEditor").attr({lock: false});
        $(elem).closest(".placeholder").prev().attr({ href : $(elem).val() });
    }
};

let saveSlide = function(elem, content) {


    if ( $(elem).attr("lock") == "true" ) {
        return console.log("webEditor is Locked");
    };

    console.log(" webEditor is not LOCKED");
    console.log(" saving slide ");

    if ( content == undefined ) {
        let temp;
        temp = $(elem).clone();
        temp.find("*").removeAttr("contenteditable");
        temp.find(".e").attr({onclick: temp.find(".e").attr("onclick").replace(/editable\(this\)/g, "") });
        temp.find(".placeholder").remove();
        content = temp.html();
    }

    return saveInput(elem, $(elem).attr("_id"), "webEditor", content);

};

let editable = function(elem) {

    $(elem).closest(".webEditor").attr({lock: "false"});
    console.log(" unlocked webEditor");

    let type = $(elem).prop("tagName");

    if ( $(elem).next().hasClass("placeholder") ) { 
        $(elem).next().remove();
        return console.log( "Placeholder is already placed next to this element" );
    };

    let absoluteOrRelative = function() {

        if ( $(elem).css("position") == "absolute" ) {

            console.log( "making placeholder absolute" );
            $(elem).next().css({position: "absolute"});

        }

    };

    switch (true) {
        case ( type == "IMG" ) :
            console.log("Upload an Image or ADD the source of img below");
            $(".placeholders > .img").clone().insertAfter( elem ).find("input:eq(0)").val( $(elem).attr("src") )
                .closest("p").next().find(".btn.white")
                .html( $(".btn.white").html() + ` ( ${ $(elem).css("width").match(/\d+/g) } x ${ $(elem).css("height").match(/\d+/g) } )` );
            absoluteOrRelative();
            break;
        case ( type == "A" ) :
            console.log("Add the SRC inpute below this button");
            $(".placeholders > .href").clone().insertAfter( elem ).find("input").val( $(elem).attr("href") );
            absoluteOrRelative();
            break;
        default: 
            break;
    }

};

var editor = CodeMirror(document.getElementById("editor"),{
    lineNumbers: true,
    lineWrapping: true,
    mode: "xml",
    htmlMode: true,
});

let toggleMode = function(elem) {

    $(elem).closest(".slide-editor").find(".placeholder").remove();
    $(elem).closest(".slide-editor").find(".slide").toggleClass("d-none").prev(".advanced-editor").toggleClass("d-none");

    if ( $(elem).closest(".slide-editor").find(".advanced-editor").hasClass("d-none") ) {
        $(elem).closest(".slide-editor").find(".slide").html( editor.getValue() );
        $(".slide-editor > .slide > div .e").attr({ onclick: "editable(this)" });
    } else {
        $(".slide-editor > .slide *").removeAttr("onclick contenteditable");
        let html = $(elem).closest(".slide-editor").find(".slide").html().replace(/^ +/gm, "");
        editor.setValue( html );
    }

};

