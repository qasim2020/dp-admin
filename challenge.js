require('./config/config');

const mongoose = require('mongoose');
const express = require('express')
const hbs = require('hbs')
const app = express()
hbs.registerPartials(__dirname + '/views/partials');

app.get('/', function(req, res) {
  res.render('index.hbs', {
    challenge: [{
        name: "Start Namaz challenge",
        identity: "Namaz"
      },
      {
        name: "Start Quran Challenge",
        identity: "Quran"
      }
    ]
  })
})

app.get('/success', (req,res) => {
  res.render('createNewUser.hbs', {
    name: 'Qasim Ali',
    email: 'qasimali24@gmail.com',
    password: 'secret',
    challenge: req.query.identity,
    email_verification: false,
  })
})

app.post('/updateUser',(req,res) => {
  res.render('challenge.hbs',{
    msg: "Welcome Qasim to starting your 30 Days Challenge of getting punctual in your prayers.",
    challenges: [{
        name: "Start Namaz challenge",
        identity: "Namaz"
      },
      {
        name: "Start Quran Challenge",
        identity: "Quran"
      }
    ]
  })
})

app.get('/challenge', (req,res) => {
  res.render('challenge.hbs', {
    msg: `Welcome to ${req.query.label} challenge.`,
    challenges: [{
        name: "Start Namaz challenge",
        identity: "Namaz"
      },
      {
        name: "Start Quran Challenge",
        identity: "Quran"
      }
    ]
  })
})

app.get('/edit_user', (req,res) => {
  res.render('edit_user.hbs', {
    name: 'Qasim Ali',
    email: 'qasimali24@gmail.com',
    password: 'secret',
    challenge: req.query.identity,
    email_verification: false,
  })
})

app.get('/help', (req,res) => {
  res.render('help.hbs', {})
})

app.get('/signin', (req,res) => {
  res.render('login.hbs', {})
})

const {passport} = require('./passport');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

app.use(passport.initialize());
app.use(passport.session());

app.use(session({
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
}))
app.use(flash());

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/signin',
  failureFlash: true
}));

app.listen(3000)
