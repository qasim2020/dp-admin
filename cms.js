const chalk = require('chalk');


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

let schema = {
    name: {
        type: "String",
        required: true,
    },
    owner: {
        type: "String",
        required: true,
    },
    properties: {
        type: "Object",
        required: true,
    }
};

let Collections = mongoose.model('collections', new mongoose.Schema(schema));

hbs.registerPartials(__dirname + '/views/login/partials');

hbs.registerHelper('breaklines', (val) => {
  return val.split(/\n/g).join('<br>');
})

hbs.registerHelper('checkExists', (val) => {
    return val != undefined ? 'true' : '';
})

hbs.registerHelper('matchValues', (val1,val2) => {
    console.log(val1,val2,val1 == val2);
    return val1 == val2
});

app.use('/:owner/:permit/:requiredType/:module/:input', async (req,res,next) => {
    // what is module.role?
    // if module is gen --- next()
    // is User signed in ? down : res.redirect('/root/gen/page/signin/admin');
    // is User.role == module.role && User.brand == req.params.owner ? next() : 'not allowed to access this page / data' 
    console.log('');
    console.log(chalk.bold.red('new Request starts here'));
    console.log(req.params.module,myFuncs.moduleRole[req.params.module]);

    if (myFuncs['moduleRole'][req.params.module] == 'gen') return next();
    
    // if module is auth -- please sign in
    // if module is auth -- signed in      -- user has auth role against '7am'
    // if module is admin - signed in      -- user has admin role against '7am'
    // 
    // if it is auth -- signedin() ? person.role == module.role && person.owner == req.param.owner : please sign in
    // if false -------  
    // If (role: gen && module :  gen) go next()
    // if (role: admin && session : true && session.person.role : admin) go next()
    // if (role: auth && session: true && session.person.role: auth && module: auth) go next()

    if ( req.session && req.session.hasOwnProperty('person') ) {
        console.log({
            personRole: req.session.person.role,
            pagePermit: req.params.permit,
            personOwner: req.session.person.owner,
            pageOwner: req.params.owner
        });
        switch (true) {
            case (req.session.person.role == req.params.permit && req.session.person.owner == req.params.owner) :
                return next();
                break;
            default :
                return res.send('you are not authorized to make this request');
                break
        };
    };
    
    let checkCollectionExists = await myFuncs.checkCollectionExists(`${req.params.owner}-users`);
    console.log(checkCollectionExists, `${req.params.owner}-users`);
    console.log(chalk.red.bold({showingTruth: checkCollectionExists}));
    if (checkCollectionExists) {
        return res.redirect(`/${req.params.owner}/gen/page/signin/home/`);
    };

    checkCollectionExists = await myFuncs.checkCollectionExists(`collections`); 
    console.log(checkCollectionExists, 'collections');
    if (checkCollectionExists == false) {
        let data = {
            name: 'collections',
            owner: 'root',
            properties: schema,
        };
        let output = await myFuncs.save(Collections,data);
        console.log(chalk.bold.red('first collection created'));
        console.log(output);
        return next();
    };
    console.log(chalk.bold.yellow('All checks completed moving to admin route!'));
    next();
});

app.get('/:owner/:permit/:requiredType/:module/:input', async (req,res) => {

    let data = await myFuncs[req.params.module](req,res);
    myFuncs.respond(data,req,res);

});

app.post('/:owner/:permit/:requiredType/:module/:input', async (req,res) => {

    let data = await myFuncs[req.params.module](req,res);
    myFuncs.respond(data,req,res);

});

