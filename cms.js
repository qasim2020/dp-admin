const chalk = require('chalk');

const path = require('path');
const fs = require('fs');
//joining path of directory 
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
    return val1 == val2
});

hbs.registerHelper('removeSpaces', (val) => {
    return val.replace(/ /gi,'');
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
    let output =  val.split(' ')[1] == undefined ? val : val.split(' ')[1] ;
    return output;
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
    console.log(collectionsSavedCheck);
    if (collectionsSavedCheck == undefined) {
        let data = {
            name: 'collections',
            brand: 'myapp',
            properties: schema,
        };
        let output = await myFuncs.save(Collections,data);
        console.log(chalk.bold.red('first collection created'));
        console.log(output);
        return next();
    };

    let checkCollectionExists = await myFuncs.checkCollectionExists(`${req.params.brand}-users`);
    console.log(checkCollectionExists, `${req.params.brand}-users`);

    if (checkCollectionExists) {
        return res.redirect(`/${req.params.brand}/gen/page/signin/home/`);
    };
    
    checkCollectionExists = await myFuncs.checkCollectionExists(`myapp-users`);
    console.log(checkCollectionExists, `${req.params.brand}-users`);

    if (checkCollectionExists) {
        return res.redirect(`/myapp/gen/page/signin/home/`);
    };


    console.log(chalk.bold.yellow('All checks completed moving to admin route!'));
    next();
});

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

app.get( '/:brand/:permit/:requiredType/:module/:input', replyFunction );
app.post( '/:brand/:permit/:requiredType/:module/:input', replyFunction );

