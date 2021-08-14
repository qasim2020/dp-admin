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
        console.log( tag, val);
    };

    let closingTag = findClosingTag(tag);
    let content = getContent(tag, closingTag);
    if ( closingTag == null ) return null;
    let connectedCSS = findCSS( tag );

    return {
        tagId: index+"-"+tag,
        content: content != null ? content.length : 0,  // TODO: Change this to content when final,
        connectedCSS: true,
        connectedJS: true,
        childTagsLabels: true,
        namingConvention: true
    }
}).filter( val => val != null );

console.table(string);
