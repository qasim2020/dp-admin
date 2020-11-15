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
var cloudinary = require('cloudinary').v2;

var env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  var config = require('./config000.json');
  var envConfig = config[env];
  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });
}

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
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
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

hbs.registerPartials(__dirname + '/views/login/partials');

hbs.registerHelper('breaklines', (val) => {
  return val.split(/\n/g).join('<br>');
})

hbs.registerHelper('checkExists', (val) => {
    return val != undefined ? 'true' : '';
})

app.use('/:owner/admin', async (req,res,next) => {
    if ( req.session && req.session.hasOwnProperty('person') ) {
        checkAdmin = await checkAdmin(req.session.person.username,req.params.owner);
        if (!checkAdmin) return landingPage(req.params.owner,'You are not authorised to access admin  page');
        next();
    };
    let checkCollectionExists = await myFuncs.checkCollectionExists(`${req.params.owner}-users`);
    if (checkCollectionExists) {
        return signin(req.params.owner,admin);
    };
    return myFuncs.createNewCollection(req,res,`${req.params.owner}-users`);
});

app.get('/:owner/admin/:module',(req,res) => {
    return myFuncs[req.params.module](req,res);
});

app.get('/:owner/:requiredType/:module/:input',async (req,res) => {
    // CREATE A MODEL 
    // Create a COLLECTION WITH A CERTAIN NAME
    // SAVE AN ITEM IN THIS COLLECTION
    // Do all this using the myFuncs
    // To make sure it is movable
    let Model = myFuncs.createModel(req.params.input,{
        name: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true
        }
    });
   let output = await myFuncs.findAll(Model); 
    return console.log(output);
    // What are they looking for ? data or page ?
    switch(true) {
      case (req.params.requiredType == 'data'):
        return res.send('this is data request');
        // code block
        break;
      case (req.params.requiredType == 'page'):
        return res.send('this is page request');
        // code block
        break;
      default:
        // code block
    }
    // let data = myFuncs[req.param.module](req,res);
    // myFuncs[req.params.module](req,res);
});

var myFuncs = {
    signup: function(req,res) { return res.send('sign up') },
    signin: function(req,res) { return res.send('sign in') },
    checkCollectionExists: async function(collectionName) {
        console.log(`checking if ${collectionName} exists or not`);
        let result = await mongoose.connection.db.listCollections().toArray();
        return result.some(val => val.name == `${collectionName}`);
    },
    createModel : function(modelName, data) {
        return mongoose.model(modelName, new mongoose.Schema(data));
    },
    findAll: function(modelName) {
        return modelName.find();
    },
    createNewCollection : function(req,res,collectionName) {
        console.log(`creating new collection at ${collectionName}`);
        // newCollection Page always loaded from root
        return res.render('root/createNewCollection.hbs',{
            owner: req.params.owner,
            name: collectionName,
            types: ['String','Number','Array','Object','Options','CheckBoxes']
        });
    },
    checkAdmin:  function(username,owner) { 
        // find if Username in Session Variable matches the Owner Name in root-users database
        Users.findOne({person: username, owner: owner}).then(val => val !== null).catch(e => false); // dummy
    }
};

app.listen(3000)
