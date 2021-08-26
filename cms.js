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
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}, function(err) {
  if (err) {
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

hbs.registerHelper('pickRandomColor', (val) => {
    let array = [ "lightblue", "pink" , "lavender" , "lightskyblue", "lightgoldenrodyellow" , "lightgreen", "beige" , "#f0dbeb" , "#c9eeeb" , "#f0d0a0" ];
    let randomNo = Math.floor(Math.random() * 4); 
    return array[randomNo];
})

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

hbs.registerHelper('matchValues', (val1,val2) => {
    console.log(val1,val2);
    return val1 == val2
});

hbs.registerHelper('removeSpaces', (val) => {
    return val.replace(/ /gi,'');
});

hbs.registerHelper('match', function(val1,val2) {
  return val1.toUpperCase() == val2.toUpperCase() ? true : false;
})

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

app.use('/:brand/:permit/:requiredType/:module/:input', async (req,res,next) => {
    console.log('');
    console.log(chalk.bold.red('new Request starts here'));
    console.log(req.params);

    if (myFuncs['moduleRole'][req.params.module] == 'gen') return next();
    
    if ( req.session && req.session.hasOwnProperty('person') ) {
        console.log({
            personRole: req.session.person.role,
            pagePermit: req.params.permit,
            personOwner: req.session.person.brand,
            pageOwner: req.params.brand
        });
        switch (true) {
            // Logged In User can watch all auth modules
            case (myFuncs.moduleRole[req.params.module] == 'auth'):
                return next();
            // Admin == Admin && root == root
            case (myFuncs.moduleRole[req.params.module] == 'admin' && req.session.person.role == 'auth'): 
                return res.send('you are trying to access admin page while your role is auth only');
                break;
            case (req.session.person.role == req.params.permit && req.session.person.brand == req.params.brand) :
                return next();
                break;
            // 'Auth' role tries to access 'Admin' Module
            default :
                return res.send('you are not authorized to make this request');
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
        console.log(chalk.bold.red('first collection created'));
        return next();
    };

    let checkCollectionExists = await myFuncs.checkCollectionExists(`${req.params.brand}-users`);

    if (checkCollectionExists) {
        return res.redirect(`/${req.params.brand}/gen/page/signin/home/`);
    };
    
    checkCollectionExists = await myFuncs.checkCollectionExists(`myapp-users`);

    if (checkCollectionExists) {
        return res.redirect(`/myapp/gen/page/signin/home/`);
    };


    console.log(chalk.bold.yellow('All checks completed moving to admin route!'));
    next();
});

let openBrand = async (req,res) => {
    if (req.params.brand.indexOf('.') > 0) {
        console.log( chalk.bold.red("===== Wrong Call ===== \n", req.params.brand ) );
        return res.status(300).send('Wrong Attempt');
    };

    return res.redirect(`/${req.params.brand}/gen/page/landingPage/n`);
};

let openAdmin = async (req,res) => {
    return res.redirect(`/${req.params.brand}/admin/page/signin/n`);
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
    return res.status(200).render('root/showApps.hbs',{
        apps: [
            {
                name: 'My App',
                url: 'myapp'
            },
            {
                name: '7am',
                url: '7am',
            },
            {
                name: 'trends',
                url: 'trends',
            },
            {
                name: '30 Days Challenge',
                url: 'challenge',
            },
            {
                name: 'life',
                url: 'life'
            },
            {
                name: 'richpakistan',
                url: 'richpakistan'
            },
            {
                name: 'chodhry',
                url: 'chodhry'
            }
        ]
    });
});

var myFuncs = {

    respond: async function(data,req,res) {
        console.log( chalk.bold.yellow('sending data to page') ); 
        console.log(JSON.stringify(data,'',2));
        switch(true) {
          case ( data.hasOwnProperty('error') ): 
            return res.status(data.status).send(data.error);
            break;
          case (req.query.hasOwnProperty('redirect')):
            return res.redirect(`/${req.params.brand}/${req.params.permit}/${req.params.requiredType}/${req.query.redirect}/${req.query.redirectInput}?msg=${data.msg}`);
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
          case (req.headers['x-pjax'] != 'true' && req.params.requiredType == 'pjax'): 
            console.log('LOADING WITHOUT PJAX NOW -----');
            let queryURL = req.url.includes('?') ? req.url.split('?')[1] : '';
            return res.redirect(`/${req.params.brand}/${req.params.permit}/page/${req.params.input}/${req.query.input || 'n'}?${queryURL}`);
            break;
          case (req.params.requiredType == 'page'):
            return res.status(200).render(`${req.params.theme}/${req.params.module}.hbs`,{data});
            break;
          default:
        }
    },

    moduleRole: {
        respond: 'admin',
        runAndRedirect: 'gen',
        newDocument: 'admin',
        editDocument: 'admin',
        deleteDocument: 'admin',
        checkCollectionExists: 'admin',
        createModel: 'admin',
        airtablePull: 'admin',
        mergeDataIntoCollection: 'admin',
        save: 'admin',
        dropCollection: 'admin',
        createNewCollection: 'admin',
        saveSequence: 'gen',
        updateSequence: 'admin',
        showCollection: 'admin',
        destroySession: 'auth',
        checkAdmin: 'admin',
        signin: 'gen',
        checkSignIn: 'gen',
        signup: 'gen',
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
        showPage: 'gen',
        updatePage: 'auth',
        dashboard: 'admin',
        forgotpw: 'gen',
        challenges: 'auth',
        profile: 'auth',
        openChallenge: 'auth',
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
        fetchAirtable: 'gen',
        roadMap: 'gen',
        newsletters: 'gen',
	listenToWebhook: 'gen',
        editWeb: 'admin',
        emptyFile: 'admin',
        showAll: 'auth',
        filterProperties: 'gen',
        propertyAdminForm: 'auth',
        propertyGenForm: 'gen',
        showPages: 'gen',
        editPage: 'auth',
        drawForm: "gen", 
    },

    listenToWebhook: function(req,res) {

        console.log(req.query);

        if (req.body[0].hasOwnProperty('text')) this.syncFromAirtableToLocal({ data: req.body, brand: req.params.brand });

        return {
                status: 200,
                msg: "Receieved the message successfully",
                challenge: req.body.challenge
        }

    },

    syncFromAirtableToLocal: async function({ data, brand }){

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

        brand = 'life';

        // ------------------------------
        let create_models = async (data, brand) => {

            let onlyTexts = data.map( val => val.text );

            uniq = [...new Set(onlyTexts)];

            console.log( uniq );

            let models = await Promise.all( uniq.map( val => {

                let name = brand + '-' + val.split('*')[1];
                
                console.log(name);
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
            let airtableURLs = ( await Collections.findOne({name: collectionName}).lean() ).airtable;

            if (airtableURLs == undefined) {

                console.log( chalk.bold.bgYellow.black( "DATA IS NOT CONNECTED WITH AIRTABLE" ) ); 

                return { msg: "Data not connected to Airtable" };

            }

            let airtableRecord = await this.axiosRequest({
                // URL: https://v1.nocodeapi.com/punch__lines/airtable/EKBsTHngHjQgCFJp?tableName=All&id=recKQ7nDXFx75VrE8
                URL: airtableURLs.get + '&id=' + record.recordId,
                method: 'GET'
            });

            // console.log( airtableRecord.data );

            let remoteData = airtableRecord.data.fields;

            // console.log( remoteData );

            // let storeNow = await record.model.findOne({ [airtableURLs.key]: remoteData[airtableURLs.key] }).lean();

            let storeNow = await record.model.findOneAndUpdate({ [airtableURLs.key]: remoteData[airtableURLs.key] }, remoteData, { new: true });

            console.log( storeNow[airtableURLs.key], remoteData[airtableURLs.key] );

            return { msg: remoteData[airtableURLs.key] + ' — Updated locally' }

        };

        let output = await Promise.all( data.map( val => pipe_airtable_upload( val ) ) );

        let send_note_telegram = async ( records ) => {

            let data = {
                0 : `${records.length} x records have been updated in Airtable`
            };

            data = Object.assign( data, 
                records.reduce( (total, val, index) => {
                    console.log( val, index );
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

            console.log( chalk.bold.bgYellow.black( "DATA IS NOT CONNECTED WITH AIRTABLE" ) ); 

            return {msg: "not linked with Airtable"};

        }

        let formatData = function( matchingID, data ) {

            delete data._id;

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

                console.log( chalk.bold.bgYellow.black( "DATA IS PUSHED - SAVING ITS ID INTO LOCAL DB - "  + dataToStore.id) );

                let deleteOldKeys = await Collections.findOneAndUpdate( { name: collection } , { $pull : { "airtable.connectingKeys" : { fields : { [airtableURLs.key] : data[airtableURLs.key] } } } } ) ;

                let newStore = await Collections.findOneAndUpdate( { name: collection } , { $push : { "airtable.connectingKeys" : dataToStore } } , { new : true } ).lean();

                console.log( "DATA IS STORED LOCALLY" );

        };

        let pushNewToAirtable = async function( matchingID, data ) {

                console.log( chalk.bold.bgYellow.black( "MATCHING ID NOT FOUND IN AIRTABLE - PUSHING DATA AS NEW" ) );

                let newUpload = await myFuncs.axiosRequest({ method: "POST", data: formatData(matchingID, data), URL: airtableURLs.post});
                
		console.log(newUpload);

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

            console.log( chalk.bold.bgYellow.black( "FOUND THIS KEY MOVED (REMOVED AND ADDED) IN AIRTABLE - UPLOADING NEW DATA TO FOUND KEY" ) );

            let updateToAirtable = await myFuncs.axiosRequest({ method: "PUT", data: formatData(connectingKey , data), URL: airtableURLs.put});

            if ( updateToAirtable && updateToAirtable.response && updateToAirtable.response.data.hasOwnProperty("error") ) {
                
                console.log( updateToAirtable.response );
                
                return {
                    msg: "Airtable > " + updateToAirtable.response.data.info
                };
                
            };

            let dataToStore = formatObjectToStore( connectingKey.id ); 

            await saveNewKeyInLocalDB( dataToStore );

            return {
                success: true,
                airtableReply: updateToAirtable.data,
                msg: updateToAirtable.data.message + " existing (found) in Airtable"
            }

        };

        console.log( chalk.bold.bgYellow.black( "UPDATING TO AIRTABLE AGAINST UNIQUE KEY - " + airtableURLs.key ) );

        let matchingID = airtableURLs.connectingKeys.find( val => val && val.fields && val.fields[airtableURLs.key] == data[airtableURLs.key] );

        if (matchingID == undefined) {

            return await lookForValueinAirtable(matchingID, data);

        }

        let updateToAirtable = await this.axiosRequest({ method: "PUT", data: formatData(matchingID, data), URL: airtableURLs.put});


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
                    console.log('Unable to scan directory: ' + err);
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
        console.log(values);
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
        delete req.body.modelName;

        let result = await model.findOneAndUpdate({_id: req.body._id},req.body,{new: true, upsert: true}).lean();

        if (result == undefined) return {status: 404, error: 'did not find matching document'};

        let airtableSync = {};

        console.log( req.body );

        if (req.body.airtableSync != "false" ) {
            airtableSync = await this.syncWithAirtable({collection: modelName, data: req.body})
        } else {
            airtableSync.msg = "Sync manually kept off";
        }

        console.log(airtableSync);

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

    createModel : async function(modelName) {

        try {
            let modelExistsAlready = Object.keys(mongoose.models).some(val => val == modelName);
            let schemaExistsAlready = Object.keys(mongoose.modelSchemas).some(val => val == modelName);
            if (modelExistsAlready) { mongoose.models[modelName] = ''; };
            let schema = await Collections.findOne({name: modelName}).lean();
            // console.log({modelName});
            return mongoose.model(modelName, new mongoose.Schema(schema.properties, { timestamps: { createdAt: 'created_at' } }));
        } catch(e) {
            console.log( chalk.blue.bold( 'Failed to create Model' + ':' + modelName ) );
            return e;
        }
        
    },

    airtableSync: async function(req,res) {
        console.log('show Airtable Sync page here');
        req.params.theme = 'root';
        let output = await Collections.findOne({name: req.params.input}).lean();
        console.log(output.airtable);
        console.log(req.query.msg);
        return {
            modelName: req.params.input,
            brand: req.params.brand,
            collection: req.params.input,
            values: output.airtable,
            msg: req.query.msg
        };
    },

    saveAirtableURLs: async function(req,res) {

        try {

            let connectingKeys = ( await this.axiosRequest({ method: "GET", URL: req.body.get + "&fields=" + req.body.key }) ).data.records;

            if (connectingKeys == undefined) throw "Could not find matching data in airtable";

            req.body.connectingKeys = connectingKeys;

            let airtableAdded = await Collections.findOneAndUpdate({name: req.params.input}, { $set: { airtable: req.body } }, {new: true});

            console.log( airtableAdded );

            req.params.theme = 'root';

            return {
                output: airtableAdded,
                msg: "Successfully saved in database",
            }

        } catch (e) {
            console.log(e);
            req.params.theme = 'root';
            return {
                output: '',
                msg: "Could not find matching data in airtable"
            }
        }

    },

    updateManyByKey: async function(req,res) {

        console.log(req.body.data);

        let model = await this.createModel(`${req.params.input}`);
        let output = await Promise.all(req.body.data.map((val,index) => model.findOneAndUpdate({ [val.key] : val.data[val.key] }, val.data , { new: true, upsert:true }) ));

        console.log(output);
        return {
            output
        };

    },

    fetchAirtableData: async function(req,res) {

        console.log('Fetching airtable data now');

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
                // if (val["fields"][airtableURLs.key] == row[airtableURLs.key] ) console.log( val['fields'][airtableURLs.key], row[airtableURLs.key] );
                return val["fields"][airtableURLs.key] == row[airtableURLs.key] ;
            });
            if (matchInLocal != undefined) return null;
            return {
                local: matchInLocal,
                airtable: val
            }
        }).filter( val => val != null );

        console.log({
            localToAirtable: localToAirtable.length, 
            airtableToLocal: airtableToLocal.length,
            inFocus: file.filter( val => val.fields.ser == '1061' || val.fields.ser == '1062' )
        });
            
        let sidebyside = localToAirtable.concat(airtableToLocal);

        sidebyside = [...new Set(sidebyside)];

        let getDifferences = function (focal) {

            if (focal.local == undefined || focal.airtable == undefined) {

                let makeObjectAnArray = function(object, database) {

                    // console.log( object, database );
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

                // console.log( focal.local[val], focal.airtable.fields[val] );

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
        console.log('show airtable pull page here');
        req.params.theme = 'root';
        return {
            brand: req.params.brand,
            collection: req.params.input
        };
    },

    mergeDataIntoCollection : async function(req,res) {
        console.log(' merge data into collection here ');

        let model = await this.createModel(req.params.input);
        let output = await model.insertMany(req.body.results);
        console.log(output);

        return {success: true, output: output}
    },

    save : async function(model,data) {
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
                html: 'selectForeignKey'
            },{
                name: 'Object',
                html: 'JSON'
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
            return {
                name: val,
                type: collectionDetails.properties[val].type,
                required: collectionDetails.properties[val].required,
                html: collectionDetails.properties[val].html == undefined ? 'input' : collectionDetails.properties[val].html
            };
        });
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

        let inputCollection = await Collections.findOne({name: req.params.input}).lean();

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
                }
            }
            return total;
        });


        // STATIC THEME OF ROOT WHEN SHOWCOLLECTION IS USED
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
        return {
            status: 200,
            redirect: req.params.input,
            success: 'Session Destroyed'
        };
    },

    deleteDocument: async function(req,res) {
        let model = await this.createModel(req.params.input);
        let result = await model.deleteOne({_id: req.query._id});
        return {
            status: 200,
            success: result 
        };
    },

    forgotpw: async function(req,res) {
        console.log('Send a 4 digit code here');
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

    signup: function(req,res) {
        return {
            status: 200,
            success: 'sign up page comes here',
            brand: req.params.brand
        }
    },

    checkSignIn: async function(req,res) {
        console.log('checking signin');
        let model = await this.createModel(`${req.params.brand}-users`);
        let output = await model.findOne({email: req.body.email, password: req.body.password}).lean();
        // if 7am does not have this user look into myapp. it can be an brand. 
        if (!output) {
            model = await this.createModel('myapp-users');
            output = await model.findOne({email: req.body.email, password: req.body.password}).lean();
        };

        // If still no user found , return mismatch
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
        // /root/admin/data/runAndRedirect/deleteDocument?_id=123123&&redirect=showCollection&redirectInput=root-users
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
                console.log(process.env.url);
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

    life: async function(req,res) {

        let output = await this.getBlogs(req,res);
        return {
            pjaxId: req.params.input,
            brand: req.params.brand,
            blogs: output,
        };
    },

    getBlogs: async function(req,res) {

        let model = await this.createModel(`life-blogs`);
        let exp = new RegExp(req.query.keyWord,'i');
        let output = await model.aggregate(
            [
                {
                    $match: {
                        body: exp
                    }
                },{
                    $addFields: {
                        intSer: {
                            $toInt: "$ser"
                        }
                    }
                },{
                    $sort: {
                        intSer: -1
                    }
                }
            ]);
        output = output.map( (val,index) => {
            val.index = output.length - index;
            val.date = this.dateBlogHeader(val.date);
            val.body = this.convertStringToArticle(val.body);
            return val;
        });

        return output;
    },

    blogs: async function(req,res) {

        let output = await this.getBlogs(req,res);
        console.log(output);
        return {
            blogs: output,
        }
    },

    vlogs: async function(req,res) {
        return {
            msg: "vlogs show up here"
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

    challenge: async function(req,res) {
        return {
            sessionExists: req.session.hasOwnProperty('person') 
        };
    },

    richpakistan: async function(req,res) {
        console.log('opening rich pakistan');
        return {
            success: true
        }
    },


    landingPage: async function(req,res) {
        console.log({theme: req.params.theme});
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
                    // TODO: Make the session ID concatanate with Database Query
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
            console.log(e);
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
        // console.log(chalk.bold.red('finding order by query') );
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

    profile : async function(req,res) {
        return {
            success: true
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

    showPage: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-pages`);
        let output = await model.findOne({slug: req.params.input}).lean();
        model = await this.createModel(`${req.params.brand}-resources`);
        let resources = await model.find({});
    //     let countCart = await this.countItemsInCart(req,res);
        return {
            resources: resources,
            // countCart: countCart,
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
        console.log(req.params);
        console.log(req.body);
        let output = await model.findOneAndUpdate({_id:req.params.input},{$set: 
            {
                content: req.body.output,
                page: req.body.page,
                slug: req.body.slug,
                type: req.body.type
            }
            },{new:true}).lean();

        console.log( output );
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
        console.log( chalk.bold.blue('Items out of stock') );

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

        console.log({body: req.body});
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

        console.log({output});
        return output;
    },

    showPages: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-pages`);
        var query = processQuery(req.query);
        console.log({query});
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

        // store all collections inside a separate file

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

        console.log(file);

        let collectionFile = file.filter( val => val.name === 'collections' )[0];

        try { let collectionDrop = await mongoose.connection.db.dropCollection('collections'); } 

        catch (e) { console.log(e) }

        // console.log( Collections.schema );
        // console.log(collectionFile); 

        let collectionSave = await Promise.all( collectionFile.data.map( val => Collections.findOneAndUpdate({_id: val._id}, val, {upsert: true}) ) );

        // remove collections from file now

        file = file.filter( val => val.name !== 'collections' );

        console.log( 'FILE SHOWING' );
        console.log( file );

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

        // console.log(funcs);

        let emptyAllCollections = await Promise.all( funcs.map( val => val.model.deleteMany({}) ) );
        let outputs = await Promise.all( funcs.map( val => val.model.findOneAndUpdate({_id: val.data._id}, val.data, {upsert: true}) ) );

        return {success: true};

    },

    challenges: async function(req,res) {
        return {
            sessionExists: true
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
        console.log(output);
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
        console.log(req.query);
        let model = await this.createModel(req.params.input);
        let output = await model.findOne({_id: req.query._id}).lean();
        output.date = this.getFormattedDate(output.date);
        console.log(output);
        return {
            blog: output
        };
    },

    saveBlog: async function(req,res) {
        let model = await this.createModel('life-blogs');
        console.log(req.body);
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
        console.log(req.body);
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

        // let formattedDate = this.getFormattedDate(date);
        let d = new Date(date);
        let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
        let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
        let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
        return `${da} ${mo}, ${ye}`;

    },

    convertStringToArticle: function( string ) {
        let body = string.split('\n').map(val => {
            // console.log(val);
            return {
              type: val.split(': ')[0].indexOf('.') != -1 ? val.split(': ')[0].split('.')[0] : val.split(': ')[0],
              msg: val.split(': ')[1].trim(),
              class: val.split(': ')[0].indexOf('.') != -1 ? val.split(': ')[0].split('.').slice(1,4).join(' ') : ''
            }
          });
        return body;
    },

    openBlog: async function(req,res) {
        let model = await this.createModel('life-blogs');
        let output = await model.findOne({slug: req.params.input}).lean();
        let body = this.convertStringToArticle(output.body);
        output.date = this.dateBlogHeader(output.date);
        return {
            output: output,
            body: body,
            tags: output.tags.split(',')
        };
    },

    subscribeCustomer: async function(req,res) {

        let model = await this.createModel(`${req.params.brand}-subscribers`);
        
        let isSubscribed = await model.findOne({email: req.body.email, validation: true}).lean();

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
                email: req.body.email, 
                validation: false, 
                isUnsubscribed: false,
                lists: 'public'
            }, {
                upsert: true, 
                new: true
            }
        );

        // Send an Email to the customer saying "Please click on this link to verify your subscription request"
        let url = '';

        url = process.env.url + `/life/gen/page/verifyEmail/n?email=${req.body.email}&uniqueCode=${output._id}`;

        let mailResponse = await this.sendMail({template: 'verifyEmail', context: {url : url}, toEmail: req.body.email, subject: 'Verify Email'});

        return {
            output
        }

    },

    sendMail : async function({template, context, toEmail, subject, brand}) {

        let testAccount = await nodemailer.createTestAccount();

        let transporter = nodemailer.createTransport({
          host: "smtppro.zoho.eu",
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: process.env.zoho, // generated ethereal user
            pass: process.env.zohop,
          },
        });

        let file = await new Promise( (resolve, reject) => {

            fs.readFile(`./views/emails/${template}.hbs`, 'utf8', (err, data) => {
                if (err) reject(err)
                resolve(data);
            });

        });

        let  hbstemplate = hbs.compile(file);
        let  html = hbstemplate({data: context});

        var mail = {
           from: `Qasim Ali<${process.env.zoho}>`,
           to: toEmail,
           subject: subject,
           html: html
        }

        const info = await transporter.sendMail(mail);

        return info;

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
            this.sendEmailWithTemplate(req.params.brand, 'welcome-email', output);
            return {
                brand: req.params.brand,
                msg: 'Email Verified. Thank you for subscribing to my weekly newsletter.',
            }
        } else {
            return {
                brand: req.params.brand,
                msg: 'Sorry — this link is already used.'
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

        if (pendingLetters.length == 0) return {success: 'Currently there are no newsletters pending Publish'};

        let output = pendingLetters.map( val => this.setTimerToPublish(val) );

        console.log({output});

        return {
            success: 'Timer for website Life is now running',
            status: output,
        }

    },

    setTimerToPublish: function(letter) {

        var now = new Date();
        var publishTime = letter.publishTime;

        console.log('Time Now: ' + now);
        console.log('Publish Time: ' + publishTime);

        var millisTillPublish = new Date(letter.publishTime) - now;

        console.log({minutesToPublish: ( millisTillPublish / 1000 / 60 ) });

        setTimeout( async () => {
            
            console.log( chalk.bold.red( 'PUBLISHING THE NEWSLETTER NOW : ' + letter.slug ) );

            // let body = this.convertStringToArticle(letter.body);

            let output;

            let model = await this.createModel(`life-subscribers`);

            output = await model.find({
                lists: letter.list,
                validation: true,
                isUnsubscribed: false
            }).lean();

            let mailSent = await this.sendBulkEmailWithTemplate('life', letter.slug, output);

	   console.log(mailSent);

            let url = process.env.url;
            // let url = env == 'test' || env == 'development' ? process.env. : 'https://qasimali.xyz'

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
                template: 'lifeNewsletter',
                context: {
                    body: this.convertStringToArticle(letter.body),
                    Id: val._id,
                    email: val.email,
                    url: process.env.url, 
                },
                toEmail: val.email,
                subject: letter.subject
            });

        });

        let sentMails = await Promise.all( arrayOfPromises );

        return sentMails;

    },

    sendEmailWithTemplate: async function(brand, templateSlug, subscriber) {

        let model = await this.createModel(`${brand}-newsletters`);
        let output = await model.findOne({slug: templateSlug}).lean();
	console.log(output);
        if (output == null) return console.log( chalk.bold.red( 'COULD NOT SEND MAIL BECAUSE SLUG WAS NOT FOUND' ) );


        let sentMails = await this.sendMail(
            {
                template: 'lifeNewsletter', 
                context: {
                    body: this.convertStringToArticle(output.body),
                    Id: subscriber._id,
                    email: subscriber.email ,
                    url: process.env.url, 
                }, 
                toEmail: subscriber.email, 
                subject: output.subject
            }
        );
    },

    unsubscribeMe: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-subscribers`);
        let output = await model.findOneAndUpdate({
            _id: req.query.Id,
            email: req.query.email,
            validation: true
        },{
            isUnsubscribed: true
        },{
            new: true
        }).lean();

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
                          // console.log(res);
                          return res;
                      })
                      .catch(error => {
                        // console.error(error.response.data)
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

        console.log(output);

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
        console.log( output.data.records );
        return {
            list: output.data.records.map( val => val.fields )
        }
    },

    emptyFile: async function(req,res) {

        return {
            success: "true"
        }

    },

    editWeb: async function(req,res) {

        let theme = req.params.theme;
        console.log( { theme } );
        req.params.theme = 'root';

        let file;
        let readHBSFile = async function(path) {

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

        console.log(req.body)

        let writeFile = async function(path,data) {

            let file = await new Promise( (resolve, reject) => {

                fs.writeFile(path, data, (err, data) => {
                    if (err) {
                        console.log(err);
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
        console.log( " create project page opening ");
        return {
            success: true
        }

    },

    createdProj: async function(req,res) {

        console.log(req.body); 

        let missingValues = Object.values(req.body).some( val => val.length == 0 );
        console.log( missingValues );

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
            console.log(dir);
            fs.mkdirSync(dir);
            let files = req.body.files.includes(",") ? req.body.files.split(',') : ['landingPage', req.body.files];
            console.log({files});
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
            console.log('created a new User row inside the Collections'); 

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
            console.log('created a new Notifications row inside the Collections'); 

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

            console.log(count);

            return count;


        };

        let checkPrvs = await checkEarlierExists({brandName: req.body.brandName});

        if (Object.values(checkPrvs).some(val => val != 0)) {

            return redirect("Already exists in the collection = " + JSON.stringify(checkPrvs) );

        }

        await createUsersCollection({brandName: req.body.brandName});
        await createNotificationsCollection({brandName: req.body.brandName});
        let output = await model.create({brand: req.body.brandName, theme: req.body.projName});
        console.log(output); 
        let output2 = await model2.create({
            email: req.body.ownerEmail, 
            name: req.body.ownerName, 
            password: req.body.ownerPassword,
            brand: req.body.brandName,
            role: 'admin'
        });

        console.log(output2); 
        
        console.log("new project created successfully");
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

            console.log(data);
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

        console.log(allData);

        req.params.module = "createdProj";
        req.params.theme = "root";

        return allData;

    },

    property: async function(req, res) {

        let output = await this.fetchPropertiesDataForPage(req,res);

        output.filters.status = output.filters.status.filter( val => {
            console.log(val);
            console.log(val.name.match(/archive|sold/gi));
            return val.name.match(/archive|sold/gi) == null;
        });

        output.forms = this.getForms({msgBoxClient: true, contactForm: true});

        console.log(JSON.stringify(output, 0, 2));

        return output;

    },

    showAll: async function(req,res) {

        let output =  await this.fetchPropertiesDataForPage(req,res);

        output.forms = this.getForms({msgBoxAdmin: true, addProperty: true});

        console.log(JSON.stringify(output, 0, 2));

        return output;

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

        filters = this.getFiltersStatus(filters, req.query);

        return {
            properties: await this.getProperties(req,res),
            filters: filters,
            brand: req.params.brand,
            input: req.params.input,
            permit: req.params.permit,
            module: req.params.module,
        }

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

            console.log(val, query.status);
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

        console.log(output);

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
                        $toInt : "$price"
                    }
                }
            },{
                $sort: {
                    "priceInNo": req.query.hasOwnProperty('sort') ? Number(req.query.sort) : -1
                }
            }
        ]);

        return output;

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

        console.log(query);

        return query;

    },

    drawForm: async function(req,res) {

        // open SIGN IN FORM and ADD A PROPERTY FORM AS A TEST
        // /chodhry/gen/page/drawForm/signin -- THIS DRAWS THE SIGN IN FORM

        return {
            form: this.getForms({[req.params.input]: true})[req.params.input]
        }
        

    },


    getForms: function({msgBoxClient, msgBoxAdmin, contactForm, editProperty, addProperty, addBlog, editBlog, editBusiness, signin }) {

        let object = {};

        if (msgBoxClient == true) {

            object.msgBoxClient = {
                heading: "MESSAGE BOX",
                note: "Write your message below and choose the option at the bottom to contact us.",
                class: "mt-24",
                elems: [
                    {
                        elem: "textarea",
                        value: "Sir are these properties available? What is your final demand. Please contact back.",
                        onkeyup: "saveInSession(this)"
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "WHATSAPP",
                        info: "Opens WhatsApp in your Phone / Computer with above pre-drafted message."
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "EMAIL",
                        info: "Opens Contact Form where you will enter your Contact No and Name.",
                        onclick: "openLayer('.contactForm')"
                    },{
                        elem: "button",
                        class: "btn",
                        value: "CLOSE MSG BOX",
                        onclick: "openLayer('.layerOne')"
                    } 
                ]
            }

        }

        if (msgBoxAdmin == true) {

            object.msgBoxAdmin = {
                heading: "MESSAGE BOX",
                note: "Draft your message and broadcast using WhatsApp.",
                class: "mt-24",
                elems: [
                    {
                        elem: "textarea",
                        value: "Sir fresh properties for today; contact to inquire more, please.",
                        onkeyup: "saveInSession(this)"
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "WHATSAPP",
                        onclick: "openWhatsApp(this)",
                        info: "Opens WhatsApp in your Phone / Computer with above pre-drafted message."
                    },{
                        elem: "button",
                        class: "btn",
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
                        onkeyup: "saveInSession(this)"
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

                heading: "CONTACT FORM",
                note: "Please fill in your contact details. We will get back to you in next few hours.",
                elems: [

                    {
                        elem: "textarea",
                        label: "YOUR MESSAGE",
                        name: "msg",
                        value: "",
                        onkeyup: "saveInSession(this)"
                    },{
                        elem: "input",
                        label: "YOUR NAME",
                        type: "text",
                        name: "name",
                    },{
                        elem: "input",
                        label: "YOUR CONTACT NO / EMAIL",
                        name: "contact",
                        type: "text",
                    },{
                        elem: "button",
                        class: "btn blue mt-24",
                        value: "SEND EMAIL",
                        onclick: "submitForm(this)"
                    },{
                        elem: "button",
                        class: "btn",
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
                        onkeyup: "saveInSession(this)"
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
                        onclick: "saveInSession(this)",
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
                        class: "btn blue"
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
                        onclick: "saveInSession(this)",
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
                        class: "btn blue"
                    },{
                        elem: "button",
                        value: "CLOSE",
                        onclick: "openLayer('.layerOne')",
                        class: "btn"
                    }
                ] 
            }

        }

        if (editBusiness == true) {

            
            object.editBusiness = {
                heading: "EDIT BUSINESS", 
                note: "Carefully enter these details. These are same details through which your clients contact you!.",
                elems: [
                    {
                        elem: "input",
                        name: "name",
                        type: "text",
                        label: "BUSINESS NAME",
                        value: "xyz",
                    },{
                        elem: "input",
                        name: "email",
                        label: "BUSINESS EMAIL",
                        info: "You recieve emails by visitors when they don't want to use WhatsApp to contact you.",
                        value: "xyz@asdf.com"
                    },{
                        elem: "input",
                        name: "whatsapp",
                        label: "BUSINESS WHATSAPP",
                        type: "text",
                        value: "+923235163638"
                    },{
                        elem: "textarea",
                        label: "BUSINESS ADDRESS",
                        name: "address",
                        value: "golmal bhai golmal",
                    },{
                        elem: "input",
                        label: "BUSINESS GOOGLE WEBSITE LINK (LOCATION)",
                        info: "Use google to find out your pin website link. Copy this link. And paste it in this field. When clients click on your Location, they are directed to this URL.",
                        name: "googleURL",
                        value: "http://asdfsadf.google.maps.com/123124124", 
                    },{
                        elem: "button",
                        class: "btn blue",
                        onclick: "submitForm(this)",
                        value: "SAVE"
                    },{
                        elem: "button",
                        class: "btn",
                        onclick: "openLayer('.layerOne')",
                    }
                ]

            }

        }


        if (signin == true) {


            object.signin = {
                heading: "ADMIN LOG IN",
                note: "This is log in page to the dashboard of this website. Please log in if you are an administrator of this business",
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
                        class: "btn blue",
                        onclick: "submitForm",
                    },{
                        elem: "button",
                        class: "btn",
                        onclick: "openLayer('.layerOne')",
                    }
                ] 
            }

        }


        return object;

    },

    propertyGenForm: async function(req,res) {

        switch (true) {
            case (req.params.input == 'contactEmail'):
                console.log( chalk.bold.blue( "SEND EMAIL to the OWNER EMAIL ADDRESS" ) );
                console.log( chalk.bold.blue( "STORE THIS MSG AND DETAILS INTO CONTACT COLLECTION" ) );
                break;
            case (req.params.input == 'contactWhatsApp'):
                console.log( chalk.bold.blue( "SENT WHATSAPP MSG FROM THE BROWSER" ) );
                console.log( chalk.bold.blue( "STORE IN CONTACT COLLECTION" ) );
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

            console.log(req.body);
            let model = await myFuncs.createModel(`${req.params.brand}-properties`);

            let output = await model.create(req.body);

            console.log(output);

            return output;

        }
            

        let output;

        switch (true) {
            case (req.params.input == 'editProperty'):
                console.log( chalk.bold.blue( "EDIT A PROPERTY" ) );
                output = await editProperty();
                break;
            case (req.params.input == 'addProperty'):
                console.log( chalk.bold.blue( "ADD A PROPERTY" ) );
                output = await addProperty();
                break;
            case (req.params.input == 'websiteContent'):
                console.log( chalk.bold.blue( "EDIT WEBSITE CONTENT" ) );
                break;
            case (req.params.input == 'statusChange'):
                console.log( chalk.bold.blue( "EDIT THE PROPERTY STATUS" ) );
                break;
            default: 
                break;
        }

        return output;

    },


};

server.listen(3000)
