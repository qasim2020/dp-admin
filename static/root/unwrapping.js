let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
    <style type="text/css">

        p {
        color: blue
        }

        #juice {
            background: black;
            color: yellow;
        }

    </style>
</head>
<body>

    <p>Hi friend how are you. I hope things are good at your end</p>

    <script>

        let functionName = function() {
            console.log("this is my function");
        };

    </script>
    
</body>
</html>
`;

let string = html.match(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g);

let findCSSPart = function(string) {

    let cssTags = string.filter( val => {
        return val.trim().match( /<.*(\/style).*>|<(\s*style\s*.*)>$/g);
    });

    cssTags =  html.split(cssTags[0])[1].split(cssTags[1])[0];

    cssTags = cssTags.match(/[#.\w-,]+(?=\s*{)/g);
    return cssTags;

}

let findJSPart = function( string ) {

    let scriptTags = string.filter( val => {
        return val.trim().match( /<.*(\/script).*>|<(\s*script\s*.*)>$/g);
    });

    scriptTags =  html.split(scriptTags[0])[1].split(scriptTags[1])[0];

    return scriptTags.match(/[\w\s=(),]+(?={)/g).map(val => {
        val.replace('/^\s*[\\n]*\s*|\s*$/g', '');
        return val.trim();
    });

}

let css = findCSSPart(string);
let js = findJSPart(string);

console.table({
    css: css,
    js: js
});

string = string.map( (val, index)  => {

    let tag = val.replace(/^<\s*/g, "").split(/\s|>/g)[0];

    let findClosingTag = function(tag) {
        if ( tag.match(/ \/ /g ) != null ) return null;
        return html.match( `/${tag}` ) != null ? `</${tag}>` : null;
    }

    let getContent = function ( tag, closingTag ) {
        if ( closingTag == null ) return null;
        return html.split(val)[1].split(closingTag)[0];
    };

    let findCSS = function ( tag ) {

        // TODO: find possible matches for each val tag

        let possibleMatches = ["[type='text/css']", ".d-none", "#juice"];

        return css.filter( val => possibleMatches.includes(val) );

    };

    let findJS = function ( tag ) {

        // TODO: find possible matches for each val tag

        let possibleMatches = ["[type='text/css']", ".d-none", "#juice"];

    }

    let closingTag = findClosingTag(tag);
    let content = getContent(tag, closingTag);
    if ( closingTag == null ) return null;
    let connectedCSS = findCSS( tag );

    return {
        tagId: index+"-"+tag,
        content: content != null ? content.length : 0,  // TODO: Change this to content when final,
        connectedCSS: connectedCSS,
        connectedJS: true,
        childTagsLabels: true,
        namingConvention: true
    }
}).filter( val => val != null );


console.table(string);
