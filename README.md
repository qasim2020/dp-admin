# Introduction
Playground is my server side nodejs code that is serving following websites. This means that a single droplet on Digital Ocean can be used to serve multiple websites. It is only Nodejs, MongoDB, Handlebars and Pjax. There is no React or similar framework.
- [7amuniforms.com](https://7amuniforms.com)
- [defence-properties.com](https://defence-properties.com)
- [nt.qasim.tech](https://nth.qasim.tech)
- [eh.qasim.tech](https://eh.qasim.tech)
- [qasim.tech](https://qasim.tech)
- [qasimali.xyz](https://qasimali.xyz)
- [dt.qasim.tech](https://dt.qasim.tech)

# Kinds of request you can make to playground
- **simple html request**: Provides a rendered website after fetching content from the database 
- **ajax request**: Provides only the data in JSON format when receiving an ajax request.
- **pjax request**: Provide pjax so that entire website is not loaded again e.g in filters when a new filter is selected it makes a pjax request to the server and server (playground) responds only with pjax content.

# How it works
All requests reaching the server are formatted in following syntax;

`app.get(  '/:brand/:permit/:requiredType/:module/:input', replyFunction );`

`replyFunction` in above url, checks the brand, permit, requiredType, module, input and additional queries. 

It then forwards the request to the required module. 

All modules are listed in a separate object called as `moduleRole` which lists each module's authentication type (gen, auth or admin level).

After fetching the data from database, structuring the data, a data object is returned from the module.

`replyFunction` then constructs a webPage or a data object or a pjax page and returns it to the client.

# Benefits
- One place to maintain all your projects instead of losing your code every now an then. I still miss thousands of lines of code I wrote before this project.
- One droplet ocean to run all websites. I pay only 6 USD per month to keep all my websites functional.

# Conclusion
I hope this project has tips for you to better organise your code.