var myFuncs = {

    moduleRole: {
        respond: 'admin',
        newDocument: 'admin',
        editDocument: 'admin',
        deleteDocument: 'admin',
        checkCollectionExists: 'admin',
        createModel: 'admin',
        save: 'admin',
        dropCollection: 'admin',
        createNewCollection: 'admin',
        saveSequence: 'admin',
        showCollection: 'admin',
        destroySession: 'admin',
        checkAdmin: 'admin',
        signin: 'gen',
        checkSignIn: 'gen',
        signup: 'gen',
        home: 'auth',
    },

    respond: function(data,req,res) {
        console.log(chalk.bold.yellow('sending data to page'), data);
        switch(true) {
          case (data.error): 
            return res.status(data.status).send(data.error);
          case (req.params.requiredType == 'data'):
            console.log('this is data request');
            return res.status(200).send(data);
            break;
          case (req.params.requiredType == 'page'):
            console.log('this is page request');
            return res.status(200).render(`${req.params.owner}/${req.params.module}.hbs`,{data});
            break;
          default:
        }
    },
    newDocument: async function(req,res) {
        let collection = await Collections.findOne({name: req.params.input}).lean();
        let properties = collection.properties;
        let keys = Object.keys(collection.properties);
        let values = Object.values(collection.properties);
        let output = keys.map(val => {
            return {
                label: val.charAt(0).toUpperCase() + val.slice(1),
                type: properties[val]['type'] == 'String' ? 'input' : 'radio',
                name: val,
                id: val,
                required: 'required',
                value: '',
            };
        });
        output.collection = req.params.input;
        console.log(output);
        return output;
    },

    editDocument: async function(req,res) {
        // get this document details
        // fill out the form 
        return {success: 'done'};
    },

    checkCollectionExists: async function(collectionName) {
        console.log(`checking if ${collectionName} exists or not`);
        let result = await mongoose.connection.db.listCollections().toArray();
        return result.some(val => val.name == `${collectionName}`);
    },

    createModel : async function(modelName) {
        
        let modelExistsAlready = Object.keys(mongoose.models).some(val => val == modelName);
        let schemaExistsAlready = Object.keys(mongoose.modelSchemas).some(val => val == modelName);

        console.log({modelExistsAlready,schemaExistsAlready});

        if (modelExistsAlready) return mongoose.models[modelName];

        let schema = await Collections.findOne({name: modelName}).lean();
        console.log(schema);

        return mongoose.model(modelName, new mongoose.Schema(schema.properties));
        
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
    
    dropCollection: async function(req,res) {
        try {
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

    createNewCollection : function(req,res) {
        if (req.params.input == 'n') return {
            error: 'Please give collection Name'
        };
        console.log(`creating new collection at ${req.params.input}`);
        return {
            owner: req.params.owner,
            name: req.params.owner + '-' + req.params.input,
            types: ['String','Number','Array','Object','Options','CheckBoxes']
        };
    }, 

    saveSequence: async function(req,res) {
        console.log(req.body);
        let model = await this.createModel(req.body.modelName);
        let output = await this.save(model,req.body); 
        console.log(output);
        console.log('save sequence ends here');
        return output;
    },        

    showCollection: async function(req,res) {
        let collectionsTable = await Collections.find({owner: req.params.owner}).lean();
        let navRows = collectionsTable.map(val => val.name);
        let collectionHeadings = Object.keys(collectionsTable.find(val => val.name == req.params.input).properties);
        collectionHeadings.unshift('_id');
        collectionHeadings = collectionHeadings.concat(['edit','delete']);
        let model = await this.createModel(req.params.input);
        let dataRows = await model.find().lean();
        let newRows = dataRows.map(val => {
            let total = [];
            for (i=0; i<collectionHeadings.length; i++) {
                switch (true) {
                    case (collectionHeadings[i] == 'edit'):
                        total.push(`<a href="/root/admin/data/editDocument/${req.params.input}?_id=${val._id}">Edit</a>`)
                        break;
                    case (collectionHeadings[i] == 'delete'):
                        total.push(`<a href="/root/admin/data/deleteDocument/${req.params.input}?_id=${val._id}">Delete</a>`)
                        break;
                    default:
                        total.push(val[collectionHeadings[i]]);
                }
            }
            return total;
        });

        return {
            modelName: req.params.input,
            navRows: navRows,
            th: collectionHeadings,
            dataRows: newRows
        };
    },

    destroySession: function(req,res) {
        req.session.destroy();
        return {
            success: 'session destroyed'
        };
    },

    deleteDocument: async function(req,res) {
        console.log(req.query);
        console.log(req.params.input);
        let model = await this.createModel(req.params.input);
        let result = await model.deleteOne({_id: req.query._id});
        return {
            status: 200,
            success: result 
        };
    },

    signin: function(req,res) {
        console.log('opening signin module');
        return {
            status: 200,
            success: 'sign in page comes here'
        };
    },

    checkSignIn: async function(req,res) {
        let model = await this.createModel(`root-users`);
        let output = await model.findOne({email: req.body.email, password: req.body.password}).lean();
        if (!output) return {status: 400, error: 'Username password does not exist'};
        req.session.person = output;
        return {status:200, success: 'Successfully logged in'};
    },

    checkAdmin:  function(username,owner) { // find if Username in Session Variable matches the Owner Name in root-users database
        Users.findOne({person: username, owner: owner}).then(val => val !== null).catch(e => false); // dummy
    }
};

app.listen(3000)
