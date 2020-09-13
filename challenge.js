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

var env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  var config = require('./config.json');
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
    // if (req.headers.accept != process.env.test_call) console.log('SESSION STATE', Object.keys(req.session));
    res.locals.success_msg = req.flash('success_msg'); // req.flash([type], msg) < we will be giving msgs later ?
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');

    console.log(JSON.stringify(req.session,'',2));

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

hbs.registerPartials(__dirname + '/views/partials');

app.get('/', function(req, res) {
  req.session.challenge = [{
      name: "Start Namaz challenge",
      identity: "Namaz"
    },
    {
      name: "Start Quran Challenge",
      identity: "Quran"
    }
  ];

  res.render('index.hbs', {
    challenge: req.session.challenge
  })
})

app.get('/success', (req, res) => {

  // Create a session with current challenge !

  req.session.challenge = req.session.challenge.filter(val => {
    console.log([val.identity,req.query.identity]);
    return val.identity == req.query.challenge
  });

  console.log(req.session.challenge);

  res.render('createNewUser.hbs', {
    name: 'Qasim Ali',
    email: 'qasimali24@gmail.com',
    password: 'secret',
    challenge: req.query.identity,
    email_verification: false,
  })
})

app.post('/updateUser', (req, res) => {
  res.render('challenge.hbs', {
    msg: "Welcome Qasim to starting your 30 Days Challenge of getting punctual in your prayers.",
    challenges: req.session.challenge
  })
})

app.get('/challenge', (req, res) => {
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

app.get('/edit_user', (req, res) => {
  res.render('edit_user.hbs', {
    name: 'Qasim Ali',
    email: 'qasimali24@gmail.com',
    password: 'secret',
    challenge: req.query.identity,
    email_verification: false,
  })
})

app.get('/help', (req, res) => {
  res.render('help.hbs', {})
})

var User = mongoose.model('Users', new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  opted_challenges: {
    type: Object
  }
}));

passport.use(new LocalStrategy(
  function(username, password, done) {

    User.findOne({
      email: username
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: 'You have not yet Signed Up with this email. Please <a href="/">click here</a> to pick up a challenge and start changing your life.'
        });
      }
      // Match password
      if (!user.password) return done(null, false, {
        message: `You have already signed up using social media login. Please use the social media login to retry.`
      })
      bcrypt.compare(password, user.password, (err, isMatch) => {
        console.log(err);
        if (err) return done(null, false, {
          message: 'Something wrong with bcrypt compare function. Contact administrator.'
        });
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: 'Password incorrect'
          });
        }
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    if (err) done(null, false, {
      message: 'Failed to deserializeUser'
    })
    done(err, user);
  }).catch(e => done(null, false, {
    message: 'Failed to deserializeUser'
  }));
});

app.get('/signin', (req, res) => {
  res.render('login.hbs', {})
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/signin',
  failureFlash: true
}));

app.post('/createNewUser', (req, res) => {
  const {
    name,
    email,
    password
  } = req.body;

  let errors = [];

  if (!name || !email || !password) {
    errors.push({
      msg: 'Please enter all fields'
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: 'Password must be at least 6 characters'
    });
  }

  if (errors.length > 0) {
    res.render('createNewUser.hbs', {
      errors,
      name,
      email,
      password
    });
  } else {
    User.findOne({
      email: email
    }).then(user => {
      if (user) {
        errors.push({
          msg: 'Email already exists'
        });
        res.render('createNewUser.hbs', {
          errors,
          name,
          email,
          password,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          opted_challenges: req.session.challenge
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  `Thanks ${user.name} your account has been created.`
                );
                req.session.user = user;
                res.redirect('/home');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
})

app.get('/home', (req,res) => {
  console.log(req.user);
  res.status(200).render('home.hbs',{
    selected_challenge: req.session.challenge,
    opted_challenges: req.session.user.opted_challenges,
  });
})

app.listen(3000)
