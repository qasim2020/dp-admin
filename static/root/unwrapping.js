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

string = string.map( val => {

    let tag = val.split(/<|>/g)[1];

    let checkClosingExists = function(tag) {
        console.log(tag);
        if ( tag.match(/ \/ /g) != null ) return null;
        return html.match(`/${tag}`) != null ? `</${tag}>` : null;
    }

    let checkChildTags = function ( tag, closingTag ) {
        return 'true';
    };

    let closingTag = checkClosingExists(tag);
    let childTags = checkChildTags( tag, closingTag );

    return {
        allTags: val,
        closingTag: closingTag,
        childTags: childTags
    }
})

console.table(string);
