// natural_therapy
// tech-portfolio
// life - portfolio website
// testing change
// dedicatedparents

const DatauriParser=require("datauri/parser");
const parser = new DatauriParser();
const fileUpload = require('express-fileupload');
const Airtable = require('airtable');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const directoryPath = path.join(__dirname, '');
const express = require('express')
const hbs = require('hbs')
const app = express();
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { WebClient } = require('@slack/web-api');
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const nodemailer = require('nodemailer');
const mailHbs = require('nodemailer-express-handlebars');
const axios = require('axios');

var qpm = require('query-params-mongo');
let getObjectId = function(val) {
    return mongoose.Types.ObjectId(val);
};
var processQuery = qpm({
    autoDetect: [
        { fieldPattern: /_id$/, dataType: 'objectId' },
        { fieldPattern: /orderNo$/, dataType: 'string' },
    ],
    converters: {objectId: getObjectId }
});


var cloudinary = require('cloudinary').v2;
var env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  var config = require('./config000.json');
  var envConfig = config[env];
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });
}

const web = new WebClient();

app.use(
  fileUpload({
    createParentPath: true
  }),
  session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 20 * 60 * 1000,
    },
    rolling: true,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    })
  }),
  express.static(__dirname+'/static'),
  passport.initialize(),
  passport.session(),
  flash(),
  function(req, res, next) {
    if (req.headers.accept != process.env.test_call) 
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  },
  bodyParser.json({limit: '50mb'}),
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 1000000
  })
);

mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true, 
}, function(err) {
  if (err) { 
      console.log(err);
    console.log('Unable to connect to the server. Please start the server.');
  } else {
    console.log('Connected to Server successfully!');
  }
});

cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key: process.env.cloudAPI,
  api_secret: process.env.cloudAPISecret
});

let schema = {
    name: {
        type: "String",
        required: true,
    },
    brand: {
        type: "String",
        required: true,
    },
    redirect: {
        type: "String",
        required: false
    },
    properties: {
        type: "Object",
        required: true,
    },
    airtable: {
        type: "Object",
        required: false
    }
};

let Collections = mongoose.model('collections', new mongoose.Schema(schema));

hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('desiPrice', (val) => {
      var val = Math.abs(val)
      if (val >= 10000000) {
        val = (val / 10000000).toFixed(2) + ' Cr';
      } else if (val >= 100000) {
        val = (val / 100000).toFixed(2) + ' Lac';
      }
      return val;
});

hbs.registerHelper('pickRandomColor', (val) => {
    let array = [ "lightblue", "pink" , "lavender" , "lightskyblue", "lightgoldenrodyellow" , "lightgreen", "beige" , "#f0dbeb" , "#c9eeeb" , "#f0d0a0" ];
    let randomNo = Math.floor(Math.random() * 4); 
    return array[randomNo];
})

hbs.registerHelper('inc', (val) => {
    return Number(val)+1;
});

// unformatted date and time
hbs.registerHelper('mongoIdToDate', (objectId) => {
    return new Date(parseInt(objectId.toString().substring(0, 8), 16) * 1000);
});

// formatted 0718 hrs · 9 Apr 22
hbs.registerHelper('getFormattedDateTimeMongoId', (objectId) => {
    if ( objectId == null ) return null;
    let date = new Date(parseInt(objectId.toString().substring(0, 8), 16) * 1000);
    let dtg = date.toString().split(" ");
    let obj = {
        time: dtg[4],
        date: dtg[2],
        month: dtg[1],
        yr: dtg[3]
    }
    let time = obj.time.split(":");
    obj.time = time[0]+time[1]+ " hrs";
    return `${obj.time} · ${obj.date} ${obj.month} ${obj.yr.slice(2,4)}`;
});

hbs.registerHelper('breaklines', (val) => {
  return val.split(/\n/g).join('<br>');
})

hbs.registerHelper('startWithUpperCase', (val) => {
    return val.charAt(0).toUpperCase() + val.slice(1)
});

hbs.registerHelper('toUpperCase', (str) => {
    return str.toUpperCase()
});

hbs.registerHelper('toLowerCase', (str) => {
    return str.toLowerCase()
});

hbs.registerHelper('checkExists', (val) => {
    return val != undefined ? 'true' : '';
})

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

hbs.registerHelper('matchValues', (val1,val2) => {
    console.log(val1, val2);
    try {
        return val1.toString().toLowerCase()  == val2.toString().toLowerCase();
    } catch(e) {
        return false;
    }
});

hbs.registerHelper('removeSpaces', (val) => {
    return val.replace(/ /gi,'');
});

hbs.registerHelper('removeStartSpaces', (val) => {
    return val.replace(/ */g,'')
});

hbs.registerHelper('match', function(val1,val2) {
  return val1.toUpperCase() == val2.toUpperCase() ? true : false;
})

hbs.registerHelper('getDateForInput', function(val) {
    let date = new Date(val);
    let formatted = 
        date.getFullYear() + '-' + 
        ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + 
        ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate()));
    return formatted;
});

hbs.registerHelper('getTimeForInput', function(val) {
    return val.match(/.{2}/g).join(":");
});

hbs.registerHelper('getDatePickerValue', function(val) {
    let date = new Date(val);
    let formatted = 
        date.getFullYear() + '-' + 
        ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + 
        ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + 
        'T' +
        ((date.getHours() > 9) ? date.getHours() : ('0' + date.getHours())) + ":" + 
        ((date.getMinutes() > 9) ? date.getMinutes() : ('0' + date.getMinutes())) ;
    return formatted;
});

hbs.registerHelper('split0', (val) => {
    try {
    let output =  val.split(' ')[0] == undefined ? val : val.split(' ')[0] ;
    return output;
    } catch(e) {
        return val
    }
});

hbs.registerHelper('split1', (val) => {
    try {
        let output =  val.split(' ')[1] == undefined ? val : val.split(' ')[1] ;
        return output;
    } catch(e) {
        return val
    }
});

hbs.registerHelper('split2', (val) => {
    try {
        let output =  val.split(' ')[2] == undefined ? val : val.split(' ')[2] ;
        return output;
    } catch(e) {
        return val
    }
});

hbs.registerHelper('split', (val) => {
    let output = val.split(' ');
    return output;
});

hbs.registerHelper('splitComma', (val) => {
    // console.log({val});
    let output = val.split(',').map(val => val.trim() );
    return output;
});

hbs.registerHelper('collectionToWord', (string) => {

    string = string.match(/-/g) ? string.split('-')[1] : string;
    return string.charAt(0).toUpperCase() + string.slice(1); 

});

hbs.registerHelper('camelToWord', (string) => {

    string = string.charAt(0).toUpperCase() + string.slice(1);
    return string.replace(/([a-z](?=[A-Z]))/g, '$1 ');

});

hbs.registerHelper('matchToCollection', function(val1,val2,val3) {
    return val1 == `${val2}-${val3}`;
});

hbs.registerHelper('checkHtmlString', function(val) {
    return /<\/?[a-z][\s\S]*>/i.test(val);
});

hbs.registerHelper('countArray', function(val) {
    let output = val == undefined ? 0 : val.length;
    return output;
});

hbs.registerHelper('multiply', function(one, two) {
    return Number(one) * Number(two);
});

hbs.registerHelper('trim', function(val) {
    return val.trim();
});

hbs.registerHelper('calcTotalPrice', function(cart) {
    let eachPrice = cart.map( val => Number(val.quantity) * Number(val.product.sale_price || val.product.price) );
    let totalPrice = eachPrice.reduce( (total, val, key) => total += val, 0 );
    // console.log(eachPrice, totalPrice);
    return totalPrice;
});

hbs.registerHelper('getDay', function(date) {
    let input = new Date(date);

    return input.getDate();
});
hbs.registerHelper('getMonth', function(date) {
    let input = new Date(date);
    let months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    return months[input.getMonth()];
});
hbs.registerHelper('getYear', function(date) {
    let input = new Date(date);
    return input.getFullYear();
});
hbs.registerHelper('reduceStringLength', function(string, length) {
    return string.substring(0, length);
});

app.use('/:brand/:permit/:requiredType/:module/:input', async (req,res,next) => {

    if (myFuncs['moduleRole'][req.params.module] == 'gen') return next();
    
    if ( req.session && req.session.hasOwnProperty('person') ) {
        switch (true) {
            // Logged In User can watch all auth modules
            case (myFuncs.moduleRole[req.params.module] == 'auth'):
                return next();
            // Admin == Admin && root == root
            case (myFuncs["moduleRole"][req.params.module] == 'admin' && req.session.person.role == 'auth'): 
                return res.send('you are trying to access admin page while your role is auth only');
                break;
            // Auth is accessing an auth role
            case (
                req.session.person.role == "auth", 
                req.params.permit == "auth", 
                myFuncs["moduleRole"][req.params.module] == "auth"
            ) :
                console.log(`
                request type = ${req.params.permit}
                user role = ${req.session.person.role}
                module role = ${myFuncs["moduleRole"][req.params.module]}
                `);
                return next();
                break;
            // Admin is accessing and it is his own brand
            case (
                req.session.person.role == req.params.permit && 
                req.session.person.brand.split(",").some( val => val.trim() == req.params.brand ) 
            ) :
                return next();
                break;
            // 'Auth' role tries to access 'Admin' Module
            default :
                // console.log(req.session);
                return res.status(400).send('you are not authorized to make this request');
                break;
        };
    };
    
    let collectionsSavedCheck = await Collections.findOne({name: "collections"}).lean();
    if (collectionsSavedCheck == undefined) {
        let data = {
            name: 'collections',
            brand: 'myapp',
            properties: schema,
        };
        let output = await myFuncs.save(Collections,data);
        return next();
    };

    let checkCollectionExists = await myFuncs.checkCollectionExists(`${req.params.brand}-users`);

    if (checkCollectionExists) {
        if (req.params.requiredType != "page" && req.params.requiredType != "pjax") return res.status(404).send("sign in is required or may be module does not exist");
        return res.redirect(`/${req.params.brand}/gen/page/landingPage/n/`);
    };
    
    checkCollectionExists = await myFuncs.checkCollectionExists(`myapp-users`);

    if (checkCollectionExists) {
        return res.redirect(`/${req.params.brand}/gen/page/landingPage/n/`);
    };
    // console.log(chalk.bold.yellow('All checks completed moving to admin route!'));
    next();
});

let openBrand = async (req,res) => {
    if (req.params.brand.indexOf('.') > 0) {
        return res.status(300).send('Sorry, this url contains a dot which is a wrong attempt. Haha keep trying..');
    };

    return res.redirect(`/${req.params.brand}/gen/page/landingPage/n`);
};

let openAdmin = async (req,res) => {
    return res.redirect(`/${req.params.brand}/admin/page/landingPage/n`);
};

let replyFunction = async (req,res) => {

    try {
        req.params.theme = await myFuncs.getThemeName(req.params.brand);
        let data = await myFuncs[req.params.module](req,res);
        myFuncs.respond(data,req,res);
    } catch(e) {
        console.log(e);
        res.status(e.status || 400).send(e);
    }

};

app.get(  '/:brand/:permit/:requiredType/:module/:input', replyFunction );
app.post( '/:brand/:permit/:requiredType/:module/:input', replyFunction );
app.get(  '/:brand', openBrand);
app.get(  '/:brand/admin', openAdmin);
app.get(  '/', async (req,res) => {
    // HERE ADD THE NEW APP YOU ARE WORKING ON
    console.log("MY APP - WELCOME");
    return res.status(200).render('root/showApps.hbs',{
        apps: [ 
            { name: 'My App', url: 'myapp' },
            { name: '7am', url: '7am', },
            { name: 'trends', url: 'trends', },
            { name: '30 Days Challenge', url: 'challenge', },
            { name: 'life', url: 'life' },
            { name: 'tech', url: 'tech', },
            { name: 'richpakistan', url: 'richpakistan' },
            { name: 'chodhry', url: 'chodhry' },
            { name: "natural_therapy", url: "natural_therapy" },
            { name: "easy_heal", url: "easy_heal" },
            { name: "duty", url: "duty" },
            { name: "dedicated_parents", url: "dedicated_parents"}
        ]
    });
});

