Before you go further. I wrote a whole 2 hour long "proud readme" that "Nate" my mob mate deleted (by mistake). I hate him for that. ❤️

Ok, this repo is good (I mean it - not because I came up with this idea sitting in the toilet!). I built it in over 2 years. So you will find important stuff here (if you dig). 

# Introduction

Playground is my self-built mini-CMS (e.g. Wordpress is a CMS), where I host my websites (I built for family + friends). Techstack includes Nodejs, MongoDB, Handlebars and Pjax. 

# Benefits
- CMS - Content Management System - Content is "data" and "modules". For example, "SendMail" module is written & maintained once, and it works for all your websites. Now next time you are building your next website, you do not need to copy paste the code. You just need to call this module, and it is available to you. Nice ;).
- It is easier to work on a single project (this CMS is one project). Code doesn't go lost in the void. Before building it, everytime I wrote something "to be proud of", some days later it just got lost in the `void`.
- Do all of that in 6 USD Digital Ocean droplet (I started with this benefit in mind, but now realise there are other ways too to save money - humbled).

# Connected Websites

- [7amuniforms.com](https://7amuniforms.com)
- [defence-properties.com](https://defence-properties.com)
- [nt.qasim.tech](https://nth.qasim.tech)
- [eh.qasim.tech](https://eh.qasim.tech)
- [qasim.tech](https://qasim.tech)
- [qasimali.xyz](https://qasimali.xyz)
- [dt.qasim.tech](https://dt.qasim.tech)
- [dedicatedparents.qasim.tech](https://dedicatedparents.qasim.tech)

# Kinds of request you can make to playground

- **Simple HTML request**: Provides a rendered website after fetching content from database. For example, [https://7amuniforms.com](https://7amuniforms.com) request goes to the NGINX file, that expands this url to [https://7amuniforms.com/7am/gen/page/landingPage/n](https://7amuniforms.com/7am/gen/page/landingPage/n) and responds back with a website.

- **Ajax request**: Provides only the data in JSON format when receiving an ajax request. For example, [https://7amuniforms.com/7am/gen/data/landingPage/n](https://7amuniforms.com/7am/data/page/landingPage/n) gives back the JSON file. In case, you do not want the html and only JSON, you can replace the word "page" with "data" and it will respond back with just the data.

- **Pjax request**: Provide Pjax (partial ajax) so that entire website is not loaded again when a filter is clicked somewhere. For example, [https://7amuniforms.com/7am/gen/page/kallesShop/n?school=Allied%20School&type=uniform](https://7amuniforms.com/7am/gen/pjax/kallesShop/n?school=Allied%20School&type=uniform) is a pjax request (yes, it has pjax word in the url). Also when you change the filter in the website, it will only reload the content, and not the entire page.

# How it works

All requests reaching the server are formatted in following syntax;

```
app.get(
'/:brand/:permit/:requiredType/:module/:input', 
replyFunction 
);
```

1. `:brand` is a brand's unique key. The website unique key (for example 7am) in this url :- [https://7amuniforms.com/7am/data/page/landingPage/n](https://7amuniforms.com/7am/data/page/landingPage/n).
2. `:permit` is the request authentication type. It has three types; gen, auth, admin. Gen is general level request. Auth is for owners of the website. And Admin is for the super admins. 
3. `:requiredType` is the type of request you are making to the website. It has three types also; page, data, and pjax. Page is when user wants the rendered website. Data is when user is looking only for the data (the JSON). and Pjax is when he is looking for a portion of the website. 
4. `:module` is the name of the module. For example, when sending mail, the `sendMail` module in the server is accessible. Just send the `email`, `mail text`, `email template` and it sends the email to website owner's email address (or ship a newsletters to many subscribers).
5. `:input` is the kind of input that you send to the module. For example `showBlog` module takes the `blog-slug` as its input. Slug is a unique identifier for each blog post in the database.

- `replyFunction` then constructs a webPage || a data object || a pjax page and returns the website to the client.


# ahh, if you have made this far
Leave a comment, some feedback, that you think can help me better this readme. I won't execute your feedback, until I am 100% convinced with your feedback.
