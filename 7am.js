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
  var config = require('./config0.json');
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
    if (req.headers.accept != process.env.test_call) console.log('SESSION STATE', Object.keys(req.session));
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  },
  bodyParser.urlencoded({
    extended: true
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

hbs.registerPartials(__dirname + '/views/7/partials');

cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key: process.env.cloudAPI,
  api_secret: process.env.cloudAPISecret
});

let uploadCloudinary = (img, public_id) => {
  return cloudinary.uploader.upload(img, {
    resource_type: "image",
    public_id: public_id || mongoose.Types.ObjectId().toString(),
    folder: '7AM',
    overwrite: true,
    transformation: [{
      width: 1200,
      height: 800,
      crop: "limit"
    }],
  });
};

var Items = mongoose.model('Items', new mongoose.Schema({
  ser: {
    type: String
  },
  school: {
    type: String
  },
  name: {
    type: String
  },
  cost: {
    type: String
  },
  size: {
    type: String
  },
  qty: {
    type: String
  },
  photo: {
    type: Object
  },
}));

app.get('/admin', function(req, res) {

  Items.find().then(val => {
    console.log(val);
    res.render('7/admin.hbs', {
      schools: ["Beacon House Public School", "Army Public School Chakwal", "Happy Home School", "F.G Public High School"],
      ser: 4,
      name: "name",
      cost: "120",
      size: "size",
      qty: "10",
      photo: "photo",
      items: val
    })
  }).catch(e => {
    console.log(e);
    res.status(400).send(e);
  })
})

app.post('/saveItems', (req, res) => {
  console.log(req.body);
  uploadCloudinary(req.body.photo)
    .then(res1 => {
      return Items.findOneAndUpdate({
        ser: req.body.ser
      }, {
        ser: req.body.ser,
        school: req.body.school,
        name: req.body.name,
        cost: req.body.cost,
        size: req.body.size,
        qty: req.body.qty,
        photo: [
          res1.url,
          res1.public_id,
        ],
      }, {
        upsert: true,
        new: true
      })
    })
    .then(output => {
      res.redirect('/admin');
    })
    .catch(e => {
      console.log(e);
      res.status(300).send(e);
    });
})

app.get('/deleteItem', (req, res) => {
  Items.deleteOne({
      ser: req.query.ser
    })
    .then(output => {
      console.log(output);
      res.redirect('/admin');
    })
    .catch(e => {
      console.log(e);
      res.status(300).send(e);
    });
})

app.get('/editItem', (req, res) => {
  Items.findOne({
      ser: req.query.ser
    })
    .then(val => {
      console.log(val);
      res.render('7/admin.hbs', {
        schools: ["Beacon House Public School", "Army Public School Chakwal", "Happy Home School", "F.G Public High School"],
        ser: 4,
        name: "name",
        cost: "120",
        size: "size",
        qty: "10",
        photo: "photo",
        items: val
      })
    }).catch(e => {
      console.log(e);
      res.status(400).send(e);
    })
})

app.listen(3000)
