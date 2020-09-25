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
  var config = require('./config00.json');
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

hbs.registerHelper('breaklines', (val) => {
  console.log(val);
  return val.split(/\n/g).join('<br>');
})

// LANDING PAGE

app.get('/', (req, res) => {
  res.render('login/index.hbs');
})

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
  // console.log('middleware')
  if (!req.session.person) {
    req.flash('error', 'Please signin to access this page.');
    return res.redirect('/signIn');
  } else {
    Persons.findOne({
      _id: req.session.person,
      role: 'admin'
    }).then(val => {
      if (!val) return Promise.reject('You are not allowed to access admin page.')
      req.person = val,
        next();
    }).catch(e => {
      req.flash('error', e);
      return res.redirect('/');
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

app.post('/signin', (req, res) => {
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
    req.flash('error', 'User already exists. Please sign in.');
    res.redirect('/signin');
  })
})

app.get('/admin/logout', (req, res) => {
  req.session.person = null;
  req.flash('error', 'You have successfully logged out.');
  res.redirect('/');
})

app.get('/admin/showPersons', (req, res) => {
  Persons.find().then(val => {
      res.status(200).render('login/showPersons.hbs', {
        allPersons: val
      })
    })
    .catch(e => {
      res.status(300).send(e);
    });
});

app.get('/admin/editPerson', (req, res) => {

  Persons.findOne({
      _id: req.query.id
    })
    .then(val => {
      console.log(val);
      return res.status(200).render('login/personForm.hbs', {
        person: val,
        required_action: 'updatePerson'
      })
    })
    .catch(e => {
      console.log(e);
      res.status(300).send(e);
    });
})

app.post('/admin/updatePerson', (req, res) => {
  console.log(req.body);
  Persons.findOneAndUpdate({
    _id: req.body.id,
  }, {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role
  }, {
    new: true,
  }).then(val => {
    console.log(val);
    res.redirect('/admin')
  }).catch(e => {
    res.status(300).send(e);
  })
})

app.get('/admin/newPerson', (req, res) => {
  res.status(200).render('login/personForm.hbs', {
    person: {
      username: 'arzi',
      email: 'arzi@hotmail.com',
      password: '1234',
      role: 'admin'
    },
    required_action: 'savePerson'
  })
})

app.post('/admin/savePerson', (req, res) => {
  const person = new Persons({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
  });

  person.save().then(val => {
    console.log(val);
    res.redirect('/admin')
  }).catch(e => {
    res.status(300).send(e);
  })
})

// ADD NEW EVENT

var Events = mongoose.model('Events', new mongoose.Schema({
  title: {
    type: String
  },
  date: {
    type: String,
    unique: true
  },
  time: {
    type: String
  },
  description: {
    type: String
  }
}));

app.get('/admin/showEvents', (req, res) => {
  Events.aggregate([{
        $match: {}
      },
      {
        $addFields: {
          id2String: {
            "$toString": "$_id"
          }
        }
      },
      {
        $lookup: {
          from: 'images',
          localField: 'id2String',
          foreignField: 'public_id',
          as: 'photo'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          date: 1,
          time: 1,
          description: 1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ])
    .then(val => {
      console.log(val);
      res.status(200).render('login/showEvents.hbs', {
        allEvents: val
      })
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

app.get('/admin/newEvent', (req, res) => {
  res.status(200).render('login/eventForm.hbs', {
    event: {
      title: 'Chapter 10: Making a Useful Website',
      date: '4 Oct 2020',
      time: '1015 AM to 1145 AM (1 hour 15 minutes)',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
    required_action: 'saveEvent'
  })
})

app.post('/admin/saveEvent', (req, res) => {
  const event = new Events({
    title: req.body.title,
    date: req.body.date,
    time: req.body.time,
    description: req.body.description,
  });

  event.save().then(val => {
    res.redirect('/admin/showEvents');
  }).catch(e => {
    res.status(300).send(e);
  })
})

app.get('/admin/editEvent', (req, res) => {

  Events.findOne({
      _id: req.query.id
    })
    .then(val => {
      return res.status(200).render('login/eventForm.hbs', {
        event: val,
        required_action: 'updateEvent'
      })
    })
    .catch(e => {
      console.log(e);
      res.status(300).send(e);
    });
})

app.post('/admin/updateEvent', (req, res) => {
  Events.findOneAndUpdate({
    _id: req.body.id,
  }, {
    title: req.body.title,
    date: req.body.date,
    time: req.body.time,
    description: req.body.description
  }, {
    new: true,
  }).then(val => {
    res.redirect('/admin/showEvents')
  }).catch(e => {
    res.status(300).send(e);
  })
})

// ADD IMAGES FLOW HERE

cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key: process.env.cloudAPI,
  api_secret: process.env.cloudAPISecret
});

let uploadCloudinary = (img, public_id) => {
  return cloudinary.uploader.upload(img, {
    resource_type: "image",
    public_id: public_id || mongoose.Types.ObjectId().toString(),
    folder: 'techshek',
    overwrite: true
  });
};

//  IMAGE OPERATIONS

var Images = mongoose.model('Images', new mongoose.Schema({
  public_id: {
    type: String
  },
  url: {
    type: String
  }
}, {
  timestamps: true
}));

// 1. saveNewImage route

app.get('/admin/newImage', (req, res) => {
  res.status(200).render('login/imageForm.hbs', {
    public_id: req.query.public_id,
    redirect: req.query.redirect,
    required_action: 'newImage',
  })
})

// 2. Save this image and route to show Schools
app.post('/admin/newImage', (req, res) => {
  uploadCloudinary(req.body.photo, req.body.public_id)
    .then(val => {
      const image = new Images({
        url: val.url,
        public_id: req.body.public_id
      });
      return image.save()
    })
    .then(val => {
      res.redirect('/admin/' + req.body.redirect);
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

// 3. edit an old image route

app.get('/admin/editImage', (req, res) => {
  Images.findOne({
      public_id: req.query.public_id
    }).then(val => {
      res.status(200).render('login/imageForm.hbs', {
        image: val,
        public_id: req.query.public_id,
        redirect: req.query.redirect,
        required_action: "updateImage"
      })
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

// 3. Upload image in database

app.post('/admin/updateImage', (req, res) => {
  uploadCloudinary(req.body.photo, req.body.public_id)
    .then(val => {
      return Images.findOneAndUpdate({
        public_id: req.body.public_id
      }, {
        url: val.url
      })
    })
    .then(val => {
      res.redirect('/admin/' + req.body.redirect);
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

app.get('/admin/showImages', (req, res) => {
  Images.find().then(val => {
    return res.status(200).render('login/showImages.hbs', {
      allImages: val
    })
  })
})

app.get('/admin/deleteImage', (req, res) => {
  Images.deleteOne({
    _id: req.query.id
  }).then(val => {
    res.redirect('/admin/showImages')
  }).catch(e => {
    res.status(200).send(e);
  })
})

// STRIPE PAYMENTS

const stripe = require('stripe')(process.env.STRIPE);

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Ticket',
        },
        unit_amount: 500,
      },
      quantity: 1,
    }, ],
    mode: 'payment',
    success_url: `${process.env.url}/success`,
    cancel_url: `${process.env.url}/`,
  });

  res.json({
    id: session.id
  });
});

app.get('/success', (req,res) => {
  res.status(200).render('login/signupForm.hbs', {
    username: '',
    email: req.session.email,
    password: '',
  })
})

app.listen(3000)
