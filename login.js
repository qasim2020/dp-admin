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

var Schools = mongoose.model('Schools', new mongoose.Schema({
  identity: {
    type: String
  },
  name: {
    type: String
  }
}, {
  timestamps: true
}));


// MAKING ADMIN ROLE TO MAKE SURE ONLY AUTHENTICATED PEOPLE CAN ENTER THIS PLACE

var Persons = mongoose.model('Persons', new mongoose.Schema({
  username: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  role: {
    type: String
  }
}));

app.use('/admin', (req, res, next) => {
  console.log('middleware')
  if (!req.session.person) {
    req.flash('error','Please signin to access this page.');
    return res.redirect('/signIn');
  }
  else {
    Persons.findOne({
      _id: req.session.person
    }).then(val => {
      req.person = val,
      next();
    })
  }
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/showPersons');
})

app.get('/signin', (req, res) => {
  res.status(200).render('login/signinForm.hbs', {
    username: 'qasim',
    email: 'qasimali24@gmail.com',
    password: 'abcdabcd',
  })
})

app.post('/signin', (req,res) => {
  Persons.findOne({
    username: req.body.username,
    password: req.body.password
  }).then(val => {
    req.session.person = val._id;
    res.redirect('/admin')
  }).catch(e => {
    res.status(400).send(e);
  })
})

app.get('/signup', (req, res) => {
  res.status(200).render('login/signupForm.hbs', {
    username: 'qasim',
    email: 'qasimali24@gmail.com',
    password: 'abcdabcd',
  })
})

app.post('/signup', (req, res) => {
  const person = new Persons({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  })

  person.save().then(val => {
    console.log('HERE CHECK IN DATABASE THE USER GERARATED OR NOT');
    res.redirect('/signin');
  }).catch(e => {
    req.flash('error','User already exists. Please sign in.');
    res.redirect('/signin');
  })
})

app.get('/admin/logout', (req,res) => {
  req.session.person = null;
  req.flash('error','You have successfully logged out.');
  res.redirect('/signin');
})

app.get('/admin/showPersons',(req,res) => {
  res.render('login/showPersons.hbs');
})

app.listen(3000)