var myFuncs = {

    moduleRole: {
        respond: 'admin',
        runAndRedirect: 'gen',
        newDocument: 'admin',
        editDocument: 'admin',
        deleteDocument: 'admin',
        checkCollectionExists: 'admin',
        createModel: 'admin',
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
    },

    respond: async function(data,req,res) {
        console.log(chalk.bold.yellow('sending data to page ====='));
        console.log(JSON.stringify(data,'',2));
        switch(true) {
          case ( data.hasOwnProperty('error') ): 
            console.log( chalk.red.bold('error in data') );
            return res.status(data.status).send(data.error);
            break;
          case (req.query.hasOwnProperty('redirect')):
            return res.redirect(`/${req.params.brand}/${req.params.permit}/${req.params.requiredType}/${req.query.redirect}/${req.query.redirectInput}`);
            break;
          case (req.params.requiredType == 'data'):
            return res.status(200).send(data);
            break;
          case (req.params.hasOwnProperty('pageName')): 
            return res.status(200).render(`${req.params.theme}/${req.params.pageName}.hbs`,{data});
            break;
          case (req.params.requiredType == 'page'):
            return res.status(200).render(`${req.params.theme}/${req.params.module}.hbs`,{data});
            break;
          default:
        }
    },

    getThemeName: async function(brand) {
        let themesExist = await this.checkCollectionExists('myapp-themes');
        if (themesExist == false) return 'root';
        let theme = await myFuncs.createModel(`myapp-themes`);
        let extract = await theme.findOne({brand: brand}).lean();
        if (extract == null) return 'root'; 
        // console.log({theme: extract.theme, brand: brand});
        return extract.theme;
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
        let output = keys.map(val => {
            console.log('req.values', val, properties[val]['html'] );
            if (properties[val]['html'] == 'imgURL' && req.values && req.values[val] != undefined) {
                console.log('checking if this is triggered');
                console.log(chalk.red(req.values && req.values[val].split(' ')));
                req.values[val] = req.values && req.values[val].split(' ');
            }
            return {
                label: val.charAt(0).toUpperCase() + val.slice(1),
                // TODO: MAKE FORM SAVE HTML ALONG WITH SCHEMA TYPES
                type: properties[val]['html'],
                name: val,
                id: val,
                required: properties[val]['required'] || 'true',
                value: req.values && req.values[val] 
            };
        });
        // TODO: Make image tags extend according to their csvS
        console.log(output);
        return output;
    },

    newDocument: async function(req,res) {
        let output = await this.getFormInputs(req,res);
        output.collection = req.params.input;
        output.brand = req.params.brand;
        return output;
    },

    editDocument: async function(req,res) {
        let model = await this.createModel(req.params.input);
        req.values = await model.findOne({_id: req.query._id}).lean();
        if (req.values == undefined) return {status: 404, error: 'document does not exist so it can not be edited'};
        let output = await this.getFormInputs(req,res);
        output.collection = req.params.input;
        output._id = req.query._id;
        output.brand = req.params.brand;
        return output;
    },

    updateSequence: async function(req,res) {
        console.log(req.body);
        // return req.body;
        // modelName, _id, restCompleteDocument
        let model = await this.createModel(req.body.modelName);
        let result = await model.findOneAndUpdate({_id: req.body._id},req.body,{new: true}).lean();
        if (result == undefined) return {status: 404, error: 'did not find matching document'};
        return {success: true, result: result};
    },

    checkCollectionExists: async function(collectionName) {
        let result = await mongoose.connection.db.listCollections().toArray();
        return result.some(val => val.name == `${collectionName}`);
    },

    createModel : async function(modelName) {
        let modelExistsAlready = Object.keys(mongoose.models).some(val => val == modelName);
        let schemaExistsAlready = Object.keys(mongoose.modelSchemas).some(val => val == modelName);

        // zeroise this model first
        if (modelExistsAlready) {
            mongoose.models[modelName] = '';
        };

        let schema = await Collections.findOne({name: modelName}).lean();
        
        console.log(`creating collection ${modelName}`,schema);

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
    
    deleteFromCollection: async function(req,res) {
        let output = Collections.deleteOne({name: req.params.input});
        return output;
    },

    dropCollection: async function(req,res) {
        try {
            let collectionName = req.params.input.indexOf('-') > 0 ? req.params.input.split('-')[1] : req.params.input;
            console.log(collectionName);
            let output = await Collections.remove({name: `${req.params.brand}-collectionName`});
            await mongoose.connection.db.dropCollection(req.params.input);
            console.log({collectionName, output});
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
            }
        ];
    },

    createNewCollection : function(req,res) {
        if (req.params.input == 'n') return {
            error: 'Please give collection Name'
        };
        console.log(`creating new collection at ${req.params.input}`);
        let types = this.getTypes();
        return {
            brand: req.params.brand,
            name: req.params.brand + '-' + req.params.input,
            types: types,
        };
    }, 

    editCollection: async function(req,res) {
        if (req.params.input == 'n') return {
            error: 'Please give a Collection Name'
        };

        console.log(`editing a collection at ${req.params.input}`);
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
        return {
            _id: collectionDetails._id,
            brand: collectionDetails.brand,
            name: collectionDetails.name,
            types: types,
            inputs: output
        };
    },

    saveSequence: async function(req,res) {
        console.log('req.body');
        console.log(req.body);
        let model = await this.createModel(req.body.modelName);
        let output = await this.save(model,req.body); 
        console.log('this.save(req.body)');
        console.log(output);
        console.log('save sequence ends here');
        return output;
    },        

    showCollection: async function(req,res) {
        let collectionsTable = await Collections.find({brand: req.params.brand}).lean();
        let navRows = collectionsTable.map(val => val.name);
        console.log({collectionsTable: collectionsTable});

        if (collectionsTable.length == 0) return {
            status:200, 
            success: 'no Collection exists yet. Try starting the app with basic configurations.',
            brand: req.params.brand
        };

        req.params.input = req.params.input == 'n' ? `${req.params.brand}-users` : req.params.input;

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
                        total.push(`<a href="/${req.params.brand}/admin/page/editDocument/${req.params.input}?_id=${val._id}">Edit</a>`)
                        break;
                    case (collectionHeadings[i] == 'delete'):
                        total.push(`<a href="/${req.params.brand}/admin/page/deleteDocument/${req.params.input}?_id=${val._id}&redirect=showCollection&redirectInput=${req.params.input}">Delete</a>`)
                        break;
                    default:
                        total.push(val[collectionHeadings[i]]);
                }
            }
            return total;
        });

        return {
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
        return {
            status: 200,
            success: 'sign in page comes here',
            brand: req.params.brand,
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
        let model = await this.createModel(`${req.params.brand}-users`);
        let output = await model.findOne({email: req.body.email, password: req.body.password}).lean();
        console.log(`user found in ${req.params.brand}-users`,output);
        // if 7am does not have this user look into myapp. it can be an brand. 
        if (!output) {
            model = await this.createModel('myapp-users');
            output = await model.findOne({email: req.body.email, password: req.body.password}).lean();
            console.log(`user found in ${req.params.brand}-users`,output);
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

        return {
            brand: req.params.brand,
            collection: req.params.input,
            sampleRow: collectionHeadings
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
        console.log(csv);

        return new Promise ((resolve,reject) => {
            fs.writeFile('./static/myFile.csv', csv, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve('myFile.csv');
            });
        });
    },

    uploadMany: async function(req,res) {
        console.log(req.body.data);
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
        console.log('ecommerce trigger');
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
        console.log(req.body.width,req.body.height);
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
        console.log(output);
        return output;
    },

    searchItems: async function(req,res) {

        let query = {};

        if (req.body.itemName && req.body.itemName.length > 0) query.name = new RegExp(req.body.itemName,'i');
        if (req.body.selectedCategories && req.body.selectedCategories.length > 0) query.category = { $in : req.body.selectedCategories };
        if (req.body.selectedSchools && req.body.selectedSchools.length > 0) query.school = { $in : req.body.selectedSchools };

        let model = await this.createModel(`${req.params.brand}-items`);
        let output = await model.find(query).limit(20);
        
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
                   from: '7am-items',
                   localField: 'itemId',
                   foreignField: '_id',
                   as: 'items'
                 }
            },{
                $lookup:
                 {
                   from: '7am-items',
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
        console.log(req.body);
        let model = await this.createModel(`${req.params.brand}-cart`);
        let out = await model.deleteOne({_id: req.body.myId});
        console.log(out);
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

        console.log({number, length, my_string});

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
        console.log({output});
        console.log({cartIds});
        return 'cartClosed';
    },


    createOrder: async function(req,res) {
        // close these items in the cart
        let closeCart = await this.closeCartItems(req,res);
        console.log(chalk.bold.red( {closeCart} ));

        let order = req.body;
        order._id = order._id == '' ? new mongoose.mongo.ObjectID() : order._id ;
        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = model.findOneAndUpdate({_id: order._id}, order, {upsert: true, new: true});
        return output;
    },

    findOrderInSession: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-orders`);
        let output = await model.findOne({sessionId: req.sessionID}).lean();
        let highestOrder = await model.find({}, {orderNo: 1, _id:0}).sort({orderNo:-1}).limit(1);
        console.log({highestOrder});
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

    getCartItemsInArray: async function(req,res) {
        let model = await this.createModel(`${req.params.brand}-cart`);
        let cartIds = req.params.cartIds.split(' ').map( val => mongoose.Types.ObjectId(val) );
        console.log({cartIds});
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
                   from: '7am-items',
                   localField: 'itemId',
                   foreignField: '_id',
                   as: 'items'
                 }
            },{
                $lookup:
                 {
                   from: '7am-items',
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

        req.params.cartIds = myOrder.order.cartIds;
        let result = await this.getCartItemsInArray(req,res);
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
        console.log({itemID: req.params.input});
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
                   from: '7am-items',
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

};

app.listen(3000)