let myFuncs = {

    respond: async function(data,req,res) {

        if( data && data.hasOwnProperty("error")) {
            return res.status(data.status).send(data.error);
        };

        let getOwnerContactDetails = async function(req,res) {

            let model = await myFuncs.createModel("myapp-themes");
            let model2 = await myFuncs.createModel("myapp-users");

            let output = {}, result = {};

            output.brand = await model.findOne({brand: req.params.brand}).lean();
             
            result = {
                brand: output.brand && output.brand.name,
                brandName: output.brand && output.brand.brandName,
                brandWebsite: output.brand && output.brand.brandWebsite,
                brandLogo: output.brand && output.brand.brandLogo, 
                mobile: output.brand && output.brand.brandMobile,
                email: output.brand && output.brand.brandEmail,
                loc: output.brand && output.brand.brandGooglePin,
                brandDesc: output.brand && output.brand.brandDesc,
                brandMetaImg: output.brand && output.brand.brandMetaImg
            };

            return result;

            output.person = await model2.aggregate([
                {
                    $match: {
                        "email": req.session && req.session.person && req.session.person.email,
                    }
                },{
                    $addFields: {
                        "brands" : {
                            $split: ["$brand", ","]
                        }
                    }
                },{
                    $unwind: "$brands"
                },{
                    $addFields: {
                        brands: {
                            $trim: {
                                input: "$brands"
                            }
                        }
                    }
                },{
                    $lookup: {
                        from: "myapp-themes",
                        localField: 'brands',
                        foreignField: 'brand',
                        as: 'brands'
                    }
                },{
                    $group: {
                        _id: {
                            "_id": "$_id",
                            "name" : "$name",
                            "email" : "$email",
                            "mobile" : "$mobile",
                            "role" : "$role",
                            "brand" : "$brand"
                        },
                        brands: {
                            $addToSet: "$brands"
                        }
                    }
                },{
                    $project: {
                        "name" : "$_id.name",
                        "email" : "$_id.email",
                        "mobile" : "$_id.mobile",
                        "role" : "$_id.role",
                        "brandsString" : "$_id.brand",
                        "brands" : "$brands",
                        "_id" : "$_id._id",
                    }
                }
            ]);

            result = {
                person: output.person[0],
                brand: output.brand && output.brand.name,
                brandName: output.brand && output.brand.brandName,
                brandWebsite: output.brand && output.brand.brandWebsite,
                brandLogo: output.brand && output.brand.brandLogo, 
                mobile: output.brand && output.brand.brandMobile,
                email: output.brand && output.brand.brandEmail,
                loc: output.brand && output.brand.brandGooglePin,
                brandDesc: output.brand && output.brand.brandDesc,
                brandMetaImg: output.brand && output.brand.brandMetaImg
            };

            return result;

        };

        try {

            Object.assign(data, {
                permit: req.params.permit,
                brand: req.params.brand,
                input: req.params.input,
                owner: await getOwnerContactDetails(req,res),
                requiredType: req.params.requiredType,
                theme: await this.getThemeName(req.params.brand),
                query: req.query
            });

        } catch(e) {
            console.log(e)
        }

        let storeThisFileInSession = async function() {

            req.session.file = await new Promise( (resolve, reject) => {

                fs.readFile(`./views/${req.params.theme}/${req.params.module}.hbs`, 'utf8', (err, data) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve( data );
                });

            }); 

            return 1;

        };

        console.log( chalk.bold.red('') ); 
        console.log( chalk.bold.red('—————————————————') ); 
        console.log( chalk.bold.red('sending data start') ); 
        console.log(data);
        console.log( chalk.bold.red('sending data end') ); 
        console.log( chalk.bold.red('—————————————————') ); 
        console.log( chalk.bold.red('') ); 


        switch(true) {
          case (req.query.hasOwnProperty('redirect')):
            let url = 
            `/${req.params.brand}/${req.params.permit}/${req.params.requiredType}/${req.query.redirect}/${req.query.redirectInput}`;
            if (data.msg && data.msg.length > 0) url += `?msg=${data.msg}`;
            return res.redirect(url);
            break;
          case (req.params.requiredType == 'data'):
            return res.status(200).send(data);
            break;
          case (req.params.hasOwnProperty('pageName')): 
            return res.status(200).render(`${req.params.theme}/${req.params.pageName}.hbs`,{data});
            break;
          case (req.headers['x-pjax'] == 'true'):
            return res.status(200).render(`${req.params.theme}/pjax/${req.params.module}.hbs`,{data});
            break;
          case ( req.query.hasOwnProperty('webEdit') && req.query.webEdit == "true" && req.session.hasOwnProperty('person') ):
            storeThisFileInSession();
            return res.status(200).render(`${req.params.theme}/${req.params.module}.hbs`,{data, webEdit: true});
            break;
          case (req.params.requiredType == 'email'):
            return res.status(200).render(`emails/${req.params.module}.hbs`,{data});
            break;
          default:
            // console.log(data);
            return res.status(200).render(`${req.params.theme}/${req.params.module}.hbs`,{data});
            break;
        }
    },

    moduleRole: {
        respond: 'admin',
        runAndRedirect: 'gen',
        newDocument: 'admin',
        editDocument: 'admin',
        deleteDocument: 'auth',
        deleteDocumentAuth: "auth",
        checkCollectionExists: 'admin',
        createModel: 'admin',
        airtablePull: 'admin',
        mergeDataIntoCollection: 'admin',
        save: 'admin',
        dropCollection: 'admin',
        createNewCollection: 'admin',
        saveSequence: 'auth',
        updateSequence: 'auth',
        newDashboard: 'auth',

        showCollection: 'admin',
        destroySession: 'auth',
        checkAdmin: 'admin',
        signin: 'gen',
        checkSignIn: 'gen',
        signup: 'gen',
        createSignUp: "gen", 
        sendVerificationEmail: "auth", 
        verifyEmailChallenges: "gen", 
        saveProfileData: "auth", 

        home: 'auth',
        landingPage: 'gen',
        searchItems: 'gen',
        cartPage: 'gen',
        getMongoId: 'gen',
        reviewCartPage: 'gen',
        updateCart: 'gen',
        removeItemFromCart: 'gen',
        orderReceiptPage: 'gen',
        profilePage: 'gen',
        createOrder: 'gen',
        findOrderPage: 'gen',
        itemPage: 'gen',
        saveItemInCart: 'gen',
        mongoQueries: 'gen',
        showOrders: 'admin',
        getSizes: 'gen',
        showProperty: "gen",
        showPage: 'gen',
        updatePage: 'auth',
        dashboard: 'admin',
        forgotpw: 'gen',
        challenges: 'auth',
        profile: 'auth',
        openChallenge: 'auth',
        
        // life - portfolio
        dashboardBlogs: 'admin',
        addNewBlog: 'admin',
        saveBlog: 'admin',
        openBlog: 'gen',
        subscribeCustomer: 'gen',
        verifyEmail: 'gen',
        runTimer: 'admin',
        unsubscribeMe: 'gen',
        showNewsletter: 'gen',
        downloadCSVFile: 'gen',
        blogStreak: 'gen',
        blogs: 'gen',
        services: "gen",
        vlogs: "gen",
        fetchAirtable: 'gen',
        updateManyByKey: "admin",
        roadMap: 'gen',
        newsletters: 'gen',
	listenToWebhook: 'gen',
        subscribe: "gen", 
        postComment: "gen",
        deleteComment: "gen",

        editWeb: 'admin',
        emptyFile: 'admin',
        showAll: 'auth',
        filterProperties: 'gen',
        propertyAdminForm: 'auth',
        propertyGenForm: 'gen',
        showPages: 'gen',
        editPage: 'auth',
        drawForm: "auth", 
        saveInSession: "gen",
        offlineRequired: "gen",
        ticketAndMail: 'gen',
        showTicket: 'gen',
        showTickets: 'auth',
        changeTicketStatus: 'gen',
        showSlides: 'auth',
        saveSlide: 'auth',
        changeSlideSequence: 'auth',
        uploadCloudinary: "auth",
        updateDocument: "auth",
        updateDocumentAuth: "auth",
        importAndMerge: "auth",
        storeHTML: "admin",
        fetchCollectionData: "auth",
        saveImgInArray: "auth",
        deleteImgInArray: "auth",
        deleteImgInCloudinary: "auth",
        saveItemInArray: "auth",
        deleteItemInArray: "auth",
        receipt: "gen",

        kallesShop: "gen", 
        kallesQuickView: "gen",
        kallesCartUpdate: "gen",
        kallesRemoveCartItem: "gen",
        kallesShoppingCart: "gen", 
        kallesChangeCartQty: "gen",
        kallesCheckOut: "gen",
        kallesCartReplaceItem: "gen",
        kallesLoadMore: "gen",
        kallesPlaceOrder: "gen",
        kallesUpdateOrder: "admin",
        kallesSendNote: "gen", 
        kallesProduct: "gen",
        kallesBlogs: "gen",
        kallesBlog: "gen",
        kallesFindOrder: "gen",
        
        showReceipt: "gen", 
        showOrder: "auth",
        editOrder: "auth", 
        sendReceiptToEmail: "gen",
        sendMsgToEmail: "gen", 
        saveSlackAPI: "auth",
        sendReceiptToSlack: "auth", 
        testPlaceOrder: "auth", 

        readFromJSON: "admin", 
        getJSONFile: "admin", 

        telegramBot: "gen", 

        change_lang: "gen", 

        // tech-portfolio
        portfolio: "gen",
        // natural_therapy
        documentation: "gen",
        // duty
        dutyDashboard: "auth",
        getSummaryOfTasks: "gen", 
        userSignedUp: "gen",
        userChangedPw: "gen", 
        sendRecoveryCode: "gen", 
        storeTelegramId: "auth", 
        sendDutySummaryOnTelegram: "auth",
        deleteMyAccount: "auth",

        // dedicatedparents
        d_pevents: "gen",
        d_pevent: "gen",
        d_pstaffs: "gen",
        d_pstaff: "gen",
        d_pcauses: "gen",
        d_pcause: "gen",
        d_pblogs: "gen",
        d_pblog: "gen",
        d_ppages: "gen",
        d_ppage: "gen",
        d_pcontact: "gen",
        draftEmail: "gen",
        saveDraftEmail: "auth", 
        shipEmail: "auth", 
        logOfEmail: "auth", 
    },

    shipEmail: async function(req, res) {
        req.params.theme = "root";
        let model = await this.createModel(`${req.params.brand}-subscribers`);
        let list = await model.distinct("list").lean();
        let arr = [];
        await list.forEach( async (val) => {
            arr.push({
                list: val, 
                emails: await model.find({list: val, isUnsubscribed: "false"}).lean()
            });
        });
        console.log("Here shoing the arr");
        return {
            list, 
            listData: arr
        }
    }, 

    // Sending newsletter one by one from the front-end side
    sendNewsletter: async function(req,res) {

        if ( !(req.body.hasOwnProperty("email")) ) return {
            error: "Bad request. Email is a must parameter.",
            status: 404
        };

        let model;

        if ( !(req.session.newsletter && req.session.newsletter._id == req.body.id) ) {

            let output;
            model = await this.createModel(`${req.params.brand}-newsletters`);
            output = await model.findOne({_id: req.body.id}).lean();
            req.session.newsletter = output;
            console.log( chalk.bold.red( "Creating a new session of newsletter") );

        } else {

            console.log( chalk.bold.green( "Newsletter old session in use") );

        };

        let person ;

        model = await this.createModel(`${req.params.brand}-subscribers`);
        person = await model.findOne({email: req.body.email}).lean();
        
        if (person == undefined) {
            return {
                status: 400,
                error: req.body.email + " not found in database"
            }
        };

        let sentMail = await this.sendMail({
                type: "database", 
                from: process.env.zoho, 
                context: {
                    firstName: person.firstName, 
                    lastName: person.lastName, 
                    _id: person._id, 
                    env: process.env.url, 
                    email: person.email,
                }, 
                toEmail: req.body.email, 
                msg: req.session.newsletter.body, 
                subject: req.session.newsletter.subject, 
                brand: req.params.brand
        });

        let logModel = await this.createModel(`${req.params.brand}-log`);
        let logEntry;

        if (sentMail.hasOwnProperty("accepted")) {

            logEntry = await logModel.create({
                status: 200, 
                text: `Email ${req.session.newsletter.slug} sent to ${sentMail.accepted[0]}`, 
                meta: JSON.stringify(sentMail)
            });
            
            return {
                status: 200,
                text: "Email sent", 
                email: sentMail.accepted[0], 
                list: person.list
            };

        } else {

            logEntry = await logModel.create({
                status: 400, 
                text: `Failed! ${req.session.newsletter.slug} sending to ${sentMail.accepted[0]}`, 
                meta: JSON.stringify(sentMail)
            });
            
            return {
                status: 400, 
                error: "Email not sent"
            };
        };

    }, 

    logOfEmail: async function(req, res) {
        let model = await this.createModel(`${req.params.brand}-log`);
        let output = await model.find().sort({_id: -1}).lean();
        req.params.theme = "root";
        return {
            log: output
        };
    }, 

    saveDraftEmail: async function(req, res) {

        let model = await this.createModel(`${req.params.brand}-newsletters`);
        let output = await model.findOneAndUpdate({ _id: req.params.input}, {$set: req.body}, {upsert: true});
        req.session.newsletter = output;
        return {
            success: output
        }

    }, 

    draftEmail: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-newsletters`);
        let output = await model.findOne({_id: req.params.input});
        req.params.theme = "root";
        return {
            output: output
        };

    },

    newDashboard: async function(req,res) {

        req.params.theme = "root";
        req.params.module = req.headers['x-pjax']  == 'true' ? req.params.input : "newDashboard";
        
        let output = {};
        let model ;

        if (req.params.input.match(/-/g) == null) {

            switch (true) {
                case (req.params.input == "tickets"):
                    output = {tickets: [1,2,3]};
                    break;
                case (req.params.input == "settings"):
                    model = await this.createModel(`myapp-themes`);
                    output.themeDetails = await model.findOne({brand: req.params.brand}).lean();
                    output.settings = {success: true};
                    req.params.module = req.headers['x-pjax']  == 'true' ? "rootSettings" : "newDashboard";
                    break;
                case (req.params.input == "orders"):
                    model = await this.createModel(`${req.params.brand}-orders`);
                    output.orders = await model.find().lean();
                    req.params.module = req.headers['x-pjax']  == 'true' ? "kallesOrders" : "newDashboard";
                    break;
            };

        } else {

            let collectionsTable = await Collections.find({brand: req.params.brand}).lean();

            if (collectionsTable.length == 0) return {
                status:200, 
                success: 'no Collection exists yet. Try starting the app with basic configurations.',
                brand: req.params.brand
            };

            req.params.input = req.params.input == 'n' ? `${req.params.brand}-users` : req.params.input;

            let requestedCollection = collectionsTable.find(val => val.name == req.params.input);

            let collectionHeadings = Object.keys(collectionsTable.find(val => val.name == req.params.input).properties);

            collectionHeadings.unshift('_id');

            collectionHeadings = collectionHeadings.filter( val => val != "fixed" && val != "noClone" );

            model = await this.createModel(req.params.input);

            let dataRows = await model.find().sort({ser: 1}).collation({locale: "en_US", numericOrdering: true}).lean();

            let newRows = [], newHeadings = [];

            if ( dataRows.length == 0 ) {

                let total = [], temp, property;

                for (i=0; i<collectionHeadings.length; i++) {

                    switch (true) {

                        case (collectionHeadings[i] == '_id'):

                            property = {
                                html: "brick",
                                type: "String"
                            };
                            break;

                        case (collectionHeadings[i] == 'properties'):

                            break;

                        case (collectionHeadings[i] == /fixed|noClone/g):

                            break;

                        default:

                            property = requestedCollection.properties[collectionHeadings[i]];

                    }

                    total.push({
                        meta: property
                    });

                }

                for (i=0; i<collectionHeadings.length; i++) {

                    newHeadings[i] = {
                        val: collectionHeadings[i],
                        meta: total[i].meta
                    };

                };

            } else {

                newRows = dataRows.map(val => {

                    let total = [], temp, property, attributes;

                    for (i=0; i<collectionHeadings.length; i++) {


                        console.log("COLLECTION HEADINGS");
                        attributes = requestedCollection && requestedCollection.properties[collectionHeadings[i]] || false;

                        switch (true) {

                            case (collectionHeadings[i] == '_id'):

                                temp = val[collectionHeadings[i]];
                                property = {
                                    html: "brick",
                                    type: "String"
                                };
                                break;

                            case (attributes && attributes["html"] == "link"):

                                temp = attributes["link"] + val._id;
                                property = requestedCollection.properties[collectionHeadings[i]];
                                break;

                            case (collectionHeadings[i] == 'properties'):

                                temp = JSON.stringify(val[collectionHeadings[i]]);
                                break;

                            case (collectionHeadings[i] == /fixed|noClone/g):
                                break;

                            default:

                                temp = val[collectionHeadings[i]];
                                property = requestedCollection.properties[collectionHeadings[i]];
                                Object.assign(property, {
                                    key: collectionHeadings[i]
                                });

                        }

                        total.push({
                            val: temp,
                            meta: property
                        });

                    }

                    return {

                        array: total,
                        object: val,
                        fixed: val.ser && val.ser.trim() == "1" ? "true" : val.fixed, 
                        noClone: val.noClone

                    };
                });

                for (i=0; i<collectionHeadings.length; i++) {

                    newHeadings[i] = {
                        val: collectionHeadings[i],
                        meta:  newRows[0] && newRows[0].array[i].meta
                    };

                };


            };

            req.params.module = req.headers['x-pjax']  == 'true' ? "rootTable" : "newDashboard";

            let thisCollection = await Collections.findOne({name: req.params.input}).lean();

            output = {
                schema: collectionsTable.find(val => val.name == req.params.input).properties,
                th: newHeadings,
                dataRows: newRows,
                modelName: req.params.input,
                airtable: {
                    basePin: thisCollection.airtable && thisCollection.airtable.baseId,
                    baseAPIKey: thisCollection.airtable && thisCollection.airtable.baseAPIKey,
                    tableName: thisCollection.airtable && thisCollection.airtable.tableName
                }
            };
                

        };

        model = await this.createModel(`${req.params.brand}-notifications`);
        let notifications = {
            count: await model.countDocuments({status: 'unread'}),
            texts: await model.find({status: 'unread'})
        };

        model = await this.createModel("myapp-themes");
        let myTheme = await model.findOne({brand: req.params.brand}).lean();

        Object.assign(output, {
            modules: myTheme.modules,
            collections: myTheme.collections,
            notifications: notifications,
            input: req.params.input
        });

        return output;

    },

    listenToWebhook: function(req,res) {

        if (req.body && req.body.event) {
            if (req.body.event.hasOwnProperty("attachments") == false) return {
                status: 300,
                msg: "This is not related to Airtable",
            };

            const titleRegex = /https:\/\/airtable\.com\/(?<tableId>.*)\/(?<recordId>.*)/;

            let data = req.body.event.attachments.map( val => {
                return {
                    text: req.body.event.text,
                    recordId: val.title_link.match(titleRegex).groups.recordId
                }
            });

            this.syncFromAirtableToLocal({ data: data , brand: req.params.brand });

            return {
                status: 200,
                msg: "Successfully executed this request"
            };

        }

        return {
                status: 200,
                msg: "Receieved the message successfully",
                challenge: req.body.challenge
        }

    },

    syncFromAirtableToLocal: async function({ data, brand }){

        //console.log(data, brand);

        // ONLY OPEN BELOW WHEN TESTING IN DEV MODE

        // data = [
        //     {
        //         text: 'Qasim Ali updated 4 records in table *newsletters* in Blogs',
        //         recordId: 'recfsZkbT6qb2m0K1',
        //     },
        //     {
        //         text: 'Qasim Ali updated 4 records in table *newsletters* in Blogs',
        //         recordId: 'reckvEh0g60z5q32s',
        //     },
        //     {
        //         text: 'Qasim Ali updated 4 records in table *newsletters* in Blogs',
        //         recordId: 'recezyFl4wuxa69O0',
        //     },
        //     {
        //         text: 'Qasim Ali updated 4 records in table *newsletters* in Blogs',
        //         recordId: 'rec5NMmBoLMc3IEOf',
        //     }
        // ];

        // brand = 'life';

        // ------------------------------
        let create_models = async (data, brand) => {

            let onlyTexts = data.map( val => val.text );

            uniq = [...new Set(onlyTexts)];

            let models = await Promise.all( uniq.map( val => {

                let name = brand + '-' + val.split('*')[1];
                
                return myFuncs.createModel(name);

            }) );

            uniq = uniq.map( (val,index) => {
                return {
                    text: val,
                    model: models[index]
                }
            });


            data = data.map( val => {

                val.model = uniq.find( uni => uni.text == val.text ).model;

                return val;

            });

            return data;

        };

        data = await create_models( data, brand );

        let pipe_airtable_upload = async (record) => {

            let collectionName = brand + '-' + record.text.split('*')[1];
            //console.log({collectionName});
            let airtableURLs = ( await Collections.findOne({name: collectionName}).lean() ).airtable;

            if (airtableURLs == undefined) {

                // //console.log( chalk.bold.bgYellow.black( "DATA IS NOT CONNECTED WITH AIRTABLE" ) ); 

                return { msg: "Data not connected to Airtable" };

            }

            let airtableRecord = await this.axiosRequest({
                // URL: https://v1.nocodeapi.com/punch__lines/airtable/EKBsTHngHjQgCFJp?tableName=All&id=recKQ7nDXFx75VrE8
                URL: airtableURLs.get + '&id=' + record.recordId,
                method: 'GET'
            });

            // //console.log( airtableRecord.data );

            let remoteData = airtableRecord.data.fields;

            //console.log( remoteData );

            // let storeNow = await record.model.findOne({ [airtableURLs.key]: remoteData[airtableURLs.key] }).lean();

            let storeNow = await record.model.findOneAndUpdate({ [airtableURLs.key]: remoteData[airtableURLs.key] }, remoteData, { new: true });

            //console.log( storeNow[airtableURLs.key], remoteData[airtableURLs.key] );

            return { msg: remoteData[airtableURLs.key] + ' — Updated locally' }

        };

        let output = await Promise.all( data.map( val => pipe_airtable_upload( val ) ) );

        let send_note_telegram = async ( records ) => {

            let data = {
                0 : `${records.length} x records have been updated in Airtable`
            };

            data = Object.assign( data, 
                records.reduce( (total, val, index) => {
                    // //console.log( val, index );
                    Object.assign( total, {
                        [index+1] : val.msg
                    });
                    return total;
                }, {})
            );
            
            let notifyOnTelegram = await this.axiosRequest({
                URL: "https://v1.nocodeapi.com/punch__lines/telegram/bcvUoCOJfShwnjlS",
                data: data,
                method: 'POST',
            });

        };

        await send_note_telegram( output );

        return {
            success: true
        }
    },

    syncWithAirtable: async function({collection, data}) {
        
        let airtableURLs = ( await Collections.findOne({name: collection}).lean() ).airtable;
        let properties = ( await Collections.findOne({name: collection}).lean() ).properties;

        if (airtableURLs == undefined) {

            // console.log( chalk.bold.bgYellow.black( "DATA IS NOT CONNECTED WITH AIRTABLE" ) ); 

            return {msg: "not linked with Airtable"};

        }

        let formatData = function( matchingID, data ) {

            let dateProperty = Object.keys(properties).find( val => properties[val]["type"] == 'Date' );

            if (dateProperty != undefined) {

                data[dateProperty] = myFuncs.getFormattedDate(data[dateProperty]);

            }

            if (matchingID == undefined) return [ data ];

            return [{
                id: matchingID.id,
                fields: data
            }];
            
        };

        let formatObjectToStore = function( onlyID ) {

                return {
                    id: onlyID,
                    fields: { [airtableURLs.key] : data[airtableURLs.key] }
                };

        };

        let saveNewKeyInLocalDB = async function ( dataToStore ) {

                // //console.log( chalk.bold.bgYellow.black( "DATA IS PUSHED - SAVING ITS ID INTO LOCAL DB - "  + dataToStore.id) );

                let deleteOldKeys = await Collections.findOneAndUpdate( { name: collection } , { $pull : { "airtable.connectingKeys" : { fields : { [airtableURLs.key] : data[airtableURLs.key] } } } } ) ;

                let newStore = await Collections.findOneAndUpdate( { name: collection } , { $push : { "airtable.connectingKeys" : dataToStore } } , { new : true } ).lean();

                // //console.log( "DATA IS STORED LOCALLY" );

        };

        let pushNewToAirtable = async function( matchingID, data ) {

                // //console.log( chalk.bold.bgYellow.black( "MATCHING ID NOT FOUND IN AIRTABLE - PUSHING DATA AS NEW" ) );

                let newUpload = await myFuncs.axiosRequest({ method: "POST", data: formatData(matchingID, data), URL: airtableURLs.post});
                
		// //console.log(newUpload);

		if ( newUpload.error == 1 ) return { msg: newUpload.info } ;

                let dataToStore = formatObjectToStore( newUpload.data[0].id ); 

                await saveNewKeyInLocalDB( dataToStore );

                return {
                    success: true,
                    airtableReply: newUpload.data[0].fields,
                    msg: "Addded new in airtable"
                }

        };

        let lookForValueinAirtable = async function(matchingID, data) {

            let connectingKeys = ( await myFuncs.axiosRequest({ method: "GET", URL: airtableURLs.get + "&fields=" + airtableURLs.key }) ).data.records;

            let connectingKey = connectingKeys.find( val => val.fields[airtableURLs.key] == data[airtableURLs.key] );

            if (connectingKey == undefined) return await pushNewToAirtable(undefined, data);

            // //console.log( chalk.bold.bgYellow.black( "FOUND THIS KEY MOVED (REMOVED AND ADDED) IN AIRTABLE - UPLOADING NEW DATA TO FOUND KEY" ) );

            // let updateToAirtable = await myFuncs.axiosRequest({ method: "PUT", data: formatData(connectingKey , data), URL: airtableURLs.put});
            let updateToAirtable = await myFuncs.airtableAPI({ method: "update", data: formatData(matchingID, data), baseId: airtableURLs.baseId, baseName: airtableURLs.baseName });

            if ( updateToAirtable && updateToAirtable.response && updateToAirtable.response.data.hasOwnProperty("error") ) {
                
                // //console.log( updateToAirtable.response );
                
                return {
                    msg: "Airtable > " + updateToAirtable.response.data.info
                };
                
            };

            let dataToStore = formatObjectToStore( connectingKey.id ); 

            await saveNewKeyInLocalDB( dataToStore );

            return {
                success: true,
                airtableReply: updateToAirtable.data,
                msg: updateToAirtable.message 
            }

        };

        // //console.log( chalk.bold.bgYellow.black( "UPDATING TO AIRTABLE AGAINST UNIQUE KEY - " + airtableURLs.key ) );

        let matchingID = airtableURLs.connectingKeys.find( val => val && val.fields && val.fields[airtableURLs.key] == data[airtableURLs.key] );

        if (matchingID == undefined) {

            return await lookForValueinAirtable(matchingID, data);

        }

        // let updateToAirtable = await this.airtableAPI({ method: "update", data: formatData(matchingID, data), baseId: airtableURLs.baseId, baseName: airtableURLs.baseName });
        let updateToAirtable = await this.axiosRequest({ method: "PUT", data: formatData(matchingID, data), URL: airtableURLs.put}); 

        //console.log( JSON.stringify(updateToAirtable, 0, 2) );

        if ( updateToAirtable && updateToAirtable.response && updateToAirtable.response.data.hasOwnProperty("error") ) {

            return await lookForValueinAirtable(matchingID, data);
            
        } else if (updateToAirtable.data.message != undefined) {

            return {
                success: true,
                airtableReply: updateToAirtable.data.message,
                msg: updateToAirtable.data.message + " in Airtable"
            }

        } else {

            return {
                success: true,
                airtableReply: updateToAirtable.data,
                msg: "Don't know why this else is here"
            }

        }

    },

    getThemeName: async function(brand) {
        try {
            let themesExist = await this.checkCollectionExists('myapp-themes');
            if (themesExist == false) return 'root';
            let theme = await myFuncs.createModel(`myapp-themes`);
            let extract = await theme.findOne({brand: brand}).lean();
            if (extract == null) return 'root'; 
            return extract.theme;
        } catch (e) {
            return 'root';
        }
    },

    getDirectoryList : async function(directoryName) {
        return new Promise ((resolve,reject) => {
            fs.readdir(directoryPath + '/views/' + directoryName, function (err, files) {
                if (err) {
                    // //console.log('Unable to scan directory: ' + err);
                    return reject('Unable to scan directory: ' + err);
                }
                return resolve(files);
            });
        });
    },

    getFormInputs: async function(req,res) {
        let collection = await Collections.findOne({name: req.params.input}).lean();
        let properties = collection.properties;
        let keys = Object.keys(collection.properties);
        let values = Object.values(collection.properties);
        // //console.log(values);
        let output = keys.map(val => {
            if (properties[val]['html'] == 'imgURL' && req.values && req.values[val] != undefined) {
                req.values[val] = req.values && req.values[val].split(' ');
            }
            return {
                label: val.charAt(0).toUpperCase() + val.slice(1),
                type: properties[val]['html'],
                name: val,
                id: val,
                required: properties[val]['required'] || 'true',
                value: req.values && req.values[val] 
            };
        });
        return output;
    },

    fetchResources: async function(req,res) {
        try {
            let resources = await this.createModel(`${req.params.brand}-resources`);
            let result = await resources.find({});
            return result;
        } catch(e) {
            return e;
        }
    },

    newDocument: async function(req,res) {
        let inputs = await this.getFormInputs(req,res);
        let output = {
            inputs: inputs,
            collection: req.params.input,
            brand: req.params.brand,
            _id: this.getMongoId(req,res),
            resources: await this.fetchResources(req,res)
        };
        req.params.theme = 'root';
        req.params.module = 'editDocument';
        return output;
    },

    editDocument: async function(req,res) {
        let model = await this.createModel(req.params.input);
        req.values = await model.findOne({_id: req.query._id}).lean();
        if (req.values == undefined) return {status: 404, error: 'document does not exist so it can not be edited'};
        let inputs = await this.getFormInputs(req,res);

        req.params.theme = 'root';
        
        let output = {
            inputs: inputs,
            collection: req.params.input,
            brand: req.params.brand,
            _id: req.query._id,
            resources: await this.fetchResources(req,res)
        };

        return output;
    },

    updateSequence: async function(req,res) {
        let model = await this.createModel(req.body.modelName);
        let modelName = req.body.modelName;
        // console.log(req.body);
        delete req.body.modelName;

        let result = await model.findOneAndUpdate({_id: req.body._id},req.body,{new: true, upsert: true}).lean();

        console.log(result);

        if (result == undefined) return {status: 404, error: 'did not find matching document'};

        // TODO: I think Airtable Sync is not required ever.. only pull the data and make this place self sufficient....
        // let airtableSync = {};
        // if (req.body.airtableSync != "false" || req.query.airtableSync != "false"  ) {
        //     airtableSync = await this.syncWithAirtable({collection: modelName, data: req.body})
        // } else {
        //     airtableSync.msg = "Sync manually kept off";
        // }
        // console.log(airtableSync);

        return result;

        return {
            success: "Stored & " + airtableSync.msg, 
            result: result, 
            airtableSync: airtableSync,
        };
    },


        checkCollectionExists: async function(collectionName) {
           	let result = await mongoose.connection.db.listCollections().toArray();
	    return result.some(val => val.name == `${collectionName}`);
        },

        createModel: async function(modelName) {

            try {
                let modelExistsAlready = Object.keys(mongoose.models).some(val => val == modelName);
                let schemaExistsAlready = mongoose.modelSchemas && Object.keys(mongoose.modelSchemas).some(val => val == modelName);
                if (modelExistsAlready || schemaExistsAlready) { return mongoose.models[modelName] };
                if (modelExistsAlready) { delete mongoose.models[modelName] };
                if (schemaExistsAlready) { delete mongoose.modelSchemas[modelName] };
                let schema = await Collections.findOne({name: modelName}).lean();
                return mongoose.models[modelName] || mongoose.model(modelName, new mongoose.Schema(schema.properties, { timestamps: { createdAt: 'created_at' } }));
            } catch(e) {
                console.log( chalk.red.bold( 'Failed to create Model' + ':' + modelName ) );
	        console.log(e);
                return e;
            }
            
        },

        airtableSync: async function(req,res) {
            req.params.theme = 'root';
            let output = await Collections.findOne({name: req.params.input}).lean();
            return {
                modelName: req.params.input,
                brand: req.params.brand,
                collection: req.params.input,
                values: output.airtable,
                msg: req.query.msg
            };
        },

        airtableAPI: async function({baseId, baseName, baseAPIKey, method, data}) {

            try {

                var base = new Airtable({apiKey: baseAPIKey}).base(baseId);

                let fetchAllRecords = async function(maxRecords) {

                    return await new Promise((resolve, reject) => {

                        let allRecords = [];

                        base(baseName).select({
                            maxRecords: maxRecords,
                            view: "Grid view"
                        }).eachPage(function page(records, fetchNextPage) {

                            records.forEach(function(record) {
                                //console.log('Retrieved', record.get('_id'));
                                allRecords.push(record.fields);
                            });

                            try { 
                                fetchNextPage();
                            } catch(e) { 
                                //console.log("next page does not exist"); 
                            };

                        }, function done(err) {
                            //console.log(allRecords);
                            if (err) { reject( err ) }
                            resolve( allRecords );
                        });

                    });

                };

                switch (true) {

                    case (method == "test") :
                        //console.log("test if this input is valid or not");
                        output = await fetchAllRecords(1);
                        break;
                    case (method == "list") :
                        //console.log("fetch all records");
                        output = await fetchAllRecords(100);
                        //console.log(output);
                        break;
                    
                    case (method == "find") : 
                        //console.log("find a record by this Id");
                        break;

                    case (method == "create") :
                        //console.log("create multiple records here");
                        break;

                    case (method == "update") :
                        //console.log("update multiple records here");
                        output = await base(baseName).update(data, {typecast: true});
                        break;

                    case (method == "delete") :
                        //console.log("delete a record here");
                        break; 

                };

                return output;

        } catch(e) {

            //console.log(e);
            //console.log(e.error);

            return {
                status: 404,
                error: e.message
            }

        }

    },

    saveAirtableURLs: async function(req,res) {

        let keysAll  = ( await this.airtableAPI({ baseId: req.body.baseId , baseName: req.body.tableName, baseAPIKey: req.body.baseAPIKey, method: "test" }) );

        if (keysAll.hasOwnProperty("error")) return keysAll;

        await Collections.findOneAndUpdate({ name: req.params.input}, { $set: {
            'airtable.tableName': req.body.tableName, 
            'airtable.baseId': req.body.baseId,
            'airtable.baseAPIKey': req.body.baseAPIKey
        }
        },{new: true});

        return {success: "Keys are Saved!"};

    },

    importAndMerge: async function(req,res) {

        try {

            let myProperties = await Collections.findOne({name: `${req.params.brand}-${req.params.input}`}).lean();

            console.log(myProperties);

            let cp = myProperties.properties;

            let keysAll  = await this.airtableAPI({ 
                baseId: myProperties.airtable.baseId , 
                baseName: myProperties.airtable.tableName, 
                baseAPIKey: myProperties.airtable.baseAPIKey, 
                method: "list" 
            });

            let arrays = [], items = [];

            keysAll = keysAll.map( val => {

                Object.entries( val ).forEach( love => {

                    switch(true) {
                        case cp[love[0]] == undefined :
                            console.log( love[0] + " is not wanted - removing it" );
                            delete val[love[0]];
                            break;
                        case cp[love[0]].html == "multipleFK" :
                            val[ love[0] ] = love[1].reduce( (total, item) => {
                                total.push({
                                    id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                                    slug: item 
                                });
                                return total;
                            },[]);
                            Object.values( val[ love[0] ]).forEach( entry => {
                                items.push({ 
                                    ser: val.ser, 
                                    [ love[0] ]: entry
                                });
                            });
                            delete val[love[0]];
                            break;
                        case cp[love[0]].html == "selectFK" :
                            val[ love[0] ] = love[1][0].trim();
                            break;
                        case cp[love[0]].html == "photos" :
                            val[ love[0] ] = love[1].reduce( (total, photo) => {
                                total.push({
                                    imgId: photo.id,
                                    small: photo.thumbnails.small.url,
                                    medium: photo.thumbnails.large.url,
                                    large: photo.url
                                });
                                return total;
                            },[]);
                            Object.values( val[ love[0] ]).forEach( entry => {
                                arrays.push({ 
                                    ser: val.ser, 
                                    [ love[0] ]: entry
                                });
                            });
                            delete val[love[0]];
                            break;
                        default:
                            val[ love[0] ] = love[1];
                            break;
                    };

                });

                if ( val.ser == 1 ) {
                    val.noClone = "false";
                    val.fixed = "true";
                } else {
                    val.noClone = "false";
                    val.fixed = "false";
                }
                return val;
            });
            let model = await this.createModel(req.params.input);
            await Promise.all( keysAll.map( val => model.deleteOne({ser: val.ser}) ) );
            await Promise.all( keysAll.map( val => model.create( val ) ) );
            await Promise.all( arrays.map( val => {
                return model.findOneAndUpdate({ser: val.ser},{
                    $push: {
                        [Object.keys( val )[1] ]: Object.values( val )[1]
                    }
                });
            }));
            await Promise.all( items.map( val => {
                return model.findOneAndUpdate({ser: val.ser},{
                    $push: {
                        [Object.keys( val )[1] ]: Object.values( val )[1]
                    }
                });
            }));
            return { success: "Data is Merged" };

        } catch(e) {

            console.log(e);

            return {
                status: 400,
                error: "something went wrong"
            }

        };

    },

    updateManyByKey: async function(req,res) {

        let model = await this.createModel(`${req.params.input}`);
        let output = await Promise.all(req.body.data.map((val,index) => model.findOneAndUpdate({ [val.key] : val.data[val.key] }, val.data , { new: true, upsert:true }) ));
        return {
            output
        };

    },

    fetchAirtableData: async function(req,res) {

        let airtableURLs = ( await Collections.findOne({name: req.params.input}).lean() ).airtable;

        let output = await this.axiosRequest({method: "GET", URL: airtableURLs.get});

        output = output.data.records;

        req.params.theme = 'root';
        req.params.module = 'airtableVslocal';

        let file = await fs.writeFile(
            './static/test.json', 
            JSON.stringify( output , 0 , 2 ) , 
            (err) => {
                if (err) {
                  return 'Failed to backup';
                }
                return 'Successful';
            });

        return {
            brand: req.params.brand,
            modelName: req.params.input
        };

    },

    airtableVslocal: async function(req,res) {

        let airtableURLs = ( await Collections.findOne({name: req.params.input}).lean() ).airtable;

        req.params.theme = 'root';

        let file = await new Promise( (resolve, reject) => {

            fs.readFile('./static/test.json', 'utf8', (err, data) => {
                if (err) reject(err)
                resolve( JSON.parse(data) );
            });

        }); 

        if (airtableURLs.put == undefined || airtableURLs == undefined || file == undefined) {
            req.query.redirect = "airtableSync";
            req.query.redirectInput = req.params.input;
            return {msg: 'The PUT URL is not listed in the form. Please update PUT URL and press the Analyze btn'}
        }

        let model = await this.createModel(req.params.input);

        let output2 = await model.find().lean();

        let localToAirtable  = output2.map( val => {
            let matchInAirtable = file.find( row  => row["fields"][airtableURLs.key] == val[airtableURLs.key] );
            return {
                local: val,
                airtable: matchInAirtable
            }
        });

        let airtableToLocal = file.map( val => {
            let matchInLocal = output2.find( row  => {
                // if (val["fields"][airtableURLs.key] == row[airtableURLs.key] ) //console.log( val['fields'][airtableURLs.key], row[airtableURLs.key] );
                return val["fields"][airtableURLs.key] == row[airtableURLs.key] ;
            });
            if (matchInLocal != undefined) return null;
            return {
                local: matchInLocal,
                airtable: val
            }
        }).filter( val => val != null );

        //console.log({
           //  localToAirtable: localToAirtable.length, 
           //  airtableToLocal: airtableToLocal.length,
           //  inFocus: file.filter( val => val.fields.ser == '1061' || val.fields.ser == '1062' )
        // }); 
            
        let sidebyside = localToAirtable.concat(airtableToLocal);

        sidebyside = [...new Set(sidebyside)];

        let getDifferences = function (focal) {

            if (focal.local == undefined || focal.airtable == undefined) {

                let makeObjectAnArray = function(object, database) {

                    // //console.log( object, database );
                    let output = Object.keys(object).map( val => {
                        return {
                            field: val,
                            local: database == "local" ? "<span>" + object[val] + "</span>" : null,
                            airtable: database == "airtable" ? "<span>" + object[val] + "</span>" : null,
                        }
                    });

                    return output;

                };

                let diff =  makeObjectAnArray(focal.local == undefined ? focal.airtable.fields : focal.local, focal.local == undefined ? "airtable" : "local");

                return {
                    local: focal.local == undefined ? focal.local = {_id : myFuncs.getMongoId()} : focal.local,
                    airtable: focal.airtable,
                    diff: diff,
                    foundInBoth: false
                };

            }

            let output = Object.keys(focal.local).map( val => {

                if (val == 'created_at' || val == 'updatedAt' || val == '_id' || val == '__v' || val == 'ser') return null;

                // //console.log( focal.local[val], focal.airtable.fields[val] );

                let diff = myFuncs.patienceDiffPlus( focal.local[val] == undefined ? " " : focal.local[val] , focal.airtable.fields[val] == undefined ? " " : focal.airtable.fields[val]).lines.filter( val => val.bIndex == -1 );

                if (diff.length == 0) return null;

                // place a tick to both entries
                
                let replaceAt = function(string, index, replacement) {

                    let output = string.slice(0, index) + replacement + string.slice(index + 1, string.length );

                    return output;

                }

                let highltString = focal.local[val];
                
                diff.sort( (a,b) => b.aIndex - a.aIndex ).forEach( val => {
                    
                    highltString = replaceAt(highltString, val.aIndex, "<span>" + val.line + "</span>")

                });

                return {
                    field: val,
                    local: highltString,
                    airtable: focal.airtable.fields[val],
                }

            }).filter( val => val != null ) ;

            if (output == []) return "";

            return {
                local: focal.local,
                airtable: focal.airtable,
                diff: output,
                foundInBoth: true
            };

        };

        let rows = sidebyside.map( val => getDifferences(val) ).filter( val => val != "" ).map( val => {
            val.keyValue = val.local[airtableURLs.key] || val.airtable[airtableURLs.key];
            val.local = JSON.stringify(val.local);
            val.airtable = JSON.stringify(val.airtable);
            val.key = airtableURLs.key;
            return val;
        });

        return {
            modelName: req.params.input,
            rows: rows,
            key: airtableURLs.key,
            nocodeapiURL: airtableURLs.put,
            totalDiffs: rows.filter( val => val.diff.length > 0 ).length
        }
    },

    patienceDiff: function(aLines, bLines, diffPlusFlag) {

      function findUnique(arr, lo, hi) {

        var lineMap = new Map();

        for (let i = lo; i <= hi; i++) {
          let line = arr[i];
          if (lineMap.has(line)) {
            lineMap.get(line).count++;
            lineMap.get(line).index = i;
          } else {
            lineMap.set(line, {count:1, index: i});
          }
        }

        lineMap.forEach((val, key, map) => {
          if (val.count !== 1) {
            map.delete(key);
          } else {
            map.set(key, val.index);
          }
        });

        return lineMap;
      }

      function uniqueCommon(aArray, aLo, aHi, bArray, bLo, bHi) {
        let ma = findUnique(aArray, aLo, aHi);
        let mb = findUnique(bArray, bLo, bHi);

        ma.forEach((val, key, map) => {
          if (mb.has(key)) {
            map.set(key, {indexA: val, indexB: mb.get(key)});
          } else {
            map.delete(key);
          }
        });

        return ma;
      }

      function longestCommonSubsequence(abMap) {

        var ja = [];

        abMap.forEach((val, key, map) => {
          let i = 0;
          while (ja[i] && ja[i][ja[i].length-1].indexB < val.indexB) {
            i++;
          }

          if (!ja[i]) {
            ja[i] = [];
          }

          if (0 < i) {
            val.prev = ja[i-1][ja[i-1].length - 1];
          }

          ja[i].push(val);
        });

        var lcs = [];
        if (0 < ja.length) {
          let n = ja.length - 1;
          var lcs = [ja[n][ja[n].length - 1]];
          while (lcs[lcs.length - 1].prev) {
            lcs.push(lcs[lcs.length - 1].prev);
          }
        }

        return lcs.reverse();
      }

      let result = [];
      let deleted = 0;
      let inserted = 0;

      let aMove = [];
      let aMoveIndex = [];
      let bMove = [];
      let bMoveIndex = [];

      function addToResult(aIndex, bIndex) {

        if (bIndex < 0) {
          aMove.push(aLines[aIndex]);
          aMoveIndex.push(result.length);
          deleted++;
        } else if (aIndex < 0) {
          bMove.push(bLines[bIndex]);
          bMoveIndex.push(result.length);
          inserted++;
        }

        result.push({line: 0 <= aIndex ? aLines[aIndex] : bLines[bIndex], aIndex: aIndex, bIndex: bIndex});
      }

      function addSubMatch(aLo, aHi, bLo, bHi) {

        while (aLo <= aHi && bLo <= bHi && aLines[aLo] === bLines[bLo]) {
          addToResult(aLo++, bLo++);
        }

        let aHiTemp = aHi;
        while (aLo <= aHi && bLo <= bHi && aLines[aHi] === bLines[bHi]) {
          aHi--;
          bHi--;
        }

        let uniqueCommonMap = uniqueCommon(aLines, aLo, aHi, bLines, bLo, bHi);
        if (uniqueCommonMap.size === 0) {
          while (aLo <= aHi) {
            addToResult(aLo++, -1);
          }
          while (bLo <= bHi) {
            addToResult(-1, bLo++);
          }
        } else {
          recurseLCS(aLo, aHi, bLo, bHi, uniqueCommonMap);
        }

        while (aHi < aHiTemp) {
          addToResult(++aHi, ++bHi);
        }
      }

      function recurseLCS(aLo, aHi, bLo, bHi, uniqueCommonMap) {
        var x = longestCommonSubsequence(uniqueCommonMap || uniqueCommon(aLines, aLo, aHi, bLines, bLo, bHi));
        if (x.length === 0) {
          addSubMatch(aLo, aHi, bLo, bHi);
        } else {
          if (aLo < x[0].indexA || bLo < x[0].indexB) {
            addSubMatch(aLo, x[0].indexA-1, bLo, x[0].indexB-1);
          }

          let i;
          for (i = 0; i < x.length - 1; i++) {
            addSubMatch(x[i].indexA, x[i+1].indexA-1, x[i].indexB, x[i+1].indexB-1);
          }

          if (x[i].indexA <= aHi || x[i].indexB <= bHi) {
            addSubMatch(x[i].indexA, aHi, x[i].indexB, bHi);
          }
        }
      }

      recurseLCS(0, aLines.length-1, 0, bLines.length-1);

      if (diffPlusFlag) {
        return {lines: result, lineCountDeleted: deleted, lineCountInserted: inserted, lineCountMoved: 0, aMove: aMove, aMoveIndex: aMoveIndex, bMove: bMove, bMoveIndex: bMoveIndex};
      }

      return {lines: result, lineCountDeleted: deleted, lineCountInserted: inserted, lineCountMoved:0};
    },
        
    patienceDiffPlus: function( aLines, bLines ) {

      let difference = this.patienceDiff( aLines, bLines, true );

      let aMoveNext = difference.aMove;
      let aMoveIndexNext = difference.aMoveIndex;
      let bMoveNext = difference.bMove;
      let bMoveIndexNext = difference.bMoveIndex;

      delete difference.aMove;
      delete difference.aMoveIndex;
      delete difference.bMove;
      delete difference.bMoveIndex;

      do {

        let aMove = aMoveNext;
        let aMoveIndex = aMoveIndexNext;
        let bMove = bMoveNext;
        let bMoveIndex = bMoveIndexNext;

        aMoveNext = [];
        aMoveIndexNext = [];
        bMoveNext = [];
        bMoveIndexNext = [];

        let subDiff = this.patienceDiff( aMove, bMove );

        var lastLineCountMoved = difference.lineCountMoved;

        subDiff.lines.forEach( (v, i) => {

          if (0 <= v.aIndex && 0 <= v.bIndex) {
            difference.lines[aMoveIndex[v.aIndex]].moved = true;
            difference.lines[bMoveIndex[v.bIndex]].aIndex = aMoveIndex[v.aIndex];
            difference.lines[bMoveIndex[v.bIndex]].moved = true;
            difference.lineCountInserted--;
            difference.lineCountDeleted--;
            difference.lineCountMoved++;
            foundFlag = true;
          } else if (v.bIndex < 0) {
            aMoveNext.push(aMove[v.aIndex]);
            aMoveIndexNext.push(aMoveIndex[v.aIndex]);
          } else {  // if (v.aIndex < 0)
            bMoveNext.push(bMove[v.bIndex]);
            bMoveIndexNext.push(bMoveIndex[v.bIndex]);
          }

        });

      } while ( 0 < difference.lineCountMoved - lastLineCountMoved );

      return difference;
    },

    airtablePull: async function(req,res) {
        req.params.theme = 'root';
        return {
            brand: req.params.brand,
            collection: req.params.input,
            airtablePullUrl: ( await this.getAirtableUrls(req,res) ).get
        };
    },

    getAirtableUrls: async function(req,res) {

        let airtableUrls = ( await Collections.findOne({name: req.params.input}).lean() ).airtable;

        if (airtableUrls == undefined) return false;

        return airtableUrls;

    },

    mergeDataIntoCollection : async function(req,res) {

        console.log( req.body.results); 
        try {

            let model = await this.createModel(req.params.input);
            let commonKey = ( await this.getAirtableUrls(req,res) ).key; 
            let output = await Promise.all( req.body.results.map( val => model.findOneAndUpdate({ [commonKey]: val[commonKey] }, val, {upsert: true, new: true}) ) );

            return {
                success: true, 
                output: output
            }

        } catch(e) {

            //console.log(e);

            return {
                status: 300,
                error: e.errmsg
            }

        }

    },

    save: async function(model,data) {
        try {
            const doc = new model(data);
            let output = await doc.save();
            return {success: 'Done'};
        } catch(e) {
            console.log(e);
            return {status: 404, error: 'Failed'}
        };
    },
    
    deleteFromCollection: async function(req,res) {
        let output = Collections.deleteOne({name: req.params.input});
        return output;
    },

    dropCollection: async function(req,res) {
        try {
            let collectionName = req.params.input.indexOf('-') > 0 ? req.params.input.split('-')[1] : req.params.input;
            let output = await Collections.remove({name: `${req.params.brand}-collectionName`});
            await mongoose.connection.db.dropCollection(req.params.input);
            return {
                success: 'collection dropped'
            }
        } catch (e) {
            return {
                error: e
            }
        };
    },

    getTypes: function(req,res) {
        return [
            {
                name: 'String',
                html: 'input'
            },{
                name: 'String',
                html: 'textarea'
            },{
                name: 'Date',
                html: 'date'
            },{
                name: 'Number',
                html: 'numberInput'
            },{
                name: 'Array',
                html: 'checkBoxes',
            },{
                name: 'String',
                html: 'imgURL',
            },{
                name: 'String',
                html: 'selectFK'
            },{
                name: 'Array',
                html: 'multipleFK'
            },{
                name: 'Array',
                html: 'quantityFK'
            },{
                name: 'Object',
                html: 'JSON'
            },{
                name: 'String',
                html: 'ckEditor'
            },{
                name: 'String',
                html: 'webEditor'
            },{
                name: 'String',
                html: 'dropdown'
            },{
                name: 'String',
                html: 'fixed'
            },{
                name: 'String',
                html: 'brick'
            },{
                name: "Array",
                html: "photos",
            },{
                name: "String",
                html: "formula"
            },{
                name: "Array",
                html: "stages"
            }
        ];
    },

    createNewCollection : function(req,res) {
        if (req.params.input == 'n') return {
            error: 'Please give collection Name'
        };
        let types = this.getTypes();

        req.params.theme = 'root';
        req.params.module = 'editCollection';
        return {
            _id: this.getMongoId(req,res),
            brand: req.params.brand,
            name: req.params.brand + '-' + req.params.input,
            types: types,
        };
    }, 

    editCollection: async function(req,res) {
        if (req.params.input == 'n') return {
            error: 'Please give a Collection Name'
        };

        let collectionDetails = await Collections.findOne({name: req.params.input}).lean();
        let output = Object.keys(collectionDetails.properties).map(val => {
            if (val == "fixed" || val == "noClone" ) return null;
            return {
                name: val,
                type: collectionDetails.properties[val].type,
                required: collectionDetails.properties[val].required,
                html: collectionDetails.properties[val].html == undefined ? 'input' : collectionDetails.properties[val].html,
                allowedValues: collectionDetails.properties[val].allowedValues,
                info: collectionDetails.properties[val].info
            };
        }).filter( val => val );
        let types = this.getTypes();
        req.params.theme = 'root';
        return {
            _id: collectionDetails._id,
            brand: collectionDetails.brand,
            theme: req.params.theme,
            name: collectionDetails.name,
            redirect: collectionDetails.redirect,
            types: types,
            inputs: output
        };
    },

    saveSequence: async function(req,res) {
        // //console.log(req.body);
        let model = await this.createModel(req.body.modelName);
        let output = await this.save(model,req.body); 
        return output;
    },        

    showCollection: async function(req,res) {
        let collectionsTable = await Collections.find({brand: req.params.brand}).lean();

        if (collectionsTable.length == 0) return {
            status:200, 
            success: 'no Collection exists yet. Try starting the app with basic configurations.',
            brand: req.params.brand
        };

        console.log(req.params.input);
        let inputCollection = await Collections.findOne({name: req.params.input}).lean();

        console.log(JSON.stringify( Collections, 0, 2) );
        console.log(Collections);

        console.log(inputCollection);

        if (
            inputCollection.hasOwnProperty('redirect') && 
            inputCollection.redirect != 'showCollection' && 
            inputCollection.redirect != '' &&
            req.isLocal != true // IS IT A LOCAL REQUEST 
        ) {
            req.query.redirect = inputCollection.redirect && inputCollection.redirect.split('/')[0] || 'showCollection';
            req.query.redirectInput = inputCollection.redirect && inputCollection.redirect.split('/')[1] || 'n';
            return {
                status: 200,
                success: 'Request is now redirected to redirected page mentioned inside the database',
                brand: req.params.brand
            }
        };

        let navRows = collectionsTable.map(val => val.name);

        req.params.input = req.params.input == 'n' ? `${req.params.brand}-users` : req.params.input;

        console.log( collectionsTable );

        let collectionHeadings = Object.keys(collectionsTable.find(val => val.name == req.params.input).properties);

        collectionHeadings.unshift('_id');

        let model = await this.createModel(req.params.input);
        let dataRows = await model.find().lean();
        let newRows = dataRows.map(val => {
            let total = [];
            for (i=0; i<collectionHeadings.length; i++) {
                switch (true) {
                    case (collectionHeadings[i] == 'properties'):
                        total.push(JSON.stringify(val[collectionHeadings[i]]));
                        break;
                    default:
                        total.push(val[collectionHeadings[i]]);
                        //console.log( val[collectionHeadings[i]] );
                }
            }

            //console.log(total);
            return {
                array: total,
                object: val
            };
        });


        // STATIC THEME OF ROOT WHEN SHOWCOLLECTION IS USED
        console.log("set theme to root, this is showCollection");
        req.params.theme = 'root';

        model = await this.createModel(`${req.params.brand}-notifications`);

        let notifications = {
            count: await model.countDocuments({status: 'unread'}),
            texts: await model.find({status: 'unread'})
        };

        return {
            notifications: notifications,
            brand: req.params.brand,
            modelName: req.params.input,
            navRows: navRows,
            th: collectionHeadings,
            dataRows: newRows
        };
    },

    destroySession: function(req,res) {
        req.session.destroy();
        req.query.redirect = req.query.redirect || req.params.input;
        req.query.redirectInput = req.query.redirectInput || "n";
        return {
            status: 200,
            redirect: req.params.input,
            success: 'Session Destroyed'
        };
    },

    deleteDocument: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);
        let result = await model.deleteOne({_id: req.query._id});
        return {
            status: 200,
            success: result 
        };
    },

    deleteDocumentAuth: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);
        let result = await model.deleteOne({_id: req.query._id});
        return {
            status: 200,
            success: result 
        };
    },

    forgotpw: async function(req,res) {
        // //console.log('Send a 4 digit code here');
        return {success: true}
    },

    signin: async function(req,res) {
        return {
            status: 200,
            brand: req.params.brand,
            nextPage: req.query.nextPage,
            nextPageInput: req.query.nextPageInput,
            resources: await this.fetchResources(req,res),
            // countCart: await this.countItemsInCart(req,res),
        };
    },

    signup: async function(req,res) {
        return {
            status: 200,
            success: 'sign up page comes here',
            brand: req.params.brand
        }
    },

    createSignUp: async function(req,res) {

        console.log(req.params);
        let appModel = await this.createModel("myapp-themes");
        let checkAllowed = await appModel.findOne({brand: req.params.brand}).lean();
        console.log(checkAllowed);
        if (!(checkAllowed.signUpAllowed)) {
            return {
                status: 404,
                error: "Sign up is not allowed"
            };
        };

        let userModel = await this.createModel(`${req.params.brand}-users`);
        let checkUserEmailIsUnique = await userModel.count({
            email: req.body.email
        });

        if (checkUserEmailIsUnique > 0) {
            return {
                status: 404,
                error: "User already exists!"
            };
        };

        let output = await userModel.create({
            brand: req.params.brand, 
            role: "auth",
            password: req.body.password,
            name: req.body.name,
            email: req.body.email,
            verifiedEmail: false 
        });

        console.log(output);

        return {
            success: "User was created successfully",
        }

    }, 

    sendVerificationEmail: async function(req,res) {

        console.log(req.params);

        if (!(req.session.hasOwnProperty("person"))) {
            return {
                status: 404,
                error:  "You are not logged in!"
            };
        };

        await this.sendMail({ 
            msg: `
            <h3>Welcome to challenges by Qasim</h3>
            <hr>
            <p>Please verify your email by clicking on the link below:-</p>
            <a href="${process.env.url}/${req.params.brand}/gen/page/verifyEmailChallenges/n?email=${req.session.person.email}&uniqueCode=${req.session.person._id}" target="_blank">Click here</a>
            <p>Wish you a good day ahead. :-)</p>
            <p>challenges.qasim.tech</p>
            <hr>
            `, 
            toEmail: req.session.person.email, 
            subject: "Verify your email — Challenge", 
            brand: req.params.brand
        });

        return {
            success: "Email sent! Check your inbox"
        };

    }, 

    verifyEmailChallenges: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-users`);
        let output = await model.findOneAndUpdate({
            email: req.query.email,
            _id: req.query.uniqueCode
        },{
            verifiedEmail: "true",
        },{
            new: true
        }).lean();

        if (output.hasOwnProperty("email")) {

            await this.sendMail({
                from: `Challenges <${process.env.zoho}>`,
                toEmail: output.email, 
                subject: `Welcome to- Challenges`, 
                msg: `
                <p>Welcome to challenges!</p>
                <p>Wish you a good start to your journey.</p>
                <p>Your feedback is valuable for us!</p>
                <p>Send us details at hello@qasimali.xyz</p>
                <p>🌹</p>
                `,
                brand: req.params.brand
            });

            return {
                brand: req.params.brand,
                msg: 'Email Verified. Thank you for Signing Up.',
            }

        } else {

            return {
                brand: req.params.brand,
                msg: 'Sorry link has expired!',
            }

        };


    },

    saveProfileData: async function(req,res) {

        console.log(req.body);

        let model = await this.createModel(`${req.params.brand}-users`);
        let output = await model.findOneAndUpdate({
            email: req.body.email,
            password: req.body.password
        },{
            name: req.body.name, 
            password: req.body.newPassword
        });

        if (output != null) {
            return {
                status: 200,
                success: "Changes saved!"
            }
        } else {
            return {
                status: 404,
                error: "Make sure you have entered correct password!"
            }
        };

    }, 

    checkSignIn: async function(req,res) {
        let model, output;
        model = await this.createModel(`${req.params.brand}-users`);
        output = await model.findOne({email: req.body.email, password: req.body.password}).lean();
        if (!output) return {status: 400, error: 'Email Password Mismatch. Please Sign Up.'};
        req.session.person = output;
        req.session.person.brand = output.brand || req.params.brand;
        return {
            status:200, 
            success: 'Successfully logged in',
            brand: output.brand || req.params.brand,
            role: output.role
        };
    },

    runAndRedirect: async function(req,res) {
        let output = await this[req.params.input][req.query.input]; 
        return res.redirect(`/${req.params.brand}/${req.params.permit}/${req.params.requiredType}/${req.query.redirect}/${req.query.redirectInput}`);
    },

    bulkUpload: async function(req,res) {
        let collection = await Collections.findOne({name: req.params.input}).lean();
        let properties = collection.properties;

        let collectionHeadings = Object.keys(properties);
        collectionHeadings.unshift('_id');

        req.params.theme = 'root';

        return {
            brand: req.params.brand,
            collection: req.params.input,
            sampleRow: collectionHeadings,
            resources: await this.fetchResources(req,res)
        }
    },
    array2CSV: function(twoDiArray) {
        var csvRows = [];
        for (var i = 0; i < twoDiArray.length; ++i) {
            for (var j = 0; j < twoDiArray[i].length; ++j) {
                twoDiArray[i][j] = '\"' + twoDiArray[i][j] + '\"';  
            }
            csvRows.push(twoDiArray[i].join(','));
        }
        var csvString = csvRows.join('\r\n');
        return csvString;
    },

    downloadCSVFile: async function(req,res) {
        let collection = await Collections.findOne({name: req.params.input}).lean();
        let properties = collection.properties;

        let collectionHeadings = Object.keys(properties);
        collectionHeadings.unshift('_id');
        let model = await this.createModel(req.params.input);
        let dataRows = await model.find().lean();
        let newRows = dataRows.map(val => {
            let total = [];
            for (i=0; i<collectionHeadings.length; i++) {
                total.push(val[collectionHeadings[i]]);
            }
            return total;
        });
        newRows.unshift(collectionHeadings);
        csv = this.array2CSV(newRows);


        return new Promise ((resolve,reject) => {
            fs.writeFile('./static/myFile.csv', csv, (err) => {
                if (err) {
                  return reject(err);
                }
                // //console.log(process.env.url);
                let localhost = process.env.url.includes("localhost:3000");
                if (localhost == true) {
                    resolve('myFile.csv');
                } else {
                    resolve('static/myFile.csv');
                }
            });
        });
    },

    uploadMany: async function(req,res) {
        let model = await this.createModel(req.params.input);
        let mongoId =   req.body.data.map( val => val._id.match(/^[0-9a-fA-F]{24}$/) ? val._id : new mongoose.mongo.ObjectID() );
        let dataWithOutId = req.body.data.map( val => delete val._id );
        let output = await Promise.all(req.body.data.map((val,index) => model.findOneAndUpdate({_id: mongoId[index]},val,{new: true,upsert:true}) ));
        return {status: 200, 'success': 'uploadMany Successful!'};
    },

    string2Array: function(variable,separator) {
        return variable.split(' ');
    },

    ecommerce: async function(req,res) {
        // cart, schools, items, resources, categories
        let models = {};
        models.cart= await this.createModel(`${req.params.brand}-cart`);
        models.items= await this.createModel(`${req.params.brand}-items`);
        models.resources= await this.createModel(`${req.params.brand}-resources`);
        let output = await Promise.all([
            models.cart.find({sessionId: req.sessionID}) ,
            models.items.distinct('school',{}) ,
            models.items.find({ quantity : { $ne: 0 } } ),
            models.resources.find({}) ,
            models.items.distinct('category', {}) ,
            this.countItemsInCart(req,res) ,
        ]);
        output = {
            cart: output[0],
            countCart: output[5], 
            schools: output[1],
            items: output[2].filter( (val,index,self) => { 
                let connectingIDs = self.map( val => val.connectingID );
                return connectingIDs.indexOf(val.connectingID) === index ;
            }),
            resources: output[3],
            categories: output[4],
            email: req.session.person && req.session.person.email,
            sessionID: req.sessionID,
            brand: req.params.brand
        };
        return output;
    },

    root: function(req,res) {
        return {success: true};
    },

    daysSinceDate: function(start,end) {
        // To set two dates to two variables
        var date1 = new Date(start);
        var date2 = new Date(end);

        // To calculate the no. of time between two dates
        var Difference_In_Time = date2.getTime() - date1.getTime();

        // To calculate the no. of days between two dates
        var difference = Math.ceil(Difference_In_Time / (1000 * 3600 * 24));

        return difference;
    },


    // life - portfolio website

    life: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-services`);
        // let output = await model.find().lean();

        let freelance = await model.aggregate([
                {
                    $match: {
                        type: "freelance"
                    }
                },{ 
                    $addFields: {
                        intSer: {
                            $toInt: "$ser"
                        }
                    }
                },{
                    $sort: {
                        intSer: 1
                    }
                }
            ]);
        return {
            freelance: freelance, 
            service: await model.find({type: "service"}).lean()
        }
    },
    
    subscribe: async function( req, res) {
        return {
            success: true
        }
    }, 

    getBlogs: async function(req,res) {

        let model = await this.createModel(`life-blogs`);
        let output = await model.find(req.query.filter)
            .sort({ser: -1})
            .collation({locale: "en_US", numericOrdering: true})
            .skip(req.query.skip).limit(req.query.limit).lean()
        output = output.map( (val,index) => {
            val.index = output.length - index;
            val.date = this.dateBlogHeader(val.date);
            val.body = this.convertStringToArticle(val.body);
            return val;
        });

        return output;
    },

    blogs: async function(req,res) {

        // console.log(blogs);
        req.query = processQuery(req.query, {price: { dataType: "string" } });
        req.query.limit = 12;
        let output = await this.getBlogs(req,res);
        let model = await this.createModel(`life-blogs`);
        let count = await model.countDocuments(req.query.filter).lean();

        return {
            blogs: output,
            pages: this.getPagination(count, req.query.skip, 12)
        }
    },

    services: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-services`);
        let output = await model.find().lean();

        return {
            freelance: await model.find({type: "freelance"}).lean(),
            service: await model.find({type: "service"}).lean()
        }
    },

    vlogs: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-vlogs`);
        let output = await model.aggregate(
            [
                {
                    $addFields: {
                        intSer: {
                            $toInt: "$ser"
                        }
                    }
                },{
                    $sort: {
                        intSer: 1
                    }
                }
            ]);
        output = output.map( val => {
            Object.assign( val , {
                video_id: val.link.split("https://youtu.be/")[1]
            });
            return val;
        });
        output.reverse();

        return {
            vlogs: output
        }
    },

    blogStreak: async function(req,res) {

        let model = await this.createModel(`life-blogs`);
        let output = await model.find().sort({ser: -1}).lean();

        let start_date = "01/01/2020";
        let difference = this.daysSinceDate(start_date,new Date());

        let array = [], this_date;

        for (let i = 0 ; i < difference ; i++) {
            this_date = new Date(new Date(start_date).getTime() + (1000 * 60 * 60  * 24 * i) ) ;
            array.push( {
                date: this_date,
                blog: output.find( val => {
                    var diff =  Math.floor(( Date.parse(val.date) - Date.parse(this_date) ) / 86400000);
                    return Math.abs( diff ) < 1;
                }),
                postNo: i + 1,
            });
        }

        array.sort( (a,b) => b.postNo - a.postNo );

        return {
            blogs: array
        }

    },

    newsletters: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-newsletters`);
        let output = await model.find().sort({publishTime: -1}).lean();
        output = output.map( (val,index) => {
            val.index = output.length - index;
            val.date = this.dateBlogHeader(val.publishTime);
            val.body = this.convertStringToArticle(val.body);
            return val;
        });
        return {
            letters: output
        };
    },

    postComment: async function(req,res) {

        console.log(req.body);

        let model = await this.createModel(`${req.params.brand}-comments`);
        let uniqueCode = Date.now().toString(36) + Math.random().toString(36).substr(2);

        let output = await model.create({
            name: req.body.name,
            email: req.body.email,
            comment: req.body.comment,
            replyTo: req.body.replyTo, 
            slug: req.body.slug, 
        });

        console.log(output);

        await this.sendMail({ 
            msg: `
            <p>New comment posted at <a href="${process.env.url}/${req.params.brand}/gen/page/${req.body.page}/${output.slug}?uniqueCode=${output.uniqueCode}">${req.params.brand}</a></p>
            <p>Please click on below link to verify your comments</p>
            <p> 
                <a href="${process.env.url}/${req.params.brand}/gen/page/${req.body.page}/${output.slug}?uniqueCode=${output.uniqueCode}">${process.env.url}/${req.params.brand}/gen/page/${req.body.page}/${output.slug}?uniqueCode=${output.uniqueCode}</a>
            </p>
            <hr>
            <p>If you did not post any comment, please ignore this message.</p>
            `, 
            toEmail: req.body.email, 
            subject: req.params.brand + " | approve your comment", 
            brand: req.params.brand
        });


        return {
            success: {
                _id : output._id,
                name: output.name, 
                comment: output.comment
            }
        };

    },

    deleteComment: async function(req,res) {

        console.log("deleting comment");
        if ( !(req.session.person && req.session.person.email) ) return {
            status: 404,
            error: "Sorry unauthorised request. Please log in to delete comments."
        };

        let model = await this.createModel(`${req.params.brand}-comments`);
        let output = await model.deleteOne({_id: req.params.input});

        return {
            success: output
        }

    },

    challenge: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-types`);
        return {
            types: await model.find().lean(), 
            sessionExists: req.session.hasOwnProperty('person') 
        };
    },

    richpakistan: async function(req,res) {
        return {
            success: true
        }
    },

    svenska: async function(req, res) {
        console.log("sending svenska");
        return {
            success: true
        }
    }, 

    //tech-portfolio
    portfolio: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-projects`);
        let output = await model.findOne({slug: req.params.input}).lean();
        output.pictures = output.pictures.split(",");
        // let models = await        Promise.all( model.map((val) => this.createModel(val.collectionName) ));
        let related_projects = await Promise.all( output.related_projects.split(",").map( val => model.findOne({slug:val}).lean() ) );
        return {
            project: output,
            related_projects
        }
    },

    rhythm: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-projects`);
        let projects = await model.find().lean();
        let types = await model.distinct("type").lean();
        let blogsModel = await this.createModel(`life-blogs`);
        let output = await blogsModel.aggregate([
              {
                $addFields:
                  {
                    ser: {
                      $toInt: "$ser",
                    },
                  },
              },
              {
                $sort:
                  {
                    ser: -1,
                  },
              },
              {
                $limit:
                  6,
              }
            ]);
        output.forEach( val => {
            Object.assign(val, {
                body: this.convertStringToArticle(val.body),
                date: this.dateBlogHeader(val.date)
            });
        });
        return {
            projects,
            types,
            blogs: output
        }
    }, 

    change_lang: async function(req,res) {

          req.session.lang = req.query.lang;
          req.params.module = req.params.input;
          return this.natural_therapy(req,res);

    },

    // natural_therapy
    documentation: function(req,res) {

        req.params.module = "documentation";
        return this.natural_therapy(req,res);

    },

    language_data: function(req, returned) {

        let language_obj = {};

        req.session.lang = req.session && req.session.hasOwnProperty("lang") ? req.session.lang : "en"

        if (req.session.lang == 'en') {
            Object.assign( returned.en, {
                urdu_flag: 'inactive',
                nok_flag: 'inactive',
                eng_flag: 'active',
                stylesheet: 'english'
            });
            return returned.en;
        } else if (req.session.lang == 'ur') {
            Object.assign( returned.ur, {
                urdu_flag: 'active',
                nok_flag: 'inactive',
                eng_flag: 'inactive',
                stylesheet: 'urdu'
            });
            return returned.ur;
        } else {
            Object.assign( returned.nok, {
                urdu_flag: 'inactive',
                nok_flag: 'active',
                eng_flag: 'inactive',
                stylesheet: 'english'
            });
            return returned.nok;
        }
    },

    natural_therapy: async function (req,res) {
        let model = await this.createModel(`${req.params.brand}-sheetdatas`);
	    console.log(model);
        let output = await model.findOne({status: "live"}).lean();
	    console.log(output);
        let returned = this.language_data(req, output);
        return {
            content: returned 
        }
    },

    easy_heal: async function(req,res) {
        return {
            success: true
        }
    },

    updateDocument: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);
        let output = await model.findOneAndUpdate({_id : req.query._id}, { $set: req.body }, {upsert: true, new: true});
        return output;

    },

    updateDocumentAuth : async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);

        let output = await model.findOneAndUpdate({
            _id : req.query._id, 
            email: req.session.person.email
        }, { $set: req.body }, {upsert: true, new: true});

        return output;

    },

    getSummaryOfTasks: async function(req, res) {

        let model = await this.createModel("duty-tasks");
        if (!(req.session.person)) {
            return {
                error: "You are not logged in", 
                status: 400
            };
        }
        let subjects = await model.distinct("subject", {email: req.session.person.email}).lean();

        let docs = await Promise.all( subjects.map((val) => {

            return model.aggregate(
                [
                  {
                    $match: {
                      subject: val
                    },
                  },
                  {
                    $addFields:
                      {
                        newDate: {
                          $concat: ["$date", "T", "$time"],
                        },
                      },
                  },
                  {
                    $addFields: {
                      newDate: {
                        $dateFromString: {
                          dateString: "$newDate",
                        },
                      },
                    },
                  },
                  {
                    $sort: {
                      newDate: -1,
                    },
                  },
                  {
                    $limit: 1,
                  },
                ]
            );

        }));

        docs = docs.map( val => {
            const diffInMs   = new Date() - new Date(val[0].newDate)
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            return {
                dtg: val[0].newDate,
                subject: val[0].subject,
                diff: diffInDays.toPrecision(3)
            }
        }).sort( (a,b) => Number(b.diff) - Number(a.diff) );

        // console.log(docs);

        return docs;

    },


    storeTelegramId: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-users`);
        let output = await model.findOneAndUpdate({
            email: req.session.person.email
        },{
            $set: {
                telegramId: req.body.telegramId
            }
        },{
            new: true
        });
        req.session.person = output;
        if (!(output)) return {
            error: "No user found",
            status: 400
        }
        else return {
            success: true
        };
    }, 

    deleteMyAccount: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-users`);
        let output = await model.deleteOne({email: req.session.person.email});
        req.params.module = "landingPage";
        return {
            success: true
        }

    },

    sendDutySummaryOnTelegram: async function(req,res) {
        let model = await this.createModel(`myapp-themes`);
        let brandInfo = await model.findOne({brand: "duty"}).lean();
        let summary = await this.getSummaryOfTasks(req,res);
        let data = summary.reduce( (total, val, key) => {
            return total += `${val.subject} : ${val.diff} days ago \n`
        },"");
       // console.log(brandInfo);
       // console.log(req.session.person);
       // console.log(`https://api.telegram.org/bot${brandInfo.telegramToken}/sendMessage?chat_id=${req.session.person.telegramId}&text=${data}`);
        let output = await this.axiosRequest({
            method: "POST",
            URL: `https://api.telegram.org/bot${brandInfo.telegramToken}/sendMessage?chat_id=${req.session.person.telegramId}&text=${data}`
        });
        // console.log(output);
        if (output.ok == false) return {
            status: 404,
            error: output.description
        } 
        else return { 
            status: output.status,
            statusText: output.statusText
        }
    }, 

    dutyDashboard: async function(req,res) {

        req.params.module = "dashboard";
        let model = await this.createModel("duty-tasks");
        let output = await model.aggregate([
          {
            $match: {
                email: req.session.person.email
            }
          },
          {
            $addFields:
              {
                newDate: {
                  $concat: ["$date", "T", "$time"],
                },
              },
          },
          {
            $addFields: {
              newDate: {
                $dateFromString: {
                  dateString: "$newDate",
                },
              },
            },
          },
          {
            $sort: {
                newDate: -1
            }
          }
        ]);
        return {
            tasks: output, 
            summary: await this.getSummaryOfTasks(req,res), 
            user: {
                name:  req.session.person.name,
                email: req.session.person.email,
                role:  req.session.person.role,
                mobile:req.session.person.mobile,
                telegramId: req.session.person.telegramId
            }
        }

    },

    userChangedPw: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-users`);
        console.log(req.body);
        let output = await model.findOneAndUpdate({
            email: req.body.email, 
            code: req.body.code,
        },{
            $set: {
                password: req.body.password
            }
        }).lean();

        console.log(output);

        if (!(output)) return {
                status: 400,
                error: "Bad request. Try reseting password again."
            } 
        else return {
                success: "Password changed!"
            }
        

    }, 

    userSignedUp: async function(req,res) {

        let brand = await this.createModel("myapp-themes");
        let brand_result = await brand.findOne({brand: req.params.brand});
        console.log(brand_result);
        if (!(brand.signUpAllowed)) return {
            status: "404",
            error: "Sign up is not enabled for this brand"
        };
        let length = 10000000000000000000000000000000000;
        let code = (Math.floor(Math.random() * length) + length).toString().substring(1);
        let model = await this.createModel(`${req.params.brand}-users`);
        let checkUserExists = await model.count({email: req.body.email}).lean();
        if (checkUserExists.length > 0) return {
            status: 404,
            error: "User already exists. Try resetting your password"
        };

        let output = await model.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            code: code,
            role: "auth"
        });
        req.session.person = output;
        req.session.person.brand = output.brand || req.params.brand;

        return output;

    }, 

    duty: async function(req,res) {
        return {
            success: true
        }
    },

    dedicated_parents: async function(req, res) {
        req.params.module = req.query.lang || "en";
        return {
            events: await this.d_pmodules.pastThreeEvents(req,res),
            futureEvents: await this.d_pmodules.futureEvents(req,res),
            staffs: await this.d_pmodules.staffs(req,res), 
            causes: await this.d_pmodules.causes(req,res),
            gallery: await this.d_pmodules.gallery(req,res), 
            threePages: await this.d_pmodules.threePages(req,res)
        }
    }, 

    d_pmodules: {

        threePages: async function(req,res) {
            let model = await myFuncs.createModel(`${req.params.brand}-blogs`);
            return {
                education: await model.findOne({slug: "education"}).lean(),
                helpAndSupport: await model.findOne({slug: "help-and-support"}).lean(),
                volunteering: await model.findOne({slug: "volunteering"}).lean()
            };
        }, 
        
        gallery: async function(req,res) {
            let model = await myFuncs.createModel(`${req.params.brand}-gallery`);
            let output = await model.find().lean();
            output = output.map( val => {
                val.number = val.url.split("/image/upload/")[1].split("/dedicatedparents/")[0];
                val.slug = val.url.split("/gallery-photos/")[1]
                return val;
            });
            return output
        }, 

        causes: async function(req,res) {
            let model = await myFuncs.createModel(`${req.params.brand}-causes`);
            let output = await model.find().lean();
            return output
        }, 
            
        pastThreeEvents: async function(req,res) {

            req.query = processQuery(req.query);
            let model = await myFuncs.createModel(`${req.params.brand}-events`);
            let output = await model.aggregate([
                [
                  {
                    $addFields:
                      {
                        newDate: {
                          $dateFromString: {
                                dateString: "$date",
                          }
                        }
                      },
                  },
                  {
                    $match: {
                      newDate: {
                        $lt: new Date()
                      }
                    }
                  },
                  {
                    $sort: {
                      newDate: -1
                    }
                  },
                  {
                    $limit: 3
                  }
                ]
                
            ]);
            return output;

        }, 

        pastEvents: async function(req,res) {

            req.query = processQuery(req.query);
            let model = await myFuncs.createModel(`${req.params.brand}-events`);
            let output = await model.aggregate([
                [
                  {
                    $addFields:
                      {
                        newDate: {
                          $dateFromString: {
                                dateString: "$date",
                          }
                        }
                      },
                  },
                  {
                    $match: {
                      newDate: {
                        $lt: new Date()
                      }
                    }
                  },
                  {
                    $sort: {
                      newDate: -1
                    }
                  }
                ]
                
            ]);
            return output;

        }, 
        futureEvents: async function(req,res) {

            req.query = processQuery(req.query);
            let model = await myFuncs.createModel(`${req.params.brand}-events`);
            let output = await model.aggregate([
                [
                  {
                    $addFields:
                      {
                        newDate: {
                          $dateFromString: {
                                dateString: "$date",
                          }
                        }
                      },
                  },
                  {
                    $match: {
                      newDate: {
                        $gt: new Date()
                      }
                    }
                  },
                  {
                    $sort: {
                      newDate: -1
                    }
                  }
                ]
                
            ]);
            return output;

        }, 

        staffs: async function(req,res) {
            let model = await myFuncs.createModel(`${req.params.brand}-staffs`);
            return await model.find({visibility: true}).lean()
        }


    }, 

    d_ppages: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-blogs`);
        let output = await model.find({visibility: "page"}).sort({_id: -1}).lean();
        req.params.module = "pages";
        return {
            blogs: output, 
            futureEvents: await this.d_pmodules.futureEvents(req,res),
            gallery: await this.d_pmodules.gallery(req,res)
        }
    }, 

    d_ppage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-blogs`);
        let modelComments = await this.createModel(`${req.params.brand}-comments`);
        let output = await model.findOne({slug: req.params.input}).lean();
        req.params.module = "page";
        return {
            blog: output, 
            comments: await this.getComments(req.params.brand, output, req.query.uniqueCode), 
            countComments: await modelComments.count({slug: output.slug}).lean(), 
            gallery: await this.d_pmodules.gallery(req,res)
        }
    }, 

    d_pblogs: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-blogs`);
        let output = await model.find({visibility: "blog"}).sort({_id: -1}).lean();
        req.params.module = "blogs";
        return {
            blogs: output, 
            futureEvents: await this.d_pmodules.futureEvents(req,res), 
            gallery: await this.d_pmodules.gallery(req,res)
        }
    }, 

    getComments: async function(brand, blog, uniqueCode) {

        let model = await this.createModel(`${brand}-comments`);
        let output = await model.find({slug: blog.slug, replyTo: "none"}).lean();
        let result;
            
        result = await Promise.all( output.map(async val => {
            return {
                comment: val, 
                replies: await model.find({replyTo: val._id.toString()}).sort({_id: 1}).lean()
            }
        }) );

        if (uniqueCode) {

            // make sure its a valid secret code and then activate all the comments attached to this email

            result = result.map( val => {
                val.comment.editable = val.comment.uniqueCode == uniqueCode;
                val.replies = val.replies.map( tal => {
                    tal.editable = tal.uniqueCode == uniqueCode
                    return tal;
                });
                return val;
            });

            return result;

        } else {

            return result;

        }
    }, 

    d_pblog: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-blogs`);
        let modelComments = await this.createModel(`${req.params.brand}-comments`);
        let output = await model.findOne({slug: req.params.input}).lean();
        req.params.module = "blog";
        return {
            blog: output, 
            comments: await this.getComments(req.params.brand, output, req.query.uniqueCode), 
            countComments: await modelComments.count({slug: output.slug}).lean()
        }
    },

    d_pevents: async function(req,res) {
        req.params.module = "events";
        return {
            pastEvents: await this.d_pmodules.pastEvents(req,res),
            futureEvents: await this.d_pmodules.futureEvents(req,res), 
            gallery: await this.d_pmodules.gallery(req,res)
        }
    }, 

    d_pevent: async function(req,res) {
        req.params.module = "event";
        let model = await this.createModel(`${req.params.brand}-events`);
        return {
            futureEvents: await this.d_pmodules.futureEvents(req,res),
            output: await model.findOne({slug: req.params.input}).lean(), 
            gallery: await this.d_pmodules.gallery(req,res)
        }
    }, 

    d_pstaffs: async function(req,res) {
        req.params.module = "staffs";
        return {
            staffs: await this.d_pmodules.staffs(req,res),
        }
    }, 

    d_pstaff: async function(req,res) {
        req.params.module = "staff";
        let model = await this.createModel(`${req.params.brand}-staffs`);
        return {
            staff: await model.findOne({slug: req.params.input}).lean(),
            futureEvents: await this.d_pmodules.futureEvents(req,res)
        }
    }, 

    d_pcauses: async function(req,res) { 
        req.params.module = "causes";
        return {
            causes: await this.d_pmodules.causes(req,res), 
            futureEvents: await this.d_pmodules.futureEvents(req,res), 
            gallery: await this.d_pmodules.gallery(req,res)
        }
    }, 

    d_pcause: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-causes`);
        req.params.module = "cause";
        return {
            cause: await model.findOne({slug: req.params.input}).lean(),
            futureEvents: await this.d_pmodules.futureEvents(req,res)
        }
    },

    d_pcontact: async function(req,res) {
        req.params.module = "contact";
        return {
            gallery: await this.d_pmodules.gallery(req,res),
            futureEvents: await this.d_pmodules.futureEvents(req,res)
        }
    },

    landingPage: async function(req,res) {
        let output = this[req.params.theme](req,res);
        return output;
    },

    mongoQueries: async function(req,res) {
        let model = await ( await this.createModel(`${req.params.brand}-${req.params.input}`) ).find({}).lean();
        let models = await Promise.all( model.map((val) => this.createModel(val.collectionName) ));
        let output = await Promise.all( models.map((val,index) => { 
            let query = model[index].query.split(',');
            switch(true) {
                case ( /req.session._id/gi.test(query[0]) ) :
                    query[0] = {sessionId: req.sessionID};
                    break;
                default : 
                    query[0] = JSON.parse(query[0]);
            };
            let mongoQuery = {
                query: query[0] ? query[0] : {},
                select: query[1] ? JSON.parse(query[1]) : {},
                cursor: query[2] ? JSON.parse(query[2]) : {},
            };
            result = val.find(mongoQuery.query, mongoQuery.select, mongoQuery.cursor).lean();
            return result;
        }) );

        let variables = model.map(val => val.variable);
        
        output = output.reduce((total,val,index)  => {
            switch(true) {
                case (model[index]['specialMethod'] && model[index]['specialMethod'].length != 0) :
                    let specialMethodName = model[index]['specialMethod'].split(' ')[0];
                    let dataKeyName = model[index]['specialMethod'].split(' ')[1];
                    val = val.map(v => {
                        v[dataKeyName] = this[specialMethodName]( v[dataKeyName] )
                        return v;
                    });                   
                default: 
                    total = Object.assign(total, {
                        [variables[index]] : val
                    });
            };
            return total;
        },{});
        output = Object.assign(output, {
            email: req.session.person && req.session.person.email,
            sessionID: req.sessionID
        });
        req.params.pageName =  req.params.input;
        return output;
    },

    uploadImage: async function(req,res) {

        const extName = path.extname(req.files.upload.name).toString();
        const file64 = parser.format(extName, req.files.upload.data);


        req = {
            body : {
                img: file64.content,
            },
            params : {
                brand: req.session && req.session.person && req.session.person.name || "temporaryFolder"
            }
        };
            
        let output = await this.uploadCloudinary(req);

        return output;

        // return {
        //     "url": "https://res.cloudinary.com/demo/image/upload/w_150,h_300,c_fill/boulder.jpg"
        // };

    },

    uploadCloudinary: async function(req,res) {
        let output = await cloudinary.uploader.upload(req.body.img,
              {
                resource_type: "image",
                public_id: req.body.public_id || mongoose.Types.ObjectId().toString(),
                folder: req.params.brand,
                overwrite: true,
                transformation: [
                  { width: req.body.width, height: req.body.height, crop: "limit" }
                ],
              });
        return output;
    },

    searchItems: async function(req,res) {

        let query = {};

        if (req.body.itemName && req.body.itemName.length > 0) query.name = new RegExp(req.body.itemName,'i');
        if (req.body.selectedCategories && req.body.selectedCategories.length > 0) query.category = { $in : req.body.selectedCategories };
        if (req.body.selectedSchools && req.body.selectedSchools.length > 0) query.school = { $in : req.body.selectedSchools };

        let model = await this.createModel(`${req.params.brand}-items`);
        let output = await model.find(query);
        
        output = output.filter( (val,index,self) => { 
                let connectingIDs = self.map( val => val.connectingID );
                return connectingIDs.indexOf(val.connectingID) === index ;
            });

        output = {
            result: output,
            email: req.session.person && req.session.person.email ,
            sessionId: req.sessionID
        };

        return output;
    },



    getCartItems: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let result = await model
            .aggregate([
            {
                $match: {
                    $or: [
                        {sessionId: req.sessionID },
                        {email: req.session.person && req.session.person.email }
                    ],
                    cartStatus: req.params.hasOwnProperty('cartStatus') ? req.params.cartStatus : 'open' 
                }
            },{
                $addFields:
                {
                    itemId: { $toObjectId: "$itemId" }
                }
            },{
                $lookup:
                 {
                   from: `${req.params.brand}-items`,
                   localField: 'itemId',
                   foreignField: '_id',
                   as: 'items'
                 }
            },{
                $lookup:
                 {
                   from: `${req.params.brand}-items`,
                   localField: 'connectingID',
                   foreignField: 'connectingID',
                   as: 'allSizes'
                 }
            }
            ]);
        return result;
    },


    cartPage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let resources = await this.createModel(`${req.params.brand}-resources`);
        let resultResources = await resources.find({});
        let result = await this.getCartItems(req,res);
        let countCart = await this.countItemsInCart(req,res);

        let output = {
            cartItems: result,
            countCart: countCart,
            resources: resultResources,
            brand: req.params.brand,
            sessionId: req.sessionID,
            email: req.session.person && req.session.person.email.length > 0 ? req.session.person.email : 'false'
        };

        return output;
    },

    countItemsInCart: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let output = await model.countDocuments({
            $or : [
                {sessionId: req.sessionID},
                {email: req.session.person && req.session.person.email}
            ],
            cartStatus: 'open'
        });
        return output;
    },

    updateCart: async function(req,res) {
        let cart = req.body.cart;
        let model = await this.createModel(`${req.params.brand}-cart`);
        cart =  cart.map( val => {
            val._id = val._id == '' ? new mongoose.mongo.ObjectID() : mongoose.mongo.ObjectID(val._id);
            return val;
        });
        let output = await Promise.all( cart.map( (val, index) => model.findOneAndUpdate( {_id: val._id}, val, { new: true, upsert: true } ) ) ); 
        return {success: 'done', output: output}
    },

    removeItemFromCart: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let out = await model.deleteOne({_id: req.body.myId});
        return out.deletedCount == 0 ? {status: 300, error: 'item did not remove'} : {success: 'item removed', output: out} ;
    },

    getMongoId: function(req,res) {
        return new mongoose.mongo.ObjectID();
    },

    padWithZeroes: function (number, length) {

        var my_string = '' + number;
        while (my_string.length < length) {
            my_string = '0' + my_string;
        }

        return my_string;

    },

    reviewCartPage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-resources`);
        let result = await this.getCartItems(req,res);
        let resources = await model.find({});
        let myOrder = await this.findOrderInSession(req,res);
        let countCart = await this.countItemsInCart(req,res);
        let totalCost = result.reduce( (total, val, index) => {
            total = Number(total) + ( Number(val.quantity) * Number(val.items[0].cost) ) ;
            return total;
        },0);
        let output = {
            resources: resources,
            cartItems: result,
            countCart: countCart,
            totalCost: totalCost,
            order: myOrder.order,
            orderNo: this.padWithZeroes(Number(myOrder.orderNo.replace(/^0+/, '')) + 1, 6),
            brand: req.params.brand,
            sessionId: req.sessionID,
            email: req.session.person && req.session.person.email.length > 0 ? req.session.person.email : 'false'
        };
        return output;
    },

    closeCartItems: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let cartIds = req.body.cartIds.split(' ');
        let output = await Promise.all(cartIds.map(val => model.findOneAndUpdate({_id: val.trim()}, {cartStatus: 'closed'}) ) );
        return 'cartClosed';
    },

    notifySlack: async function(token, msg, conversationId) {
        try {
            const result = await web.chat.postMessage({
                token: token,
                text: msg,
                channel: conversationId,
            });
            return result;
        } catch (e) {
            return e
        }
    },

    createOrder: async function(req,res) {
        
        let closeCart = await this.closeCartItems(req,res);

        let order = req.body;
        order._id = order._id == '' ? new mongoose.mongo.ObjectID() : order._id ;
        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = model.findOneAndUpdate({_id: order._id}, order, {upsert: true, new: true});

        model = await this.createModel(`${req.params.brand}-notifications`);
        let notification = new model(
            {
                text: `New order placed — Order No ${order.orderNo}`, 
                status: 'unread',
                type: 'order',
                data: order._id
            });
        await notification.save();

        let notifications = await this.fetchNotifications(req,res)

        io.sockets.emit(`${req.params.brand}newOrder`,notifications);

        let msg = ` ————————\nNew Order \nOrder No : ${order.orderNo} \nCustomer : ${order.name} · ${order.mobile} \nShipping Address : ${order.address} \nOrder Details : <http://${order.myURL}/${req.params.brand}/gen/page/orderReceiptPage/n?mobile=${order.mobile}&orderNo=${order.orderNo}| Show Receipt> \n—————————`;
        
        let resources = await this.fetchResources(req,res);

        let slackNotify = this.notifySlack(resources[0].slackToken, msg, resources[0].slackChannelId);

        return output;
    },

    findOrderInSession: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOne({sessionId: req.sessionID}).lean();
        let highestOrder = await model.find({}, {orderNo: 1, _id:0}).sort({orderNo:-1}).limit(1);
        return {order: output, orderNo: highestOrder.length > 0 ? highestOrder[0].orderNo : '000000'};
    },

    findOrderInQuery: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOne({
            orderNo: req.query.orderNo,
            mobile: req.query.mobile
        }).lean();
        return {order: output};
    },

    getCartItemsInArray: async function(req, model, cartIds) {
        cartIds = cartIds.split(' ').map( val => mongoose.Types.ObjectId(val) );
        let result = await model
            .aggregate([
            {
                $match: {
                    _id: { $in: cartIds },
                }
            },{
                $addFields:
                {
                    itemId: { $toObjectId: "$itemId" }
                }
            },{
                $lookup:
                 {
                   from: `${req.params.brand}-items`,
                   localField: 'itemId',
                   foreignField: '_id',
                   as: 'items'
                 }
            },{
                $lookup:
                 {
                   from: `${req.params.brand}-items`,
                   localField: 'connectingID',
                   foreignField: 'connectingID',
                   as: 'allSizes'
                 }
            }
            ]);
        return result;
    },

    orderReceiptPage: async function(req,res) {
        let myOrder = await this.findOrderInQuery(req,res);
        let model = await this.createModel(`${req.params.brand}-resources`);
        let resources = await model.find({});
        let countCart = await this.countItemsInCart(req,res);

        if (myOrder.order == null) return {
            resources: resources,
            brand: req.params.brand
        };

        let cartModel = await this.createModel(`${req.params.brand}-cart`);
        let cartIds = myOrder.order.cartIds;
        let result = await this.getCartItemsInArray(req, cartModel, cartIds);
        // let myOrder = await this.findOrderInSession(req,res);
        let totalCost = result.reduce( (total, val, index) => {
            total = Number(total) + ( Number(val.quantity) * Number(val.items[0].cost) ) ;
            return total;
        },0);
        let output = {
            order: myOrder.order,
            cartItems: result,
            countCart: countCart,
            totalCost: totalCost,
            resources: resources,
            brand: req.params.brand,
        };
        return output;
    },

    profile: async function(req,res) {

        if (!(req.session.hasOwnProperty("person"))) {
            return {
                status: 404,
                error: "You are not logged in",
            }
        };

        let model = await this.createModel(`${req.params.brand}-users`);

        let output = await model.findOne({
            email: req.session.person.email,
        });

        return {
            name: output.name, 
            email: output.email,
            verified: output.verifiedEmail
        };
    },

    profilePage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-resources`);
        let resources = await model.find({});
        let output = {
            resources: resources,
            brand: req.params.brand,
            sessionId: req.sessionID
        }
        return output;
    },

    kallesFindOrder: async function( req,res){
        req.params.module = "findOrderPage";
        return {
            success: true,
            cart: req.session.cart != undefined ? req.session.cart : []
        }
    },

    findOrderPage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-resources`);
        let resources = await model.find({});
        let countCart = await this.countItemsInCart(req,res);
        let output = {
            resources: resources,
            countCart: countCart,
            brand: req.params.brand,
            sessionId: req.sessionID
        }
        return output;
    },

    findItemWithId: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-items`);
        let result = await model
            .aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(req.params.input)}
            },{
                $lookup: 
                {
                    from: `${req.params.brand}-items`,
                    localField: 'connectingID',
                    foreignField: 'connectingID',
                    as: 'allSizes'
                }
            }
            ]);
        return result;
    },

    findMeInCart: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let result = await model.aggregate([
            {
                $match: {
                    connectingID: req.params.connectingID,
                    sessionId: req.sessionID,
                    cartStatus: 'open'
                }
            },{
                $addFields:
                {
                    itemId: { $toObjectId: "$itemId" }
                }
            },{
                $lookup:
                 {
                   from: `${req.params.brand}-items`,
                   localField: 'itemId',
                   foreignField: '_id',
                   as: 'items'
                 }
            }

        ]);
        return result;
    },

    itemPage: async function(req,res) {
        let item = await this.findItemWithId(req,res);
        let model = await this.createModel(`${req.params.brand}-resources`);
        let resources = await model.find({});
        req.params.connectingID = item[0].connectingID;
        let countCart = await this.countItemsInCart(req,res);
        let itemInCart = await this.findMeInCart(req,res);
        let output = {
            item: item,
            resources: resources,
            countCart: countCart,
            mongoID: new mongoose.mongo.ObjectID(),  
            itemInCart: itemInCart,
            brand: req.params.brand,
            sessionId: req.sessionID
        }
        return output;
    },

    saveItemInCart: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        req.body.sessionId = req.sessionID;
        req.body.email = req.session.hasOwnProperty('person') ? req.session.person.email : 'false';
        let output = await model.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.body.cartId)}, req.body, {upsert: true}).lean();
        return output;
    },

    normalLayout: async function(req,res) {
        let output = await this.showCollection(req,res);
        delete req.query.redirect;
        delete req.query.redirectInput;
        req.params.theme = 'root';
        req.params.module = 'showCollection';
        return output;
    },

    showOrders: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-orders`);
        let orders = await model.find({}).lean();
        let cartModel = await this.createModel(`${req.params.brand}-cart`);
        let ordersWithItems = await Promise.all( orders.map( val => {
            return this.getCartItemsInArray(req, cartModel,val.cartIds);
        }) );

        let finalOrdersOutput = orders.map( (val,index) => {
            return {
                order: val,
                items: ordersWithItems[index],
                totalCost: ordersWithItems[index].reduce( (total, val, index) => {
                    total = Number(total) + ( Number(val.quantity) * Number(val.items[0].cost) ) ;
                    return total;
                },0)
            }
        });

        let collectionsTable = await Collections.find({brand: req.params.brand}).lean();
        let navRows = collectionsTable.map(val => val.name);
        model = await this.createModel(`${req.params.brand}-notifications`);
        let notifications = {
            count: await model.countDocuments({status: 'unread'}),
            texts: await model.find({status: 'unread'})
        };
        return {
            modelName: `${req.params.brand}-orders`,
            notifications: notifications,
            brand: req.params.brand,
            navRows: navRows,
            orders: finalOrdersOutput.filter( val => val.items.length > 0 ),
        }
    },

    updateOrder: async function(req,res) {
        let order = req.body.order;
        let itemStatus;
        if (req.body.quantityTest != 0) {
            itemStatus = await this.orderDelivered(req,res);
        }
        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOneAndUpdate({_id: order._id}, {$set: {status: order.status, payment: order.payment}}, {new: true});
        let result = {
            order: output,
            item: itemStatus
        };
        return result;
    },

    orderDelivered: async function(req,res) {
        let items = req.body.items;
        switch (true) {
            case (req.body.quantityTest == -1) :
                items = items.map( val => {
                    val.newQty = Number(val.quantity) - Number(val.quantityDiff);
                    return val;
                });
                break;
            case (req.body.quantityTest == 1) :
                items = items.map( val => {
                    val.newQty = Number(val.quantity) + Number(val.quantityDiff);
                    return val;
                });
                break;
            default: 
                return 0;
                break;
        };
        let model = await this.createModel(`${req.params.brand}-items`);
        let output = await Promise.all( items.map(val => model.findOneAndUpdate({_id: mongoose.Types.ObjectId(val.itemId)}, {$set: {quantity: val.newQty}}, {new: true}).lean() ) );
        return output;
    },

    getSizes: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-sizes`);
        let output = await model.find({category: req.params.input}).lean();
        output = output.map( size => {
            Object.values(size).forEach( data => {
                Object.keys(data).forEach(k => data[k] == '' || k == '_id' || k == 'category' ?  delete data[k] : data[k]);
                data['size'] = data['name'];
                delete data['name'];
            });
            return size;
        })
        return output;
    },

    showProperty: async function(req, res) {

        let model = await this.createModel(`${req.params.brand}-properties`);
        let property =  await model.findOne({slug: req.params.input}).lean();
        property.genSelected = req.session.Cards && req.session.Cards.myArray && req.session.Cards.myArray.some( card => card._id == property._id.toString() ) ? 'select' : '' ;
        let suggestedProperties = await model.find({
            $and: [
                { city: property.city },
                { _id:  {
                    $ne : property._id
                }}
                ]
            }).limit(4).lean();
        suggestedProperties = this.matchSelectedProperties(req,res,suggestedProperties);
        let output = {
            slides : await this.getSlides(req,res),
            property: property,
            suggestedProperties: suggestedProperties,
            forms : await this.getForms({msgBoxClient: true, contactForm: true}, req,res),
            allCards : await this.getAllCards(req,res)
        };
        return output;

    },

    showPage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-pages`);
        let output = await model.findOne({slug: req.params.input}).lean();
        model = await this.createModel(`${req.params.brand}-resources`);
        let resources = await model.find({});
    //     let countCart = await this.countItemsInCart(req,res);
        return {
            resources: resources,
            // countCart: countCart,
            forms: await this.getForms({msgBoxClient: true, contactForm: true}, req,res),
            allCards: await this.getAllCards(req,res),
            brand: req.params.brand,
            permit: req.params.permit,
            page: output,
            brand: req.params.brand,
        };
    },

    editPage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-pages`);
        let page = {};
        if (req.params.input != "n") {
             page = await model.findOne({_id: req.params.input}).lean();
        } else {
            page = {
                page: '',
                content: '',
                slug: '',
                _id: this.getMongoId(req,res),
            }
        };
        return {
            page: page,
            brand: req.params.brand,
            permit: req.params.permit,
            resources: await this.fetchResources(req,res),
            modelName: `${req.params.brand}-pages`
        };
    },

    updatePage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-pages`);
        let output = await model.findOneAndUpdate({_id:req.params.input},{$set: 
            {
                content: req.body.output,
                page: req.body.page,
                slug: req.body.slug,
                type: req.body.type
            }
            },{new:true}).lean();

        return output;
    },

    clearNotification: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-notifications`);
        let output = await model.findOneAndUpdate({_id: req.params.input},
            {
                $set : {
                    status: 'read'
                }
            },
            {
                new: true
            }
        );

        return output;

    },

    fetchNotifications: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-notifications`);
        let notifications = {
            count: await model.countDocuments({status: 'unread'}),
            texts: await model.aggregate([
                {
                    $match: {
                        status: 'unread'
                    }
                },
                {
                    $addFields: {
                        created_at: { $dateToString: { format: "%Y-%m-%d · %H:%M", date: "$created_at" } },
                    }
                },
                {
                    $sort : {
                        created_at: -1
                    }
                }
            ])
        };

        return notifications;
    },

    dashboard: async function(req,res) {
        let date = new Date();

        let query = {
            created_at : {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt : new Date()
            },
            payment: {
                $in: [ "Paid (COD)", "Paid (Online Transfer)"]
            }
        };

        req.query.sort = { created_at: -1 };

        let output = await this.fetchOrders(req,query);

        let models = {
            items : await this.createModel(`${req.params.brand}-items`),
            orders : await this.createModel(`${req.params.brand}-orders`),
            users : await this.createModel(`${req.params.brand}-users`),
            pages : await this.createModel(`${req.params.brand}-pages`),
            sizes: await this.createModel(`${req.params.brand}-sizes`)
        }

        let counts = {
            netRevenue : output.reduce( (total,val) => total = total + val.netRevenue , 0 ),
            outOfStock : await models.items.find({quantity:0}).countDocuments(),
            unhandledOrders : await models.orders.find({status: "Order Placed in Store"}).countDocuments(),
            allOrders : await models.orders.find().countDocuments(),
            allProducts: await models.items.find().countDocuments(),
            allEmployees : await models.users.find().countDocuments(),
            staticPages: await models.pages.find().countDocuments(),
            allSizes: await models.sizes.find().countDocuments()
        };

        return {
            resources: await this.fetchResources(req,res),
            brand: req.params.brand,
            notifications: await this.fetchNotifications(req,res),
            counts: counts
        };
    },

    calcProfits: async function(req,from,to) {
        let model = await this.createModel(`${req.params.brand}-orders`);
        var date = new Date();
        let output = await model.aggregate([
            {
                $match: {
                    created_at : {
                        $gte: req.query.from && new Date(req.query.from) || new Date(date.getFullYear(), date.getMonth(), 1),
                        $lt : req.query.to && new Date(req.query.to) || new Date()
                    }
                }
            },{
                $addFields: {
                    cartIds : {
                       $split : [ '$cartIds' , " " ]
                     }
                }
            },{
                $unwind: "$cartIds"
            },{
                $addFields : {
                    cartIds : {
                       $toObjectId : "$cartIds"
                    }
                }
            },{
                $lookup : {
                    from : `${req.params.brand}-carts`,
                    localField : "cartIds",
                    foreignField : "_id",
                    as : "carts"
                }
            },{
                $project : {
                    orderNo : 1,
                    mobile : 1,
                    created_at: 1,
                    itemQuantity : {
                        $arrayElemAt : [ "$carts.quantity" , 0 ]
                    },
                    itemId : {
                        $arrayElemAt : [ "$carts.itemId" , 0 ]
                    }
                }
            },{
                $addFields : {
                    itemId : {
                        $toObjectId : "$itemId"
                    }
                }
            },{
                $lookup : {
                    from : `${req.params.brand}-items`,
                    localField : "itemId",
                    foreignField : "_id",
                    as : "item"
                }
            },{
                $addFields : {
                    item : {
                        $arrayElemAt : [ "$item.name" , 0 ]
                    },
                    itemQuantity : {
                        $toInt : "$itemQuantity"
                    },
                    purchaseCost : {
                        $toInt : {
                            $arrayElemAt : [ "$item.purchase" , 0 ]
                        }
                    },
                    sellCost : {
                        $toInt : {
                            $arrayElemAt : [ "$item.cost" , 0 ]
                        }
                    }
                }
            },{
                $group : {
                    _id : {
                        orderNo : "$orderNo",
                        mobile : "$mobile",
                        created_at : "$created_at"
                    },
                    purchaseCost: { $sum: { $multiply: [ "$purchaseCost", "$itemQuantity" ] } },
                    sellCost: { $sum: { $multiply: [ "$sellCost", "$itemQuantity" ] } }
                }
            },{
                $project : {
                    _id : 0,
                    orderNo : "$_id.orderNo",
                    mobile : "$_id.mobile",
                    created_at: { $dateToString: { format: "%Y-%m-%d", date: "$_id.created_at" } },
                    purchaseCost : 1,
                    sellCost : 1,
                    netRevenue : {
                        $subtract : [ "$sellCost" , "$purchaseCost" ]
                    }
                }
            }
        ]);

        let grossResult = {
            totalOrders : output.reduce( (total,val) => total = total + 1 , 0 ),
            purchaseCost : output.reduce( (total,val) => total = total + val.purchaseCost , 0 ),
            sellCost : output.reduce( (total,val) => total = total + val.sellCost , 0 ),
            netRevenue : output.reduce( (total,val) => total = total + val.netRevenue , 0 )
        };
        let result = {
            orders : output,
            gross : grossResult
        }
        return result;
    },

    sendSlackMsg: async function(req, res, token, channelId) {

        token = token || req.query.token;
        channelId = channelId || req.query.channelId;
        let result;
        try {
            result = await web.chat.postMessage({
                token : token, 
                text: `Great ! Your Slack channel is working. — ${req.params.brand}`,
                channel: channelId,
            });
            return {result}
        } catch(e) {
            return {status: 400, error: e.data.error}
        }
    },

    // pjax modules

    profits: async function(req,res) {
        var date = new Date();
        let from = req.query.from && new Date(req.query.from).setHours(00,00,00) || new Date(date.getFullYear(), date.getMonth(), 1).setHours(00,00,00); 
        let to = req.query.to && new Date(req.query.to).setHours(23,59,59) || new Date().setHours(23,59,59);
        let query = {
            created_at : {
                $gte: req.query.from && new Date(req.query.from) || new Date(date.getFullYear(), date.getMonth(), 1),
                $lt : req.query.to && new Date(req.query.to) || new Date()
            },
            payment: {
                $in: [ "Paid (COD)", "Paid (Online Transfer)"]
            }
        };

        req.query = processQuery(req.query);

        let output = await this.fetchOrders(req,query);

        let grossResult = {
            totalOrders : output.reduce( (total,val) => total = total + 1 , 0 ),
            purchaseCost : output.reduce( (total,val) => total = total + val.orderPurchasePrice, 0 ),
            sellCost : output.reduce( (total,val) => total = total + val.orderSellPrice , 0 ),
            netRevenue : output.reduce( (total,val) => total = total + val.netRevenue , 0 )
        };
        return {
            orders: output,
            gross : grossResult,
            fromDate: new Date(from).toISOString().substr(0, 10),
            toDate: new Date(to).toISOString().substr(0, 10),
            brand: req.params.brand,
        };
    },

    outOfStock: async function(req,res) {

        var query = processQuery(req.query);
        delete query.filter._pjax;

        let model = await this.createModel(`${req.params.brand}-items`);
        let output = await model.aggregate([
            {
                $match: {
                    quantity: "0"
                } 
            },{
                $addFields: {
                    updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    quantity: { $toInt : "$quantity" },
                    cost : { $toInt: "$cost" },
                    purchase : {$toInt : "$purchase" },
                }
            },{
                $addFields : {
                    profit : { $subtract : [ "$cost" , "$purchase" ] }
                }
            },{
                $sort: query.sort
            }
        ]);

        return {
            items: output,
            brand: req.params.brand
        }

    },

    fetchOrders: async function(req,query) {
        let model = await this.createModel(`${req.params.brand}-orders`);
        let orders = await model.aggregate([
            {
                $match: query
            },{
                $addFields: {
                    cartIds: {
                        $split: [ "$cartIds", " " ]
                    }
                }
            },{
                $addFields: {
                    cartIds : {
                        $map : {
                            input : "$cartIds",
                            as : "cartIds",
                            in : {
                                $toObjectId : "$$cartIds"
                            }
                        }
                    }
                }
            },{
                $lookup : {
                    from : `${req.params.brand}-carts`,
                    localField : "cartIds",
                    foreignField : "_id",
                    as : "carts"
                }
            },{
                $unwind : "$carts"
            },{
                $addFields : {
                    itemId : {
                        $toObjectId : "$carts.itemId"
                    }
                }
            },{
                $lookup : {
                    from : `${req.params.brand}-items`,
                    localField : "itemId",
                    foreignField : "_id",
                    as : "item"
                }
            },{
                $addFields : {
                    "carts.item" : {
                        $arrayElemAt : [ "$item" , 0 ]
                    },
                    cartQuantity : {
                        $toInt : "$carts.quantity"
                    },
                    sellCost : {
                        $toInt : {
                            $arrayElemAt : [ "$item.cost" , 0 ]
                        }
                    },
                    purchaseCost : {
                        $toInt : {
                            $arrayElemAt : [ "$item.purchase", 0]
                        }
                    }
                }
            },{
                $addFields : {
                    "carts.totalCost" : {
                        $multiply : [ "$sellCost" , "$cartQuantity" ]
                    }
                }
            },{
                $group : {
                    _id: {
                        _id: "$_id",
                        orderNo : "$orderNo",
                        mobile: "$mobile",
                        name: "$name",
                        address: "$address",
                        created_at: "$created_at",
                        status: "$status",
                        payment: "$payment",
                    },
                    cart : {
                        $addToSet : "$carts"
                    },
                    orderSellPrice: {
                        $sum : {
                            $multiply : [ "$cartQuantity" , "$sellCost" ]
                        }
                    },
                    orderPurchasePrice: {
                        $sum : {
                            $multiply : [ "$cartQuantity" , "$purchaseCost" ]
                        }
                    }
                }
            },{
                $project : {
                    _id: 0,
                    _id: "$_id._id",
                    orderNo : "$_id.orderNo",
                    mobile : "$_id.mobile",
                    name : "$_id.name",
                    address: "$_id.address",
                    status: "$_id.status",
                    payment: "$_id.payment",
                    cart : "$cart",
                    created_at: { $dateToString: { format: "%Y-%m-%d", date: "$_id.created_at" } },
                    orderSellPrice : 1,
                    orderPurchasePrice : 1,
                    netRevenue : { $subtract : [ "$orderSellPrice" , "$orderPurchasePrice" ] }
                }
            },{
                $sort : req.query.sort
            }
         ]);
        return orders;
    },

    unhandledOrders: async function(req,res) {

        req.query = processQuery(req.query);
        delete req.query.filter._pjax;

        req.query.filter.status = 'Order Placed in Store';

        let orders = await this.fetchOrders(req,req.query.filter);

        return {

            brand: req.params.brand,
            orders: orders
        }

    },

    updateOrderStatuses: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-orders`);

        let output = await model.findOneAndUpdate(
            { 
                _id : req.body.myId
            },{ 
                $set : { 
                    status: req.body.orderStatus,
                    payment: req.body.paymentStatus,
                }
            },{
                new: true
            }
        );

        return output;
    },

    allOrders: async function(req,res) {

        var date = new Date();
        let from = req.query.from && new Date(req.query.from).setHours(00,00,00) || new Date(date.getFullYear(), date.getMonth(), 1).setHours(00,00,00); 
        let to = req.query.to && new Date(req.query.to).setHours(23,59,59) || new Date().setHours(23,59,59);

        req.query = processQuery(req.query);
        delete req.query.filter._pjax;
        delete req.query.filter.to;
        delete req.query.filter.from;

        query = Object.values(req.query.filter).length > 0 ? req.query.filter :  {};
        let output = await this.fetchOrders(req,query);

        return {
            orders: output,
            fromDate: new Date(from).toISOString().substr(0, 10),
            toDate: new Date(to).toISOString().substr(0, 10),
            filterApplied: Object.values(req.query.filter).length > 0,
            count: output.length,
            brand: req.params.brand,
        };
    },

    allProducts : async function(req,res) {

        var query = processQuery(req.query);
        delete query.filter._pjax;

        let model = await this.createModel(`${req.params.brand}-items`);
        let output = await model.aggregate([
            {
                $match: query.filter 
            },{
                $addFields: {
                    updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    quantity: { $toInt : "$quantity" },
                    cost : { $toInt: "$cost" },
                    purchase : {$toInt : "$purchase" },
                }
            },{
                $addFields : {
                    profit : { $subtract : [ "$cost" , "$purchase" ] }
                }
            },{
                $sort: query.sort
            }
        ]);

        return {
            items: output,
            filterApplied: Object.values(query.filter).length > 0,
            count: output.length,
            brand: req.params.brand
        }

    },

    allSizes : async function(req,res) {
        var query = processQuery(req.query);
        delete query.filter._pjax;
        let model = await this.createModel(`${req.params.brand}-sizes`);
        let sizes = await model.aggregate([
            {
                $match: query.filter
            }, {
                $sort: query.sort
            }
        ]);

        return {
            brand: req.params.brand,
            sizes: sizes,
            count: sizes.length
        }
    },

    allEmployees: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-users`);
        var query = processQuery(req.query);
        delete query.filter._pjax;

        let output = await model.aggregate([
            {
                $match: query.filter 
            },{
                $addFields: {
                    updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                }
            },{
                $sort: {
                    updatedAt: -1
                }
            }
        ]);
        return {
            users: output,
            brand: req.params.brand
        }
    },

    branding: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-resources`);
        let output = await model.aggregate([
            {
                $match: {}
            },{
                $addFields: {
                    logo : {
                        $split: [ "$logo" , " " ]
                    }
                }
            }
        ]);

        return {
            resources: output,
            brand: req.params.brand,
        }
    },

    updateResources: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-resources`);
        let output = await model.findOneAndUpdate(
            {
                brandName: req.params.brand
            },{
                $set: {
                    logo: req.body.logo,
                    twitter: req.body.twitter,
                    facebook: req.body.facebook,
                    insta: req.body.insta,
                    youtube: req.body.youtube,
                    scripts: req.body.scripts,
                    email: req.body.email,
                    mobile: req.body.mobile,
                    slackToken: req.body.slackToken,
                    slackChannelId: req.body.slackChannelId,
                    address: req.body.address,
                    slogan: req.body.slogan
                }
            },{
                new: true
            }
        );

        return output;
    },

    showPages: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-pages`);
        var query = processQuery(req.query);
        delete query.filter._pjax;
        let pages = await model.aggregate([
            {
                $match: query.filter
            },{
                $addFields: {
                    content : {
                        $substr : [ "$content" , 0 , 300 ]
                    },
                    updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                }
            }
        ]);
        let collectionsTable = await Collections.find({brand: req.params.brand}).lean();
        let navRows = collectionsTable.map(val => val.name);
        model = await this.createModel(`${req.params.brand}-notifications`);
        let notifications = {
            count: await model.countDocuments({status: 'unread'}),
            texts: await model.find({status: 'unread'})
        };
        return {
            pages: pages,
            modelName: `${req.params.brand}-pages`,
            notifications: notifications,
            brand: req.params.brand,
            navRows: navRows,
            filterApplied: Object.values(query.filter).length > 0,
            permit: req.params.permit,
            forms: await this.getForms({msgBoxClient: true, contactForm: true}, req,res),
            allCards: await this.getAllCards(req,res),
        }
    },

    createIndexedModel : async function(modelName) {

        let modelExistsAlready = Object.keys(mongoose.models).some(val => val == modelName);
        if (modelExistsAlready) { mongoose.models[modelName] = ''; };

        let collection = await Collections.findOne({name: modelName}).lean();
        let schema = new mongoose.Schema(collection.properties);

        switch (true) {
            case (/orders/.test(modelName)) : 
                schema.index = { orderNo: "text", address: "text", mobile: "text", name: "text", status: "text", payment: "text" };
                break;
            case (/items/.test(modelName)) :
                schema.index = { name: "text", purchase: "text", cost: "text", size: "text", school: "text", house: "text", details: "text", category: "text" };
                break;
            case (/users/.test(modelName)) : 
                schema.index = { name: "text", email: "text", role: "text"};
                break;
            case (/resources/.test(modelName)) :
                schema.index = { brandName: "text", twitter: "text", facebook: "text", youtube: "text", insta: "text", scripts: "text" };
                break;
        };

        return mongoose.model(modelName, schema);

    },

    searchDashboard: async function(req,res) {

        let models = {
            orders: await this.createModel(`${req.params.brand}-orders`),
            items: await this.createModel(`${req.params.brand}-items`),
            users: await this.createModel(`${req.params.brand}-users`),
            resources: await this.createModel(`${req.params.brand}-resources`),
            pages: await this.createModel(`${req.params.brand}-pages`),
        };

        let keyWord = new RegExp(req.body.text, 'i');

        let output = {
            orders: await models.orders.find(
                { 
                    $or : [ 
                        {
                            orderNo: keyWord
                        }, {
                            address: keyWord
                        }, {
                            mobile: keyWord
                        }, {
                            name: keyWord
                        }  
                    ] 
                },{
                    _id: 0,
                    cartIds: 0,
                    created_at: 0,
                    __v: 0,
                    updatedAt: 0,
                    sessionId: 0,
                }).limit(4),
            items: await models.items.find(
                { 
                    $or : [ 
                        {
                            name: keyWord
                        }, {
                            purchase: keyWord
                        }, {
                            cost: keyWord
                        }, {
                            size: keyWord
                        }, {
                            school: keyWord
                        }, {
                            house: keyWord
                        }, {
                            details: keyWord
                        }, {
                            category: keyWord
                        } 
                    ] 
                },{
                    name: 1,
                    purchase: 1,
                    cost: 1,
                    size: 1,
                    school: 1,
                    house: 1,
                    details: 1,
                    category: 1
                }).limit(4),
            users: await models.users.find(
                { 
                    $or : [ 
                        {
                            name: keyWord
                        }, {
                            email: keyWord
                        }, {
                            role: keyWord
                        } 
                    ] 
                },{
                    _id: 0,
                    name: 1,
                    email: 1,
                    role: 1
                }).limit(4),
            resources: await models.resources.find(
                { 
                    $or : [ 
                        {
                            brandName: keyWord
                        }, {
                            twitter: keyWord
                        }, {
                            facebook: keyWord
                        }, {
                            youtube: keyWord
                        }, {
                            insta: keyWord
                        }
                    ] 
                },{
                    _id: 0,
                    brandName: 1,
                    twitter: 1,
                    facebook: 1,
                    youtube: 1,
                    insta: 1
                }).limit(4),
            pages: await models.pages.aggregate([
                {
                    $match : {
                    $or : [
                        {
                            para: keyWord
                        }, {
                            page: keyWord
                        }, {
                            content: keyWord
                        }
                    ]
                    }
                },{
                    $addFields: {
                        content : {
                            $substr : [ "$content" , 0 , 100 ]
                        },
                        updatedAt: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    }
                }
            ]).limit(4)
        }

        io.sockets.emit('newOrder', 12);

        return output;
    },

    // Create backup of app
    
    createAppBackup : async function(req,res) {

        let names = await Collections.find({},{name:1});

        let models  = await Promise.all( names.map( val => this.createModel(val.name) ) ); 

        let outputs = await Promise.all( models.map( (val,index) => val.find({}) ) );

        outputs = outputs.map( (val,index) => {
            return {
                name: names[index].name,
                data: val
            }
        });

        let file = await fs.writeFile(
            './static/backup.json', 
            JSON.stringify( outputs, 0 , 2 ) , 
            (err) => {
                if (err) {
                  return 'Failed to backup';
                }
                return 'Successful';
            });

        return {success: "done"};

    },

    loadBackUp : async function(req,res) {

        let file = await new Promise( (resolve, reject) => {

            fs.readFile('./static/backup.json', 'utf8', (err, data) => {
                if (err) reject(err)
                resolve( JSON.parse(data) );
            });

        }); 

        // first load collections from the file

        let collectionFile = file.filter( val => val.name === 'collections' )[0];

        try { let collectionDrop = await mongoose.connection.db.dropCollection('collections'); } 

        catch (e) { console.log(e) }

        let collectionSave = await Promise.all( collectionFile.data.map( val => Collections.findOneAndUpdate({_id: val._id}, val, {upsert: true}) ) );

        // remove collections from file now

        file = file.filter( val => val.name !== 'collections' );

        // let collectionSave = await Collections.insertMany( collectionFile.data );
        
        let models = await Promise.all( file.map( val => this.createModel(val.name) ) );

        let funcs = [];

        models.forEach( (val,index) => {
            file[index].data.forEach( (data) => {
                funcs.push({
                    model: val,
                    data: data
                })
            })
        });

        let emptyAllCollections = await Promise.all( funcs.map( val => val.model.deleteMany({}) ) );
        let outputs = await Promise.all( funcs.map( val => val.model.findOneAndUpdate({_id: val.data._id}, val.data, {upsert: true}) ) );

        return {success: true};

    },

    challenges: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-selected`);
        let selected = await model.aggregate([
            {
              $match:
                {
                  user: req.session.person.email
                },
            },
            {
              $lookup:
                {
                  from: "challenge-types",
                  localField: "slug",
                  foreignField: "slug",
                  as: "result",
                },
            }
        ]);
        return {
            sessionExists: true,
            selected: selected
        };
    },

    openChallenge: async function(req,res) {
        // if user has this challenge in selected list than fine else route to payment page and welcome screen
          let box = [];
          for (var i = 1; i < 31; i++) {
            switch (true) {
              case i == 1:
                box.push({
                  number: i,
                  past: 'true',
                  locked: 'true',
                  logged: 'true',
                  feelingType: 1,
                  feeling: '/emojis/depressed.svg',
                  comments: 'I am feeling kind of happy today. Let`s see till what point can I get moving'
                })
                break;
              case i == 2:
                box.push({
                  number: i,
                  past: 'true',
                  locked: 'true',
                  logged: 'true',
                  feelingType: 2,
                  feeling: '/emojis/exhausted.svg',
                  comments: 'I am feeling kind of happy today. Let`s see till what point can I get moving'
                })
                break;
              case i == 3:
                box.push({
                  number: i,
                  past: 'true',
                  locked: 'true',
                  logged: 'true',
                  feelingType: 3,
                  feeling: '/emojis/bored.svg',
                  comments: 'I am feeling kind of happy today. Let`s see till what point can I get moving'
                })
                break;
              case i == 4:
                box.push({
                  number: i,
                  past: 'true',
                  locked: 'true',
                  logged: 'true',
                  feelingType: 4,
                  feeling: '/emojis/happy.svg',
                  comments: 'I am feeling kind of happy today. Let`s see till what point can I get moving'
                })
                break;
              case i == 5:
                box.push({
                  number: i,
                  past: 'true',
                  locked: 'true',
                  logged: 'true',
                  feelingType: 5,
                  feeling: '/emojis/flow.svg',
                  comments: 'I am feeling kind of happy today. Let`s see till what point can I get moving'
                })
                break;
              case i == 6:
                box.push({
                  number: i,
                  present: 'true',
                  locked:'false'
                })
                break;
              default:
                box.push({
                  number: i,
                  future: 'true',
                  locked:'true'
                });
            }

          }
        return {
            box: box
        }
    },

    dashboardBlogs: async function(req,res) {
        req.params.input = 'life-blogs';
        req.isLocal = true;
        let output = await this.showCollection(req,res);
        req.params.theme = 'life';
        return output;
    },

    addNewBlog: async function(req,res) {
        return {
            blog: {
                _id: this.getMongoId(req,res),
            }
        };
    },

    editThisBlog: async function(req,res) {
        req.params.module = "addNewBlog";
        let model = await this.createModel(req.params.input);
        let output = await model.findOne({_id: req.query._id}).lean();
        output.date = this.getFormattedDate(output.date);
        return {
            blog: output
        };
    },

    saveBlog: async function(req,res) {
        let model = await this.createModel('life-blogs');
        let myId = req.body._id;
        delete req.body._id;
        let output = await model.findOneAndUpdate({
            _id: myId 
        },
            req.body
        ,{
            upsert: true
        });
        return output;
    },

    publishBlog: async function(req,res) {
        let model = await this.createModel('life-blogs');
        let output = await model.findOneAndUpdate({
            _id: req.body._id
        },{
            publish: req.body.publish
        });
        return output;
    },

    getFormattedDate : function(inputDate) {
        var date = new Date(inputDate);
        return date.getFullYear() + '-' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())); 
    },

    dateBlogHeader: function(date) {

        let d = new Date(date);
        let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
        let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
        let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
        return `${da} ${mo}, ${ye}`;

    },

    convertStringToArticle: function( string ) {
        let body = string.split('\n').map(val => {
            if (val == '') return undefined;
            return {
              type: val.split(': ')[0].indexOf('.') != -1 ? val.split(': ')[0].split('.')[0] : val.split(': ')[0],
              msg: val.split(': ')[1].trim(),
              class: val.split(': ')[0].indexOf('.') != -1 ? val.split(': ')[0].split('.').slice(1,4).join(' ') : ''
            }
          }).filter( val => val != undefined );
        return body;
    },

    openBlog: async function(req,res) {
        let model = await this.createModel('life-blogs');
        let modelComments = await this.createModel('life-comments');
        let output = await model.findOne({slug: req.params.input}).lean();
        let body = this.convertStringToArticle(output.body);
        output.date = this.dateBlogHeader(output.date);
        return {
            output: output,
            body: body,
            tags: output.tags.split(','),
            person: req.session.person && req.session.person.email,
            comments: await modelComments.find({slug: output.slug}).lean()
        };
    },

    subscribeCustomer: async function(req,res) {

        console.log( chalk.bold.red('Subscribing a new customer') );

        let model = await this.createModel(`${req.params.brand}-subscribers`);
        
        let isSubscribed = await model.findOne({
            email: req.body.email, 
            validation: true, 
            isUnsubscribed: false, 
        }).lean();

        console.log(isSubscribed);

        if (isSubscribed != null) {
            return {
                status: 404,
                error: 'You have already subscribed to the mailing list'
            }
        };
                
        // Add this customer with the special subscription code
        let output = await model.findOneAndUpdate(
            {
                email: req.body.email
            },{
                firstName: req.body.firstName, 
                lastName: req.body.lastName, 
                email: req.body.email, 
                validation: false, 
                isUnsubscribed: false,
                lists: 'public', 
                list: "public"
            }, {
                upsert: true, 
                new: true
            }
        );

        console.log(output);

        // Send an Email to the customer saying "Please click on this link to verify your subscription request"
        let url = '';

        console.log("context of subscribe customer");

        console.log(output);

        url = process.env.url + `/${req.params.brand}/gen/page/verifyEmail/n?email=${req.body.email}&uniqueCode=${output._id}`;

        let mailResponse;
        let mailModel = await this.createModel(`${req.params.brand}-newsletters`);
        let mail = await mailModel.findOne({slug: "verify-email"}).lean();


        if ( mail != null ) {

            mailResponse = await this.sendMail({
                type: "database", 
                from: process.env.zoho, 
                context: {
                    firstName: output.firstName, 
                    lastName: output.lastName, 
                    _id: output._id, 
                    env: process.env.url, 
                    email: output.email,
                }, 
                toEmail: req.body.email, 
                msg: mail.body, 
                subject: mail.subject, 
                brand: req.params.brand
            });

        } else {

            mailResponse = await this.sendMail({
                from: process.env.zoho, 
                template: 'verifyEmail', 
                context: {
                    verifyUrl : url,
                    Id: output._id, 
                    email: output.email,
                }, 
                toEmail: req.body.email, 
                subject: 'Verify Email', 
                brand: req.params.brand
            });

        };

        let logModel = await this.createModel(`${req.params.brand}-log`);
        let logEntry;

        logEntry = await logModel.create({
            status: 200, 
            text: `Email ${mail && mail.slug || 'verify-email'} sent to ${output.email}`, 
            meta: JSON.stringify(mailResponse)
        });

        return {
            output
        }

    },

    sendMail: async function({type, template, context, toEmail, subject, brand, msg}) { 
        // min essential params are toEmail, subject, brand, msg

        console.log("sendMail");
        console.log({ brand, toEmail });

        let model = await this.createModel(`myapp-themes`);
        let output = await model.findOne({brand: brand}).lean();

        let transporter = nodemailer.createTransport({
          host: output.brandEmailServerLoc.trim(), 
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: output.brandEmail.trim(), 
            pass: output.brandEmailPassword.trim(),
          },
        });

        let hbstemplate, html;

        if (context != undefined) {

            if (type == "database") {

                // I need type, context, toEmail, subject, brand, and msg
                hbstemplate = hbs.compile(msg);
                html = hbstemplate({data: context});

            } else {

                let file = await new Promise( (resolve, reject) => {

                    fs.readFile(`./views/emails/${template}.hbs`, 'utf8', (err, data) => {
                        if (err) reject(err)
                        resolve(data);
                    });

                });

                hbstemplate = hbs.compile(file);
                html = hbstemplate({data: context});

            }

        } else {

            html = msg; // this is now a simple MSG

        }

        var mail = {
           from: output.brandEmail,
           to: toEmail,
           subject: subject,
           html: html
        }

        const info = await transporter.sendMail(mail);

        return info;

    },

    ticketAndMail: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-resources`);
        let resources = (await model.find().lean())[0];
        let output = await this.sendMail({
            from: `Qasim Ali<${process.env.zoho}>`,
            // from: req.body.name, 
            toEmail: resources.email, 
            subject: `New Ticket - ${req.body.name} - ${req.body.contact}`, 
            msg: req.body.msg.replace(/\r\n{1,}/g,'<br>') + "<br>From;<br>" + req.body.name + "<br>" + req.body.contact
        });

        let model2 = await this.createModel(`${req.params.brand}-tickets`);
        let storeTicket = await model2.create({
            name: req.body.name,
            contact: req.body.contact,
            msg: req.body.msg,
            helper: resources.name + ' ' + resources.email,
            no: await model2.countDocuments()+1,
            status: 'pending',
            rating: 'pending'
        });

        return storeTicket;

    },

    showTickets : async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-tickets`);
        let output = await model.find().lean();
        return output;

    },

    showTicket: async function(req,res) {

        let query = processQuery(req.query);

        let model = await this.createModel(`${req.params.brand}-tickets`);
        let output = await model.findOne({_id: req.params.input}).lean();
        output.msg = output.msg.replace(/\r\n{1,}/g,'<br>') ;
        output.allCards = this.getAllCards(req,res) ;

        return output;

    },

    changeTicketStatus: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-tickets`);
        let output = await model.findOneAndUpdate({_id: req.params.input}, { $set: { status: req.query.status } }).lean();
        return output;

    },
            
    verifyEmail: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-subscribers`);
        let output = await model.findOneAndUpdate({
            email: req.query.email,
            _id: req.query.uniqueCode,
            validation: false 
        },{
            validation: true,
        },{
            new: true
        });

        if (output != null) {
            this.sendEmailWithTemplate(req.params.brand, 'welcomeEmail', output);
            return {
                brand: req.params.brand,
                msg: 'Email Verified. Thank you for subscribing to my weekly newsletter.',
            }
        } else {
            return {
                brand: req.params.brand,
                msg: 'Sorry — this link does not exist.'
            }
        }

    },

    runTimer: async function(req,res) {
        if (req.params.brand == 'life') {
            return await this[`${req.params.brand}Timer`]();
        } else {
            return {success: 'No timer is configured for this brand'}
        };
    },

    lifeTimer: async function(req,res) {

        let model = await this.createModel('life-newsletters');

        let pendingLetters = await model.find({
            publishTime: {
                $gte: new Date()
            }
        }).lean();

        console.log("pendingLetters");
        console.log(pendingLetters);

        if (pendingLetters.length == 0) return {success: 'Currently there are no newsletters pending Publish'};

        let output = pendingLetters.map( val => this.setTimerToPublish(val) );

        return {
            success: 'Timer for website Life is now running',
            status: output,
        }

    },

    setTimerToPublish: function(letter) {

        var now = new Date();
        var publishTime = letter.publishTime;

        var millisTillPublish = new Date(letter.publishTime) - now;

        setTimeout( async () => {

            let output;

            let model = await this.createModel(`life-subscribers`);

            output = await model.find({
                lists: letter.list,
                validation: true,
                isUnsubscribed: false
            }).lean();

            let mailSent = await this.sendBulkEmailWithTemplate('life', letter.slug, output);

            let url = process.env.url;

            let notifyOnTelegram = await this.axiosRequest({
                URL: "https://v1.nocodeapi.com/punch__lines/telegram/bcvUoCOJfShwnjlS",
                data: {
                    Slug: letter.slug,
		    Accepted: mailSent.reduce( (total, val) => total += val.accepted  != ''  ? val.accepted[0] : ''  + ',', '' ),
		    Rejected: mailSent.reduce( (total, val) => total += val.rejected  != ''  ? val.rejected[0] + ',' : ''  + '', '' ),
                    People: mailSent.length,
                    URL: url + "/life/gen/page/showNewsletter/" + letter.slug
                },
                method: 'POST',
            });

        }, 000 , letter);
        // }, millisTillPublish, letter);

        return `Publishing <b>${letter.slug}</b> in - ${Math.floor(millisTillPublish / 1000 / 60)} minutes`;

    },

    sendBulkEmailWithTemplate: async function( brand, templateSlug, subscribers ) {

        let model = await this.createModel(`${brand}-newsletters`);
        let letter = await model.findOne({slug: templateSlug}).lean();
        
        let arrayOfPromises = subscribers.map( val => {

            return this.sendMail({
                from: `Qasim Ali<${process.env.zoho}>`,
                template: 'lifeNewsletter',
                context: {
                    body: this.convertStringToArticle(letter.body),
                    Id: val._id,
                    email: val.email,
                    url: process.env.url, 
                },
                toEmail: val.email,
                subject: letter.subject, 
                brand: brand
            });

        });

        let sentMails = await Promise.all( arrayOfPromises );

        return sentMails;

    },

    sendEmailWithTemplate: async function(brand, templateSlug, subscriber) {

        let model = await this.createModel(`${brand}-newsletters`);
        let output = await model.findOne({slug: templateSlug}).lean();
        if (output == null) return console.log( chalk.bold.red( 'COULD NOT SEND MAIL BECAUSE SLUG WAS NOT FOUND' ) );

        let sentMails = await this.sendMail(
            {
                from: `Qasim Ali<${process.env.zoho}>`,
                template: 'lifeNewsletter', 
                context: {
                    body: this.convertStringToArticle(output.body),
                    Id: subscriber._id,
                    email: subscriber.email ,
                    url: process.env.url, 
                    unsubscribeUrl: process.env.url+`/life/gen/page/unsubscribeMe/n?email=${subscriber.email}&Id=${subscriber._id}`
                }, 
                toEmail: subscriber.email, 
                subject: output.subject, 
                brand: brand
            }
        );
    },

    unsubscribeMe: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-subscribers`);
        let output = await model.deleteOne({_id: req.query.Id, email: req.query.email}).lean();

        console.log("... after unscribing");
        console.log(output);

        if (output != null) {
            return {
                msg: 'You have successfully unsubscribed from my mailing list. You will not receive my future newsletters / important announcements and most cool things I am doing. :p',
                brand: req.params.brand
            }
        } else {
            return {
                msg: 'Sorry something bad happened. Please leave an email to Qasim at <!-- <a href="mailto:qasimali24@gmail.com>qasimali24@gmail.com</a> --> and he will manually unsubscribe you.',
                brand: req.params.brand
            }
        };

    },

    axiosRequest: async function({ method, data, URL }) {

        let output;

        if (method == 'post' || method == 'POST') {

            output = await axios.post(URL, data)
                      .then(res => {
                          console.log(res);
                          return res;
                      })
                      .catch(error => {
                          console.error(error.response.data)
                          return error.response.data;
                      })

        }

        if (method == 'put' || method == "PUT") {
            output = await axios.put(URL, data).then( res => res ).catch( err => err );
        }

        if (method == 'get' || method == "GET") {
            output = await axios.get(URL).then( res => res ).catch( err => err );
        }

        return output;
        
    },

    showNewsletter: async function(req,res) {

        // PLACE VIEW BUTTON ON THE FORM > AND CHECK WHAT IT LOOKS LIKE WHEN LOADED IN TO THE BROWSER
        
        // req.params.theme = "emails";
        // req.params.module = "lifeNewsletter";

        let model = await this.createModel(`${req.params.brand}-newsletters`);
        let output = await model.findOne({slug: req.params.input}).lean();

        // //console.log(output);

        return {
            output: output,
            body: await this.convertStringToArticle(output.body),
            url: process.env.url,
            email: 'doNotRemember',
            Id: 'doNotRemember'
        }

    },

    fetchAirtable: async function(value) {

        let string = "";
        switch (true) {
            case (value == 'todos') :
                string = "https://v1.nocodeapi.com/punch__lines/airtable/WuNbPFGxKERSqrOC?tableName=features"
                break;
            default: 
                return {
                    status: 404,
                    error: 'Not Allowed'
                }
        }

        let output = await this.axiosRequest({
            URL: string,
            method: "GET"
        });

        return output;
    },

    roadMap: async function(req,res) {
        let output = await this.fetchAirtable('todos');
        // //console.log( output.data.records );
        return {
            list: output.data.records.map( val => val.fields )
        }
    },

    emptyFile: async function(req,res) {

        return {
            success: "true"
        }

    },

    getJSONFile: async function(req, res) {

        console.log("get JSON file");

        let readJSONFile = async function(path) {

            let file = await new Promise( (resolve, reject) => {

                fs.readFile(path, 'utf8', (err, data) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve( data );
                });

            }); 

            return file;

        };

        let file;

        if (req.params.input == 'n') {
            file = false;
        } else {
            file = JSON.parse(await readJSONFile(`./static/${req.params.theme}/${req.params.input}.json`)) ;
        };

        console.log(file);
        console.log("xxxxxxxxxx");

        return {
            json: file
        }

    }, 

    readFromJSON: async function(req,res) {

        try {
            let theme = req.params.theme;

            console.log("create fake sessions for this theme like order and all to make sure all pages open just fine");

            req.params.theme = 'root';

            return {
                msg: 'hello world',
                brand: req.params.brand,
                manualInput: req.query.hasOwnProperty("manualInput") ? req.query.manualInput : "n",
                pageName: req.params.input,
            };


        } catch(e) {
            console.log(e);
        }

    }, 

    editWeb: async function(req,res) {

        let theme = req.params.theme;
        req.params.theme = 'root';

        console.log("create fake sessions for this theme like order and all to make sure all pages open just fine");

        return {
            msg: 'hello world',
            brand: req.params.brand,
            manualInput: req.query.hasOwnProperty("manualInput") ? req.query.manualInput : "n",
            pageName: req.params.input,
        };

        let file;
        let readHBSFile = async function(path) {

            let file = await new Promise( (resolve, reject) => {

                fs.readFile(path, 'utf8', (err, data) => {
                    if (err) {
                        //console.log(err);
                        reject(err);
                    }
                    resolve( data );
                });

            }); 

            return file;

        };

        if (req.params.input == 'n') {
            file = false;
        } else {
            file = await readHBSFile(`./views/${theme}/${req.params.input}.hbs`);
        }

        return {
            msg: 'hello world',
            file: file,
            brand: req.params.brand,
            manualInput: req.query.hasOwnProperty("manualInput") ? req.query.manualInput : "n",
            pageName: req.params.input,
        }

    },

    saveWeb: async function(req,res) {

        let writeFile = async function(path,data) {

            let file = await new Promise( (resolve, reject) => {

                fs.writeFile(path, data, (err, data) => {
                    if (err) {
                        //console.log(err);
                        reject(err);
                    }
                    resolve( data );
                });

            }); 

            return file;

        };

        let file = await writeFile(`./views/${req.params.theme}/${req.params.input}.hbs`, req.body.html);

        return {
            msg: 'file has been saved in desired directory'
        }

    },

    // HERE I STARTED WORKING ON PROPERTY WEBSITE

    createProject: async function(req,res) {
        return {
            success: true
        }

    },

    createdProj: async function(req,res) {

        let missingValues = Object.values(req.body).some( val => val.length == 0 );

        let redirect = function(msg) { 
            req.params.module = "createProject";
            return {
                errorMsg: msg ,
                alreadyExists: req.body.brandName
            } 
        }

        if (missingValues == true) {
            return redirect("Some values are missing. Please fill out complete form.");
        };

        // create a new directory with this project Name — DONE 
        // create all the listed files inside this directory — DONE
        // create brand-users
        // add this user / email / password to myapp-users
        // send all the credentials to the createdProj folder

        var dir = `./views/${req.body.projName}`;

        let createFile = function(dir, name) {
            return new Promise ((resolve,reject) => {
                fs.writeFile(`${dir}/${name}.hbs`, '', (err) => {
                    if (err) {
                      return reject(err);
                    }
                    resolve();
                });
            });
        };

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
            let files = req.body.files.includes(",") ? req.body.files.split(',') : ['landingPage', req.body.files];
            await Promise.all( files.map( val => createFile(dir, val) ) );
        }

        let createUsersCollection = async function({brandName}) {

            let data = {
                name: brandName+'-users',
                brand: brandName,
                properties: {
                    "name" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    },
                    "email" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    },
                    "password" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    },
                    "role" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    }
                },
                redirect: ''
            };

            await Collections.findOneAndUpdate({name: brandName-"users"},data,{upsert: true});

        }
        
        let createNotificationsCollection = async function({brandName}) {

            let data = {
                "brand" : brandName,
                "name" : brandName+"-notifications",
                "properties" : {
                    "text" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    },
                    "status" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    },
                    "type" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    },
                    "data" : {
                        "type" : "String",
                        "required" : "true",
                        "html" : "input"
                    }
                },
                "redirect" : ""
            }

            await Collections.findOneAndUpdate({name: brandName-"notifications"},data,{upsert: true});

        }

        let model =  await this.createModel('myapp-themes');
        let model2 =  await this.createModel('myapp-users');

        let checkEarlierExists = async function({brandName}){

            let count = {
                inCollectionUsers : await Collections.find({name: brandName+"-users"}).count(),
                inCollectionNotifications: await Collections.find({name: brandName+"-notifications"}).count(),
                inThemes: await model.find({brand: brandName}).count(),
                inUsers: await model2.find({brand: brandName}).count()
            };

            return count;


        };

        let checkPrvs = await checkEarlierExists({brandName: req.body.brandName});

        if (Object.values(checkPrvs).some(val => val != 0)) {

            return redirect("Already exists in the collection = " + JSON.stringify(checkPrvs) );

        }

        await createUsersCollection({brandName: req.body.brandName});
        await createNotificationsCollection({brandName: req.body.brandName});
        let output = await model.create({brand: req.body.brandName, theme: req.body.projName});
        let output2 = await model2.create({
            email: req.body.ownerEmail, 
            name: req.body.ownerName, 
            password: req.body.ownerPassword,
            brand: req.body.brandName,
            role: 'admin'
        });

        req.params.module = "createdProj"

        return {
            msg: "new project created successfully",
            name: req.body.ownerName,
            email: req.body.ownerEmail,
            password: req.body.ownerPassword,
            brand: req.body.brandName,
            projName: req.body.projName
        }

    },

    showProj: async function(req,res) {

        let model =  await this.createModel('myapp-themes');
        let model2 =  await this.createModel('myapp-users');

        let getData = async function({brandName}){

            let data = {
                inCollectionUsers : await Collections.find({name: brandName+"-users"}).count(),
                inCollectionNotifications: await Collections.findOne({name: brandName+"-notifications"}).count(),
                inThemes: await model.findOne({brand: brandName}),
                inUsers: await model2.findOne({brand: brandName})
            };

            return {
                inCollectionUsers: data.inCollectionUsers,
                inCollectionNotifications: data.inCollectionNotifications,
                theme: data.inThemes.theme,
                brand: data.inThemes.brand,
                name: data.inUsers.name,
                email: data.inUsers.email,
                password: data.inUsers.password,
                showDetails: true,
            }

        };

        let allData = await getData({brandName: req.params.input});

        req.params.module = "createdProj";
        req.params.theme = "root";

        return allData;

    },

    property: async function(req, res) {

        let output = await this.fetchPropertiesDataForPage(req,res);

        output.filters.status = output.filters.status.filter( val => {
            return val.name.match(/archive|sold/gi) == null;
        });

        if (req.params.permit == 'gen') {
            output.forms = await this.getForms({msgBoxClient: true, contactForm: true}, req,res);
        } else {
            output.forms = await this.getForms({msgBoxAdmin: true}, req,res);
        };

        output.openLayer = req.query.openLayer ? req.query.openLayer : "" ;
        output.slides = await this.getSlides(req,res);

        return output;

    },

    showAll: async function(req,res) {

        let output =  await this.fetchPropertiesDataForPage(req,res);

        output.forms = await this.getForms({msgBoxAdmin: true, addProperty: true, editBusiness: true}, req,res);

        return output;

    },

    offlineRequired: async function(req,res) {
        

        if (req.params.permit == 'gen') {
            return {
                allCards: this.getAllCards(req,res),
                forms: await this.getForms({contactForm: true, msgBoxClient: true}, req,res),
                salutation: '',
            }

        } else {
            return {
                allCards: this.getAllCards(req,res),
                forms: await this.getForms({msgBoxClient: true, msgBoxAdmin: true, contactForm: true}, req,res),
                salutation: (await this.fetchResources(req,res))[0].salutation
            }
        };

    },

    fetchPropertiesDataForPage: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-properties`);

        if ( req.query && req.query.cities && req.query.cities.length > 1 ) {
            townStatus = '';
        } else {
            townStatus = 'd-none';
        }
            
        let filters = {
            cities: await this.getCities(req,res),
            townStatus: townStatus,
            status: await model.distinct("status").lean(),
            sort: req.query.hasOwnProperty("sort") ? req.query.sort : -1
        };

        console.log(filters);

        filters = this.getFiltersStatus(filters, req.query);

        return {
            properties: await this.getProperties(req,res),
            resources: (await this.fetchResources(req,res))[0],
            filters: filters,
            brand: req.params.brand,
            input: req.params.input,
            permit: req.params.permit,
            module: req.params.module,
            allCards: this.getAllCards(req,res)
        }

    },

    getAllCards: function(req,res) {

        let allCards = {
            authCards: req.session.authCards && req.session.authCards.myArray && req.session.authCards.myArray.length > 0 ? req.session.authCards.myArray : [],
            authCardsCount: req.session.authCards && req.session.authCards.myArray && req.session.authCards.myArray.length > 0 ? req.session.authCards.myArray.length : 0,
            Cards: req.session.Cards && req.session.Cards.myArray && req.session.Cards.myArray.length > 0 ? req.session.Cards.myArray : [],
            CardsCount: req.session.Cards && req.session.Cards.myArray && req.session.Cards.myArray.length > 0 ? req.session.Cards.myArray.length : 0,
        };

        return allCards;
    },

    filterProperties: async function(req,res) {

        return {
            properties: await this.getProperties(req,res),
            permit: req.params.permit,
        }

    },

    getFiltersStatus: function(filters, query) {

        filters.cities = filters.cities.map( val => { 

            query.cities && query.cities.match(val.city) ? val.status = 'active' : '';

            val.towns = val.towns.map( town => {
                if (val.status == 'active') {
                    return {
                        name: town,
                        status: query.towns && query.towns.split(',').includes(town) ? 'active' : ''
                    }
                } else {
                    return { 
                        name: town ,
                        status: 'd-none'
                    }
                }
            });


            return val;

        });


        filters.status = filters.status.map( val => {

            if (query.status && query.status.length > 0) {
                return {
                    name: val,
                    status: query.status && query.status.split(',').includes(val) ? val.status = 'active' : ''
                }
            } else {
                return {
                    name: val,
                    status: 'active'
                }
            }

        });

        return filters;

    },

    getCities: async function(req,res) {
        let query = {};
        if (req.params.module == 'showAll') {
            query.status = { $in: ["Selling","Required","Sold","Archive"] };
        } else {
            query.status = { $in: ["Selling","Required"] };
        };

        let model = await this.createModel(`${req.params.brand}-properties`);
        let output = await model.aggregate([
            {
                $match: query
            },{
                $group: {
                    _id: "$city",
                    "towns": {
                        $addToSet: "$town"
                    }
                },
            },{
                $project: {
                    "_id" : 0,
                    "city" : "$_id",
                    "towns": "$towns"
                }
            }
        ]);

        return output;
    },

    getProperties: async function(req,res) {
        
        let query = this.buildMongoQuery(req,res);

        let model = await this.createModel(`${req.params.brand}-properties`);

        let output = await model.aggregate([
            {
                $match: query
            },{
                $addFields: {
                    priceInNo: {
                        $toInt : "$demand"
                    }
                }
            },{
                $sort: {
                    "priceInNo": req.query.hasOwnProperty('sort') ? Number(req.query.sort) : -1
                }
            }
        ]);

        console.log(output);

        output = this.matchSelectedProperties(req,res,output);

        return output;

    },

    matchSelectedProperties : function(req,res,properties) {

        properties = properties.map( val => {
            val.authSelected = req.session.authCards && req.session.authCards.myArray && req.session.authCards.myArray.some( card => card._id == val._id.toString() ) ? 'select' : '';
            val.genSelected = req.session.Cards && req.session.Cards.myArray && req.session.Cards.myArray.some( card => card._id == val._id.toString() ) ? 'select' : '' ;
            return val;
        });

        return properties;
    },

    buildMongoQuery: function(req,res) {

        let query = {} ; 

        if (req.params.permit == 'showAll') {
            query.status = { $in: ["Selling","Required","Sold","Archive"] };
        } else {
            query.status = { $in: ["Selling","Required"] };
        };

        if (req.query.hasOwnProperty('status') && req.query.status.length > 1) {
            query.status = {$in: req.query.status.split(',')};
        } 

        if ( req.query.hasOwnProperty('cities') && req.query.cities.length > 1) {
            query.city = {$in: req.query.cities.split(',')};
        
            if ( req.query.hasOwnProperty('towns') && req.query.towns.split(',').length > 0) {
                query.town = {$in: req.query.towns.split(',')};
            };

        }

        return query;

    },

    saveInSession: async function(req,res) {

        req.session[req.params.input] = req.body;

        return {
            success: true
        }

    },

    drawForm: async function(req,res) {

        let form = (await this.getForms({[req.params.input]: true}, req,res))[req.params.input];

        return {
            form: form,
            input: req.params.input,
            permit: req.params.permit,
            brand: req.params.brand,
            allCards: this.getAllCards(req,res)
        };
        

    },


    getForms: async function({msgBoxClient, msgBoxAdmin, contactForm, editProperty, addProperty, addBlog, editBlog, editBusiness, signin }, req, res) {

        let object = {};

        if (msgBoxClient == true) {

            object.msgBoxClient = {
                formName: "msgBoxClient",
                heading: "MESSAGE BOX",
                note: "Write your message below and choose the option at the bottom to contact us.",
                class: "msgBoxClient mt-24",
                url: `/${req.params.brand}/auth/data/updateSequence/n`,
                elems: [
                    {
                        elem: "textarea",
                        label: "YOUR MESSAGE",
                        rows: 10,
                        value: req.session.msgBoxClient && req.session.msgBoxClient.msg || "Sir I am interested in these properties. Kindly when free get in touch..",
                        default: "Sir I am interested in these properties. Kindly when free get in touch..",
                        onkeyup: "saveInSession(this, 'msgBoxClient'); changeConnected(this, 'contactForm')",
                        name: "msg",
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "WHATSAPP",
                        onclick: "openWhatsApp(this)",
                        info: "Opens WhatsApp in your Phone / Computer with above pre-drafted message."
                    // },{
                    //     elem: "button",
                    //     class: "btn blue mt-24",
                    //     value: "EMAIL",
                    //     info: "Opens Contact Form where you will enter your Contact No and Name.",
                    //     onclick: "openLayer('.contactForm')"
                    },{
                        elem: "button",
                        class: "btn close",
                        value: "CLOSE MSG BOX",
                        onclick: "openLayer('.layerOne')"
                    } 
                ]
            }

        }

        if (msgBoxAdmin == true) {

            object.msgBoxAdmin = {
                formName: "msgBoxAdmin",
                heading: "MESSAGE BOX",
                note: "Draft your message and broadcast using WhatsApp.",
                class: "msgBoxAdmin mt-24",
                url: `/${req.params.brand}/auth/data/updateSequence/n`,
                elems: [
                    {
                        elem: "textarea",
                        label: "YOUR MESSAGE",
                        rows: 10,
                        value: req.session.msgBoxAdmin && req.session.msgBoxAdmin.msg || "Sir fresh properties for today; contact to inquire more, please.",
                        default: "Sir fresh properties for today; contact to inquire more, please.",
                        onkeyup: "saveInSession(this, 'msgBoxAdmin')",
                        name: "msg"
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "WHATSAPP",
                        onclick: "openWhatsApp(this)",
                        info: "Opens WhatsApp in your Phone / Computer with above pre-drafted message."
                    },{
                        elem: "button",
                        class: "btn close",
                        value: "CLOSE",
                        onclick: "openLayer('.layerOne')"
                    } 
                ]
            }

        }

        if (addProperty == true) {

            object.addProperty = {
                heading: "ADD NEW PROPERTY",
                note: "Delightfully add your properties. Make it breezing fast for your customers to understand you.",
                class: "mt-24",
                elems: [
                    {
                        elem: "input",
                        name: "price",
                        type: "number",
                        label: "PRICE (PKR)",
                        value: "2000000" // THESE VALUES ARE TEMP
                    },{
                        elem: "input",
                        name: "city",
                        type: "text",
                        label: "CITY",
                        value: "Islamabad"
                    },{
                        elem: "input",
                        name: "town",
                        type: "text",
                        label: "TOWN",
                        value: "BAHRIA 9"
                    },{
                        elem: "input",
                        name: "size",
                        type: "text",
                        label: "SIZE OF PROPERTY",
                        value: "1.5 Kanal"
                    },{
                        elem: "textarea",
                        label: "LOCATION DETAILS - REMARKS",
                        name: "details",
                        value: "Near Corner Mosque, held with Brig (Retd), ready for Sale in upfront cash / cheque payment, excellent value for the money. Urgent Sale please.",
                        onkeyup: "saveInSession(this, 'addProperty')"
                    },{
                        elem: "propertyStatus",
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        onclick: "submitForm(this)",
                        value: "SAVE"
                    },{
                        elem: "button",
                        class: "btn",
                        onclick: "openLayer('.layerOne')",
                        value: "CLOSE"
                    } 
                ]
            }

        }

        if (contactForm == true) {

            object.contactForm = {

                formName: "contactForm",
                heading: "<span>MSGBOX /</span> CONTACT FORM",
                note: "Please fill in your contact details. We will get back to you in next few hours.",
                elems: [

                    {
                        elem: "textarea",
                        label: "YOUR MESSAGE",
                        name: "msg",
                        rows: 10,
                        value: req.session.msgBoxClient && req.session.msgBoxClient.msg || "Sir fresh properties for today; contact to inquire more, please.",
                        onkeyup: "saveInSession(this, 'msgBoxClient'); changeConnected(this, 'msgBoxClient')"
                    },{
                        elem: "input",
                        label: "YOUR NAME",
                        value: req.session.contactForm && req.session.contactForm.name || "",
                        onkeyup: "saveInSession(this, 'contactForm')",
                        type: "text",
                        name: "name",
                    },{
                        elem: "input",
                        label: "YOUR CONTACT NO / EMAIL",
                        onkeyup: "saveInSession(this, 'contactForm')",
                        value: req.session.contactForm && req.session.contactForm.contact || "",
                        name: "contact",
                        type: "text",
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "SEND EMAIL",
                        onclick: "createTicket(this)"
                    },{
                        elem: "button",
                        class: "btn close",
                        value: "BACK",
                        onclick: "openLayer('.msgBox')"
                    },{
                        elem: "button",
                        class: "btn close",
                        value: "CLOSE",
                        onclick: "openLayer('.layerOne')"
                    } 
                ]

            }

        }

        if (editProperty == true) {

            object.editProperty = {
                heading: "EDIT PROPERTY",
                note: "Delightfully edit your properties. Make it so simple + fast for your visitors that they want to reach you. Good Luck!",
                class: "mt-24",
                elems: [
                    {
                        elem: "input",
                        name: "_id",
                        type: "text",
                        attr: "disabled",
                        value: "here goes my id"
                    },{
                        elem: "input",
                        name: "price",
                        type: "number",
                        label: "PRICE (PKR)",
                        value: "2000000" // THESE VALUES ARE TEMP
                    },{
                        elem: "input",
                        name: "city",
                        type: "text",
                        label: "CITY",
                        value: "Islamabad"
                    },{
                        elem: "input",
                        name: "town",
                        type: "text",
                        label: "TOWN",
                        value: "BAHRIA 9"
                    },{
                        elem: "input",
                        name: "size",
                        type: "text",
                        label: "SIZE OF PROPERTY",
                        value: "1.5 Kanal"
                    },{
                        elem: "textarea",
                        label: "LOCATION DETAILS - REMARKS",
                        name: "details",
                        value: "Near Corner Mosque, held with Brig (Retd), ready for Sale in upfront cash / cheque payment, excellent value for the money. Urgent Sale please.",
                        onkeyup: "saveInSession(this, 'editProperty' )"
                    },{
                        elem: "propertyStatus",
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        onclick: "submitForm(this)",
                        value: "SAVE"
                    },{
                        elem: "button",
                        class: "btn",
                        onclick: "openLayer('.layerOne')",
                        value: "CLOSE"
                    } 
                ]
            }
                

        }

        if (addBlog == true) {

            object.addBlog = {
                heading: "BLOG WRITING",
                elems: [
                    {
                        elem: "ck-editor",
                        name: "content",
                        label: "CONTENT",
                        onclick: "saveInSession(this, 'editBlog')",
                        value: "nothing goes here yet",
                    },{
                        elem: "input",
                        name: "name",
                        label: "BLOG NAME",
                        value: "Just a Name",
                    },{
                        elem: "input",
                        name: "slug",
                        label: "SLUG",
                        value: "just-a-name",
                        info: "This is the URL to your blog. Heading separated with dashes."
                    },{
                        elem: "input",
                        name: "type",
                        label: "FEATURED",
                        value: "featured",
                        info: "If you want to feature this post, keep the Feature button active"
                    },{
                        elem: "button",
                        value: "SAVE",
                        onclick: "submitForm(this)",
                        class: "btn blue mt-24"
                    },{
                        elem: "button",
                        value: "CLOSE",
                        onclick: "openLayer('.layerOne')",
                        class: "btn"
                    }
                ] 
            }

        }

        if (editBlog == true) {

            object.editBlog = {
                heading: "EDIT YOUR BLOG",
                elems: [
                    {
                        elem: "input",
                        name: "_id",
                        type: "text",
                        value: "myID goes here",
                        attr: "disabled"
                    },{
                        elem: "ck-editor",
                        name: "content",
                        label: "CONTENT",
                        onclick: "saveInSession(this, 'editBlog')",
                        value: "nothing goes here yet",
                    },{
                        elem: "input",
                        name: "name",
                        label: "BLOG NAME",
                        value: "Just a Name",
                    },{
                        elem: "input",
                        name: "slug",
                        label: "SLUG",
                        value: "just-a-name",
                        info: "This is the URL to your blog. Heading separated with dashes."
                    },{
                        elem: "input",
                        name: "type",
                        label: "FEATURED",
                        value: "featured",
                        info: "If you want to feature this post, keep the Feature button active"
                    },{
                        elem: "button",
                        value: "SAVE",
                        onclick: "submitForm(this)",
                        class: "btn blue mt-24"
                    },{
                        elem: "button",
                        value: "CLOSE",
                        onclick: "openLayer('.layerOne')",
                        class: "btn"
                    }
                ] 
            }

        }

        let model, output = {};

        if (editBusiness == true) {

            model = await this.createModel(`${req.params.brand}-resources`);
            output = (await model.find().lean())[0];

            object.editBusiness = {
                heading: "EDIT BUSINESS", 
                note: "Carefully enter these details. These are same details through which your clients contact you!.",
                url: `/${req.params.brand}/auth/data/updateSequence/n`,
                elems: [
                    {
                        elem: "input",
                        class: "d-none",
                        name: "_id",
                        value: output == undefined ? this.getMongoId() : output._id,
                    },{
                        elem: "input",
                        class: "d-none",
                        name: "modelName",
                        value: `${req.params.brand}-resources`,
                    },{
                        elem: "input",
                        name: "name",
                        type: "text",
                        label: "BUSINESS NAME",
                        value: output == undefined ? "xyz" : output.name,
                    },{
                        elem: "input",
                        name: "whatsapp",
                        label: "BUSINESS WHATSAPP",
                        type: "text",
                        value: output == undefined ? "+923235163638" : output.whatsapp,
                    },{
                        elem: "input",
                        name: "email",
                        label: "BUSINESS EMAIL",
                        info: "You recieve emails by visitors when they don't want to use WhatsApp to contact you.",
                        value: output == undefined ? "xyz@asdf.com" : output.email,
                    },{
                        elem: "input",
                        label: "BUSINESS GOOGLE PIN (LOCATION)",
                        info: "Use google to find out your pin website link. Copy this link. And paste it in this field. When clients click on your Location, they are directed to this URL.",
                        name: "googlepin",
                        value: output == undefined ? "google.com/123123" : output.googlepin,
                    },{
                        elem: "textarea",
                        label: "BUSINESS MAILING ADDRESS",
                        rows: 5,
                        name: "address",
                        info: "If your clients want to send something to your mailing address, this is the address.",
                        value: output == undefined ? "this is my temp address" : output.address,
                    },{
                        elem: "textarea",
                        label: "SALUTATION MSG",
                        name: "salutation",
                        info: "End of your emails / whatsapp messages, includes your salutation.",
                        value: output == undefined ? "Regards,\r\nMaj (R)\r\nAwais Chodhry\r\n+923235165558\r\nchodhryproperties.com" : output.salutation,
                        rows: 5,
                    },{
                        elem: "input",
                        label: "FACEBOOK PAGE LINK",
                        name: "facebook",
                        value: output == undefined ? "facebook.com/asdfasfd" : output.facebook,
                        placeholder: "https://facebook.com/yourpagename"
                    },{
                        elem: "input",
                        label: "TWITTER PAGE LINK",
                        name: "twitter",
                        value: output == undefined ? "twitter.com/asdfasfd" : output.twitter,
                        placeholder: "https://twitter.com/yourpagename"
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        onclick: "submitForm(this)",
                        value: "SAVE"
                    },{
                        elem: "button",
                        class: "btn",
                        onclick: "openLayer('.layerOne')",
                        value: "CLOSE"
                    }
                ]
            } 
        }


        if (signin == true) {


            object.signin = {
                heading: "ADMIN LOG IN",
                note: "This is log in page to the dashboard of this website. Please log in if you are an administrator of this business.",
                elems: [
                    {
                        elem: "input",
                        name: "email",
                        type: "email",
                        value: "xys@gasdf.com",
                        label: "USERNAME"
                    },{
                        elem: "input",
                        name: "password",
                        type: "password",
                        value: "asfdas",
                        label: "PASSWORD"
                    },{
                        elem: "button",
                        value: "ENTER",
                        class: "btn blue mt-24",
                        onclick: "submitForm",
                    },{
                        elem: "button",
                        class: "btn",
                        onclick: "openLayer('.layerOne')",
                        value: "CLOSE"
                    }
                ] 
            }

        }


        return object;

    },

    propertyGenForm: async function(req,res) {

        switch (true) {
            case (req.params.input == 'contactEmail'):
                //console.log( chalk.bold.blue( "SEND EMAIL to the OWNER EMAIL ADDRESS" ) );
                //console.log( chalk.bold.blue( "STORE THIS MSG AND DETAILS INTO CONTACT COLLECTION" ) );
                break;
            case (req.params.input == 'contactWhatsApp'):
                //console.log( chalk.bold.blue( "SENT WHATSAPP MSG FROM THE BROWSER" ) );
                //console.log( chalk.bold.blue( "STORE IN CONTACT COLLECTION" ) );
                break;
            default: 
                break;
        }

        return {
            success: true
        }

    },


    propertyAdminForm: async function(req,res){

        let missingValues = Object.values(req.body).some( val => val.length == 0 );

        if (missingValues) {
            return {
                status: 404,
                error: 'Please fill in all the values of the form'
            }
        }

        let addProperty = async function() {

            let model = await myFuncs.createModel(`${req.params.brand}-properties`);

            let output = await model.create(req.body);

            return output;

        }
            

        let output;

        switch (true) {
            case (req.params.input == 'editProperty'):
                //console.log( chalk.bold.blue( "EDIT A PROPERTY" ) );
                output = await editProperty();
                break;
            case (req.params.input == 'addProperty'):
                //console.log( chalk.bold.blue( "ADD A PROPERTY" ) );
                output = await addProperty();
                break;
            case (req.params.input == 'websiteContent'):
                //console.log( chalk.bold.blue( "EDIT WEBSITE CONTENT" ) );
                break;
            case (req.params.input == 'statusChange'):
                //console.log( chalk.bold.blue( "EDIT THE PROPERTY STATUS" ) );
                break;
            default: 
                break;
        }

        return output;

    },

    getSlides: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-slides`);
        let output = {
            sliders: await model.find({style: { $ne : "Footer" } }).sort({ser: 1}).lean(),
            footer: await model.findOne({style: "Footer"}).lean(),
        }

        if (output.sliders && output.sliders.length > 0) {

            output.sliders[0].status = "active";

        }

        return output;

    },

    showSlides : async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-slides`);

        return {
            forms: await this.getForms({msgBoxAdmin: true}, req,res),
            slides: await this.getSlides(req,res),
            templates: [ 1, 2, 3],
            allCards: this.getAllCards(req,res),
        };

    },

    saveSlide : async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-slides`);

        let output = await model.findOneAndUpdate(
            {
                _id: req.params.input.match(/temp/g) ? this.getMongoId() : req.params.input
            },{ 
                $set: { 
                        style: req.body.style, 
                        content: req.body.content, 
                        sequence: req.body.sequence 
                } 
            },{ upsert: true, new: true }).lean();

        return output;

    },

    changeSlideSequence : async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-slides`);

        let output = await Promise.all( req.body.slides.map( val => model.findOneAndUpdate({_id: val.id}, {$set : { sequence: val.sequence } }, {new: true} ) ) );

        return output;

    },

    boots: async function(req,res) {


        let model = await this.createModel(`${req.params.brand}-subjects`);
        let output = await model.find({status: "open"}).lean();
        return {
            subjects: output
        }
    },

    storeHTML: async function(req,res) {

        let file = req.session.file;

        let after = file.split(`<!-- =====${req.body.ser} -->`)[1];

        let updatedFile = `
             ${file.split(`<!-- =====${req.body.ser} -->`)[0]}
             ${req.body.string}
             ${file.split(`<!-- +++++${req.body.ser} -->`)[1]}
        `;

        await fs.writeFile(
            './views/kalles/landingPage.hbs', 
            updatedFile, 
            (err) => {
                if (err) {
                  console.log(err);
                  console.log("failed to backup");
                  return 'Failed to backup';
                }
                return 'Successful';
            });

        req.session.file = updatedFile;

        return {success: "done"};

    },

    matchDataWithHeadings: function(dataArray, headings) {

        dataArray = dataArray.map( val => {
            let total = [], see;
            headings.forEach( hdg => {
                if ( /noClone|fixed/gi.test(hdg) == false && val[hdg] != undefined ) {
                    total.push({
                        [ hdg ] : val[hdg]
                    });
                };
            });
            return total;
        });

        return dataArray;

    },

    fetchCollectionData: async function(req,res) {

        let string = `${req.params.brand}-${req.params.input.split("-")[1]}`;
        let model = await this.createModel(req.params.input);
        let collection = await Collections.findOne({name: req.params.input}).lean();
        let output = await model.find().lean();
        let result = this.matchDataWithHeadings( output, Object.keys(collection.properties) )
        return {
            output: result
        };

    },

    saveImgInArray: async function(req,res) {

        console.log("saving the image in array");

        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);

        let output = await model.findOneAndUpdate(
            {
                _id: mongoose.Types.ObjectId(req.body._id)
            },{
                $push: {
                    "photos": req.body.photo
                }
            },
            { new: true }
        );

        console.log(output);

        return output;

    },

    deleteImgInArray: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);

        let output = await model.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(req.body._id) },
            { $pull: { 'photos': { imgId: req.body.imgId } } },
            { new: true }
        );

        return output;

    },

    deleteImgInCloudinary: async function(req,res) {

        let output = await cloudinary.uploader.destroy(req.params.brand+"/"+req.body.imgId, {type : 'upload', resource_type : 'image'} );
        return {
            output: output
        };

    },

    saveItemInArray: async function(req,res) {

        console.log("saving the item  in array");

        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);

        await model.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(req.body._id) },
            { $pull: { [ req.body.key ] : { id: req.body.item.id } } },
        );

        let output = await model.findOneAndUpdate(
            {
                _id: mongoose.Types.ObjectId(req.body._id)
            },{
                $push: {
                    [req.body.key] : req.body.item
                }
            },
            { new: true }
        );

        return output;
    },

    deleteItemInArray: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-${req.params.input}`);

        let output = await model.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(req.body._id) },
            { $pull: { [ req.body.key ] : { id: req.body.keyId } } },
            { new: true }
        );

        return output;


    },

    calcOrder: async function(req,res) {

        let model = await this.createModel( req.body.FK );

        let output = await Promise.all( req.body.items.map( val => {
            return model.aggregate([
                {
                    $match: {
                        slug: val.slug
                    }
                },{
                    $limit: 1
                },{
                    $addFields: {
                        multiplied: {
                            $toInt : "$price"
                        },
                    }
                },{
                    $project: {
                        slug: 1,
                        multiplied: 1
                        // multiplied: { $multiply: [ "$intPrice", Number(val.quantity) ] }
                    }
                }
            ])
        }) );

        console.log( output );

        return output;

    },

    kalles: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-products`);

        return {
            products: await model.find({trending: "true"}).limit(8).lean(),
            newProducts: await model.find({new: "true"}).limit(8).lean(),
            sale: await model.find({sale: { $exists: true} }).limit(8).lean(),
            categories: await model.distinct("category").lean(),
            randomProducts: await model.aggregate([
                                { $sample: { size: 5 } }
                            ]),
            cart: req.session.cart != undefined ? req.session.cart : []
        }
    },

    kallesLoadMore: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-products`);
        let trending = await model.aggregate([
            {
                $match: {
                    trending: "true"
                },
            },{
                $skip: Number(req.body.skip)
            },{
                $limit: 8
            }]);
        let count = await model.find({trending: "true"}).count();
        return {
            products: trending,
            count
        };

    },

    kallesQuickView: async function(req,res) {

        try {
            let model = await this.createModel(`${req.params.brand}-products`);
            let product = await model.findOne({_id : mongoose.mongo.ObjectID( req.params.input ) }).lean();
            let sizes = await model.aggregate([ 
                {
                    '$match': {
                        '_id': mongoose.mongo.ObjectID( req.params.input )
                    }
                }, {
                    '$project': {
                        'category': {
                            '$toLower': '$category'
                        }, 
                        'items': 1
                    }
                },{
                    '$lookup': {
                        'from': `${req.params.brand}-sizes`, 
                        'localField': 'category', 
                        'foreignField': 'category', 
                        'as': 'sizes'
                    }
                }, {
                    '$unwind': '$sizes'
                }, {
                    '$unwind': '$items'
                }, {
                    '$lookup': {
                        'from': `${req.params.brand}-items`, 
                        'let': {
                            'mySlug': '$items.slug', 
                            'mySize': '$sizes.slug'
                        }, 
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$and': [
                                            {
                                                '$eq': [
                                                    '$slug', '$$mySlug'
                                                ]
                                            }, {
                                                '$eq': [
                                                    '$size', '$$mySize'
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ], 
                        'as': 'stock'
                    }
                }, {
                    '$unwind': {
                        'path': '$stock',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$group': {
                        '_id': {
                            'stock': '$sizes.slug',
                            'label': '$sizes.label',
                            'ser': '$sizes.ser'
                        },
                        'items': {
                            '$addToSet': '$stock'
                        }
                    }
                }, {
                    '$project': {
                        'size': '$_id.stock',
                        'label': '$_id.label',
                        'ser': {
                            '$toInt': '$_id.ser'
                        },
                        'stock': {
                            '$cond': {
                                'if': {
                                    '$isArray': '$items'
                                },
                                'then': {
                                    '$size': '$items'
                                },
                                'else': 'NA'
                            }
                        },
                        'items': '$items',
                        '_id': 0
                    }
                    }, {
                        '$sort': {
                            'ser': 1
                        }
                    }
            ]);

            return {
                product: product,
                sizes: sizes
            };

        } catch(e) {
            console.log(e);
            return e;
        }

    },

    kallesCartUpdate: async function(req,res) {

        let cart = req.session && req.session.cart || [];

        cart = cart.filter( val => val.slug != req.body.slug ); 
        cart.push( req.body );
        req.session.cart = cart;

        return {
            cart: cart
        };

    },

    kallesCartReplaceItem: async function(req,res) {

        let cart = req.session && req.session.cart || [];
        cart = cart.filter( val => val.slug != req.body.oldSlug );
        cart = cart.filter( val => val.slug != req.body.slug );
        delete req.body.oldSlug;
        cart.push( req.body );
        req.session.cart = cart;

        return {
            cart: cart
        };

    },

    kallesRemoveCartItem: async function(req,res) {
        
        let cart = req.session && req.session.cart || [];
        cart = cart.filter( val => val.slug != req.body.slug );
        req.session.cart = cart;

        return {
            cart: cart
        };

    },

    kallesShoppingCart: async function(req,res) {

        req.params.module = "shopping-cart";

        if (req.session.cart == undefined || req.session.cart == []) {
            req.params.module = "landingPage";
            return this.kalles(req,res);
        }

        return {
            cart: req.session.cart != undefined ? req.session.cart : [],
        }

    },

    kallesChangeCartQty: async function(req, res) {

        let cartItem = req.session && req.session.cart && req.session.cart.find( val => val.slug == req.body.slug );
        cartItem.quantity = req.body.quantity;

        let cart = req.session && req.session.cart || [];
        cart = cart.filter( val => val.slug != req.body.slug );
        cart.push(cartItem);

        req.session.cart = cart;

        return {
            cart: cart
        };

    },

    kallesCheckOut: async function(req, res) {

        req.params.module = "checkout";

        if (req.session.cart == undefined || req.session.cart == []) {
            req.params.module = "landingPage";
            return this.kalles(req,res);
        }

        return {
            cart: req.session.cart != undefined ? req.session.cart : [],
            editOrder: req.session.editOrder , 
        }

    },

    showReceipt: async function(req, res) {
        req.params.theme = "root";

        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOne({_id: req.params.input}).lean();

        return {
            order: output, 
            meta: JSON.parse(output.meta),
            stages: output.stages.reverse(), 
        };
    },

    showOrder: async function(req,res) {

        req.params.theme = "root";

        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOne({_id: req.params.input}).lean();

        return {
            order: output, 
            meta: JSON.parse(output.meta),
            stages: output.stages.reverse(), 
        };

    },

    // create a document that has some values of array inside it
    createDocWithArr: async function(collection, model, data) {

        let props = ( await Collections.findOne({name: collection}).lean() ).properties;
        let arrays = [], items = [];
        delete props.noClone;
        delete props.fixed;

        Object.entries(props).forEach( owl =>  {
            console.log("Reading foreach - ", owl[0]);
            let key = owl[0],
                value = owl[1];

            if (value.type == "Array" && data[key] && data[key].length > 0) {
                console.log("this is array - ", key );
                data[key].forEach( val => arrays.push({ser: data.ser, key: key, val: val}) );
                delete data[key];
            }

            return 0;
        });

        let order = {};

        await model.create( data ).then(result => order = result );

        await Promise.all( arrays.map( val => {

            return model.findOneAndUpdate({ser: val.ser},{
                $push: {
                    [ val.key ] : val.val
                }
            });
        }));

        console.log(order);
        
        return order;

    },

    updateDocWithArr: async function(collection, model, data) {

        let props = ( await Collections.findOne({name: collection}).lean() ).properties;
        let arrays = [], items = [];
        delete props.noClone;
        delete props.fixed;

        Object.entries(props).forEach( owl =>  {
            console.log("Reading foreach - ", owl[0]);
            let key = owl[0],
                value = owl[1];

            if (value.type == "Array" && data[key] && data[key].length > 0) {
                console.log("this is array - ", key );
                data[key].forEach( val => arrays.push({_id: data._id, key: key, val: val}) );
                delete data[key];
            }

            return 0;
        });

        let order = await model.findOneAndUpdate({_id: data._id}, { $set: data }, { new: true });

        await Promise.all( arrays.map( val => {

            return model.findOneAndUpdate({_id: val._id},{
                $push: {
                    [ val.key ] : val.val
                }
            });
        }));

        return order;

    },

    kallesUpdateOrder: async function(req, res) {

        let model = await this.createModel(`${req.params.brand}-orders`);
        let store = await this.updateDocWithArr(`${req.params.brand}-orders`, model, req.body);

        this.sendOrderAlerts(req, res, store);

        return {
            order: store
        };

    }, 

    kallesPlaceOrder: async function(req,res) {

        let model = await this.createModel( `${req.params.brand}-orders` );
        let ser = await model.aggregate([
        {
            $addFields: {
                numSer: { $toInt: "$ser" }
            }
        },{
            $project: {
                numSer: 1
            }
        },{
            $sort: {
                numSer: -1
            }
        }
        ]);
        req.body.ser = (ser[0] ? Number(ser[0].numSer) : Number(0)) + 1;
        let store = await this.createDocWithArr(`${req.params.brand}-orders`, model , req.body);

        this.sendOrderAlerts(req, res, store); //place necessary stages

        return {
            order: store
        }

    },

    sendOrderAlerts: async function(req, res, order) {

        let getDateTime = function(objectId) {
            let date = objectId != undefined ? new Date(parseInt(objectId.toString().substring(0, 8), 16) * 1000) : new Date();
            let dtg = date.toString().split(" ");
            let obj = {
                time: dtg[4],
                date: dtg[2],
                month: dtg[1],
                yr: dtg[3]
            }
            let time = obj.time.split(":");
            obj.time = time[0]+time[1]+ " hrs";
            return `${obj.time} · ${obj.date} ${obj.month} ${obj.yr}`;
        };

        let saveItemInStage = async function(stage) {
            let model = await myFuncs.createModel(`${req.params.brand}-orders`);
            let output = await model.findOneAndUpdate(
                {
                    _id: order._id
                },{
                    $push: {
                        stages : stage
                    }
                },
                { new: true }
            );
            return output;
        };

        // send email to the customer

        try { 
            req.query = {
                ser: order.ser,
                email: order.email
            }

            let receipt = await this.receipt(req,res);

            let mail  = await this.sendMail({ 
                template: "receipt", 
                context: receipt, 
                toEmail: order.email, 
                subject: "receipt", 
                brand: req.params.brand
            });

            await saveItemInStage({
                id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                time: getDateTime(), 
                hdg: "Sent Receipt to Customer's Email", 
                msg: `<p><small>Created by the Server.</small></p>`, 
                type: "email"
            });

            // send slack notification

            let meta = JSON.parse( order.meta );

            let items = meta.reduce( (total, val, key) => {

                return total += `${val.quantity} x ${val.product.name} (${val.size.label}) with item cost of  pkr ${val.product.sale_price ? val.product.sale_price : val.product.price} \n`;

            }, "" );

            let url = {};
            console.log("process.env");
            console.log(process.env.url);

            let msg =  `*New Order Received!* 

Order No = ${order.ser}
Status = ${order.status}
Day/Time = ${ getDateTime(order._id.toString()) }

Customer
Name = ${order.name}
Address = ${order.address}
Email = ${order.email}
Mobile = ${order.mobile}

Order 
${items}
Total Amount
*PKR ${order.cost}*

View receipt at : ${process.env.url}/${req.params.brand}/gen/email/receipt/n?ser=${order.ser}&email=${order.email}

Receipt sent by Server.`;

            let model = await this.createModel("myapp-themes");
            let brandDetails = await model.findOne({ brand: req.params.brand }).lean();
            let checkSlack = await this.axiosRequest({ method: "POST" , data: { text: msg } , URL: brandDetails.brandSlackURL });

            await saveItemInStage({
                id : Date.now().toString(36) + Math.random().toString(36).substr(2),
                time: getDateTime(), 
                hdg: "Sent Receipt to Slack", 
                msg: `<p><small>Created by the Server.</small></p>`, 
                type: "email"
            });

            // send dashboard notification
            io.sockets.emit( `${req.params.brand}newOrder` , order );

            return {
                success: true
            }

        } catch(e) {
            console.log(e);
        };

    }, 

    testPlaceOrder: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-orders`);
        let lastOrder = (await model.find().limit(1).sort({$natural:-1}).lean())[0];
        lastOrder.testing = "true";
        io.sockets.emit( `${req.params.brand}newOrder`, lastOrder );

        return {
            success: true
        }

    }, 

    receipt: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOne({ser: req.query.ser, email : req.query.email }).lean();
        let brandModel = await this.createModel(`myapp-themes`);
        let brand = await brandModel.findOne({brand: req.params.brand}).lean();
        
        return {
            order: output,
            meta: JSON.parse(output.meta),
            brandData: brand
        };

    },

    sendReceiptToEmail: async function(req,res) {

        try {

            console.log(req.body);

            req.query = {
                ser: req.body.orderSer,
                email: req.body.orderEmail
            }

            let receipt = await this.receipt(req,res);

            let mail  = await this.sendMail({ 
                template: "receipt", 
                context: receipt, 
                toEmail: req.body.toEmail, 
                subject: "receipt", 
                brand: req.params.brand
            });

            return {
                success: true
            };

        } catch (e) {

            console.log(e);

            return {
                status: 400,
                error: e,
            }
        }

    },

    saveSlackAPI: async function(req,res) {

        let checkSlack = await this.axiosRequest({ method: "POST" , data: {text: "Hello boss testing the app"} , URL: req.body.url });
        if (checkSlack.data == "ok") return { success: true }
        else return {status: 404, error: 'Could not send on this webhook. Validate the webhook please. '};

    },

    sendReceiptToSlack: async function(req,res) {

        let model = await this.createModel("myapp-themes");
        let brandDetails = await model.findOne({ brand: req.params.brand }).lean();
        let checkSlack = await this.axiosRequest({ method: "POST" , data: { text: req.body.msg } , URL: brandDetails.brandSlackURL });

        if (checkSlack.data == "ok") return { success: true }
        else return {status: 404, error: 'Could not send on this webhook. Validate the webhook please. '};

    },

    sendRecoveryCode: async function(req,res) {

        let length = 10000000;
        let code = (Math.floor(Math.random() * length) + length).toString().substring(1);
        let model = await this.createModel(`${req.params.brand}-users`);
        let user = await model.findOneAndUpdate({email: req.body.email},{
            $set: {
                code: code
            }
        },{
            new: true
        });

        if (!(user)) return {
            error: "No email found. Try contacting us.",
            status: 400
        };

        req.body = {
            msgText: `
<p>Hi ${user.name}, </p>
<p> Your verification code is ${code}. Please enter this code in the form where you requested code or click on below link to reset your password.  </p>
<p> ${req.headers.origin}/${req.params.brand}/gen/page/signin/rp?email=${user.email}&code=${code} </p>
<p> — ${req.query.brandName} </p>
            `,
            toEmail: user.email,
            msgSubject: `Recover password to ${req.params.brand}`,
            brand: req.params.brand
        };

        let output = await this.sendMsgToEmail(req,res);

        return {
            mail: output,
            userEmail: user.email
        };

    }, 

    sendMsgToEmail: async function(req, res) {

        if ( !( req.body.msgText && req.body.toEmail && req.body.msgSubject ) ) return {
            status: 404, 
            error: "Sorry you missed some fields."
        };

        let mail  = await this.sendMail({ 
                msg: req.body.msgText, 
                toEmail: req.body.toEmail, 
                subject: req.body.msgSubject, 
                brand: req.params.brand
            });

        return {
            success: true
        };

    }, 

    editOrder: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-orders`);
        let order = await model.findOne({_id: req.params.input}).lean();
        let cart = JSON.parse( order.meta );

        req.session.cart = cart;
        req.session.editOrder = order; 
        req.params.module = "shopping-cart";

        return {
            cart: req.session.cart != undefined ? req.session.cart : [],
            editOrder: req.session.editOrder , 
        }

    }, 

    getPagination: function(count, skip, limit) {

            let array = [];
            
            skip = skip || 0;
            limit = limit || 12;

            let pages = Math.ceil( Number(count) / Number(limit) );
            let current_page_no = ( ( Number(skip) ) / Number(limit) ) + 1;

            console.log( { count, skip, limit } );

            for ( i = 0; i < pages ; i++ ) {

                array.push({
                    pageNo: i + 1,
                    current: current_page_no == i + 1,
                });

            };

            return {
                array,
                next: current_page_no != pages,
                prev: current_page_no != 1
            };

    },
    
    kallesShop: async function(req, res) {

        let findMatchInFilter = function(array, filter, cat) {
            return array.map( val => {
                return {
                    value: val,
                    active: filter[cat] && filter[cat]["$in"] ?  filter[cat] && filter[cat]["$in"].some( match => match == val ) : filter[cat] == val
                }
            });
        };

        req.params.module = "shop";
        req.query = processQuery(req.query, {price: { dataType: "string" } });
        if (req.query && req.query.filter && req.query.filter._pjax) delete req.query.filter._pjax;

        req.query.limit = 12;
        let model = await this.createModel(`${req.params.brand}-products`);
        let output = await model.find(req.query.filter).sort(req.query.sort).skip(req.query.skip).limit(req.query.limit).lean();
        let count = await model.countDocuments(req.query.filter).lean();
        let filters = {
            schools: findMatchInFilter( await model.find().distinct("school").lean(), req.query.filter, "school" ), 
            category: findMatchInFilter( await model.find().distinct("category").lean(), req.query.filter, "category"),
            type: findMatchInFilter(await model.find().distinct("type").lean(), req.query.filter , "type" ), 
            gender: findMatchInFilter( await model.find().distinct("gender").lean(), req.query.filter, "gender" )
        };

        return {
            products: output,
            filters: filters,
            clearFilters: req.query.filter && Object.keys(req.query.filter).length === 0 && Object.getPrototypeOf(req.query.filter) === Object.prototype,
            pages: this.getPagination(count, req.query.skip, 12)
        }

    }, 

    kallesProduct: async function(req, res) {

        req.params.module = "product-detail-full-width-atc";
        let model = await this.createModel(`${req.params.brand}-products`);
        let product = await model.findOne({_id: req.params.input}).lean();
        let school_products = await model.find({school: product.school}).lean();

        let getSiblings = function(product, allProducts) {

            let indexing = allProducts.map( (val, index) => {
                return {
                    product: val,
                    match: val.ser == product.ser,
                    index: index
                }
            } );

            let this_product = indexing.find( val => val.match == true );

            indexing.forEach( ( val , key )=> {
                Object.assign( val, {
                    distance: val.index - this_product.index,
                    last: indexing[key + 1] == undefined ? true : false,
                    first: indexing[key - 1] == undefined ? true : false
                });
            });

            let siblings = [];

            console.log( allProducts.length )
            if (allProducts.length > 2 ) {
                if (this_product.first) {
                    siblings = [
                        indexing[ indexing.length - 1 ],
                        this_product,
                        indexing[ this_product.index + 1 ]
                    ]
                } else if (this_product.last) {
                    siblings = [
                        indexing[ this_product.index - 1 ],
                        this_product,
                        indexing[0]
                    ]
                } else {
                    siblings = [
                        indexing[ this_product.index - 1 ],
                        this_product,
                        indexing[ this_product.index + 1 ],
                    ]
                }
            } else if ( allProducts.length == 2 ) {

                        
                if (this_product.first) {
                    siblings = [
                        indexing[ this_product.index + 1 ],
                        this_product,
                        indexing[ this_product.index + 1 ]
                    ]
                } else if (this_product.last) {
                    siblings = [
                        indexing[ this_product.index - 1 ],
                        this_product,
                        indexing[ this_product.index - 1 ]
                    ]
                }

            } else {
                siblings = false
            }
            

            return siblings;

        };

        let product_details = await this.kallesQuickView(req,res) 

        // -- first available size
        let first_aval_size = product_details.sizes.find( val => val.stock > 0 );

        return {
            siblings: getSiblings(product, school_products),
            product: product_details.product,
            sizes: product_details.sizes,
            avalSize: first_aval_size,
            cart: req.session.cart != undefined ? req.session.cart : []
        }
        

    },

    kallesBlogs: async function(req,res) {
        req.params.module = "blog-grid";
        return {
            success: true
        }
    },

    kallesBlog: async function(req,res) {
        req.params.module = "blog-post-with-instagram-shop";
        return {
            success: true
        }
    },

    telegramBot: async function(req, res) {

        console.log("this is a telegram bot");

        return {
            msg: "got it bro"
        }

    }, 

};


server.listen(3000)
