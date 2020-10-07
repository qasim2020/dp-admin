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

// LANDING PAGE

app.get('/', (req, res) => {
    Events.aggregate([{
        $match: {status: 'active'}
      },
      {
          $limit: 1
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
          status:1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ]).then(val => {
        return res.render('login/index.hbs', {
            loggedIn: req.session && req.session.person != undefined || req.session && req.session.person != null,
            username: req.session && req.session.person && req.session.person.username,
            event: val[0]
          });
    }).catch(e => {
        res.status(500).send(e);
    });
})

// MAKING ADMIN ROLE TO MAKE SURE ONLY AUTHENTICATED PEOPLE CAN ENTER THIS PLACE

var Persons = mongoose.model('Persons', new mongoose.Schema({
  username: {
    type: String,
    unique: true
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
  if (!req.session.person) {
    req.flash('error', 'Please signin to access this page.');
    return res.redirect('/signIn');
  } else {
    Persons.findOne({
      email: req.session.person.email,
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
    required_action: '/signin'
  })
})

app.post('/signin', (req, res) => {
  Persons.findOne({
    username: req.body.username,
    password: req.body.password
  }).then(val => {
	if (val == null) {
		req.flash("error","Invalid Username or Email. Please sign up if you have not yet registered.");
		return res.redirect('/signin');	
	} 
    req.session.person = {
      email: val.email,
      username: val.username
    }
    res.redirect('/home')
  }).catch(e => {
    res.status(400).send(e);
  })
})

app.get('/signup', (req, res) => {
  res.status(200).render('login/signupForm.hbs', {
    username: 'qasim',
    email: 'qasimali24@gmail.com',
    password: 'abcdabcd',
    required_action: '/signup'
  })
})

app.post('/signup', (req, res) => {
  const person = new Persons({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  })

  person.save().then(val => {
    req.session.person = {
      email: val.email,
      username: val.username
    }
    res.redirect('/home')
  }).catch(e => {
    req.flash('error', 'Username or email already exists. Please retry.');
    res.status(200).render('login/signupForm.hbs', {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    })
  })
})

app.get('/logout', (req, res) => {
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
      return res.status(200).render('login/personForm.hbs', {
        person: val,
        required_action: '/admin/updatePerson'
      })
    })
    .catch(e => {
      res.status(300).send(e);
    });
})

app.post('/admin/updatePerson', (req, res) => {
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
    required_action: '/admin/savePerson'
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
  },
  status: {
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
          status:1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ])
    .then(val => {
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
      status: 'active',
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
    status: req.body.status,
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
      res.status(300).send(e);
    });
})

app.post('/admin/updateEvent', (req, res) => {
  Events.findOneAndUpdate({
    _id: req.body.id,
  }, {
    title: req.body.title,
    status: req.body.status,
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

// PURCHASE ROUTE

app.use('/home', (req, res, next) => {
  if (!req.session.person) {
    req.session.ticketNo = req.query.ticketNo;
    req.flash('error', 'Please signin to access home page.');
    return res.redirect('/purchase/signin');
  } else {
    req.session.ticketNo = req.query.ticketNo;
    Persons.findOne({
      username: req.session.person.username,
    }).then(val => {
      if (!val) return Promise.reject('No person found with this username.')
      req.person = val,
        next();
    }).catch(e => {
      req.flash('error', e);
      return res.redirect('/');
    })
  }
});

app.get('/home', (req, res) => {
    res.redirect('/');
})

app.get('/purchase/signup', (req, res) => {
  res.status(200).render('login/signupForm.hbs', {
    username: 'qasim',
    email: 'qasimali24@gmail.com',
    password: 'abcdabcd',
    required_action: '/purchase/signup' // SAVE THIS USER > TAKE TO CHECK OUT PAGE with SESSION ID > STRIPE PAGE
  })
})

app.post('/purchase/signup', (req, res) => {
  const person = new Persons({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  })

  person.save().then(val => {
    req.session.person = {
      email: req.body.email,
      username: req.body.username
    };
    res.redirect('/home/redirectToCheckout');
  }).catch(e => {
    req.flash('error', 'User already exists. Please sign in.');
    res.redirect('/purchase/signin'); // GIVE USER THE SIGN IN FORM
  })
})

app.get('/purchase/signin', (req, res) => {
  res.status(200).render('login/signinForm.hbs', {
    username: 'qasim',
    email: 'qasimali24@gmail.com',
    password: 'abcdabcd',
    required_action: '/purchase/signin'
  })
})

app.post('/purchase/signin', (req, res) => {
  Persons.findOne({
    username: req.body.username,
    password: req.body.password
  }).then(val => {
    req.session.person = {
      email: val.email,
      username: val.username
    }
    res.redirect('/home/redirectToCheckout');
  }).catch(e => {
    req.flash('error', e);
    res.redirect('/purchase/signin'); // GIVE USER THE SIGN IN FORM
  })
})

app.get('/purchase/tickets',(req,res) => {

        req.session.event_id = req.query.public_id;
        Tickets.aggregate([
        {
            "$match": {
                "ticketNo" : { "$ne": '41' },
                "public_id" : "5f6db895af8b836846ab973c"
            }
        }
        ]).then(val => {
            return res.render('login/ticketsList.hbs',{
                allTickets:val,
                show_bottom_4_btns: req.session && req.session.person == undefined || req.session && req.session.person == null,
                logged_in: req.session && req.session.person == undefined || req.session && req.session.person == null
            });
	}).catch(e => {
	
		res.status(400).send(e);
	});

})

// STRIPE PAYMENTS

var StripeSession = mongoose.model('StripeSession', new mongoose.Schema({
  stripeId: {
      type: String
  },
  payment_intent: {
    type: String
  },
  username: {
    type: String,
  },
  ticketNo: {
    type: String
  },
}));


const stripe = require('stripe')(process.env.STRIPE);

app.get('/home/redirectToCheckout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: req.session.person && req.session.person.email,
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.ticket_price,
      quantity: 1,
    }],
    mode: 'payment',
    payment_intent_data: {
        metadata: {
            username: req.session.person.username,
            ticketNo: req.session.ticketNo
        },
    },
    success_url: `${process.env.url}/success/ticket?ticketNo=${req.session.ticketNo}&ticket_price=${process.env.ticket_price}`,
    cancel_url: `${process.env.url}/`,
  });
  console.log(session);
  const stripeSession = new StripeSession ({
      stripeId: session.id,
      payment_intent: session.payment_intent,
      username: req.session.person.username,
      ticketNo: req.session.ticketNo
  });
  stripeSession.save().then(val => console.log('session saved')).catch(e => console.log(e));
  res.render('login/redirectToCheckout.hbs', {
    id: session.id
  });
})

// No 1 --  SHOW TICKET HERE
app.use('/success', (req, res, next) => {
  if (!req.session.person) {
    req.flash('error', 'Please signin to access your ticket.');
    return res.redirect('/');
  }

  if (req.query.ticketNo != req.session.ticketNo) {
      req.flash('error', 'Your ticket does not match the ticket placed in the session. Please retry purchasing');
      return res.redirect('/');
  }

  if (req.query.ticket_price != process.env.ticket_price) {
      req.flash('error', 'Invalid ticket price session, Please follow proper route');
      return res.redirect('/');
  }

  next();


  //Check if the payment intent has the same payment_intent_id as it is mentioned here or not !

//  StripeSession.findOne({
//      payment_intent: req.query.payment_intent
//  }).then(val => {
//      if (!val) {
//          req.flash('error','Bad Payment Intent Token, please contact support')
//          return res.redirect('/');
//      }
//      req.StripeSession = val;
//      console.log('payment_successful because stripe success url has been triggered');
//      next();
//  }).catch(e => {
//      req.flash('error', e);
//      return res.redirect('/');
//  })

})


var StripeTrigger = mongoose.model('StripeTrigger', new mongoose.Schema({
  array: {
    	type: Object,
  },
}));


app.get('/updateStripeTrigger', (req,res) => {
    StripeTrigger.findOne().then(val => {
        console.log(val);
        res.status(200).render('stripeTriggerForm.hbs',{
            stripeTrigger: val,
            required_action: 'updateTrigger'
        });
    }).catch(e => {
        res.status(500).send(e);
    });
});

app.post('/updateStripeTrigger', (req,res) => {

    StripeTrigger.findOneAndUpdate({
        _id: req.query.id
    },{
        id: req.body.payment_intent
    },{
        new: true
    }).then(val => {
        res.redirect('/showStripeSessions');
    }).catch(e => {
        res.status(500).send(e);
    })

});    

app.post('/hooks', bodyParser.raw({type: 'application/json'}), (req,res) => {
  let event;

  try {
    event = JSON.parse(req.body);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(paymentIntent);
      StripeSession.findOne({
          payment_intent: paymentIntent.id
      }).then(val => {
          if (!val) return Promise.reject('no payment intent with this id found in database');
          return Tickets.findOneAndUpdate({
              ticketNo: val.ticketNo
          },{
              username: val.username
          },{
              new: true
          });
      }).then(ticket => {
         console.log(ticket);
      }).catch(e => {
         console.log(e);
      })
      
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
});

let getTicketPhoto = function(ticketNo) {

    return Tickets.aggregate([{
        $match: {ticketNo: ticketNo}
      },
      {
          $limit: 1
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
          ticketNo: 1,
          username: 1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ])

}

app.get('/success/ticket', (req, res) => {
    Tickets.findOneAndUpdate({
        ticketNo: req.session.ticketNo, // TICKETNO is selected from the session
        public_id: req.session.event_id // EVENT ID IS TRIGGERED WHEN USER LANDS IN THE TICKETS LIST PAGE 
    },{
        username: req.session.person.username,
    },{
        new: true
    }).then(val => {
        return Promise.all([getTicketPhoto(req.session.ticketNo),getTicketPhoto('41')]);
    }).then(val => {
        res.status(200).render('login/showTicket.hbs',{
            ticketNo: val[0][0].ticketNo,
            img: val[0][0].photo,
            back_img: val[1][0].photo,
            username: val[0][0].username,
            email: req.session.person.email,
        })
    });
})


// No 3 --  STRIPE WEBHOOK TO UPDATE PAYMENT DETAILS FOR THIS USER

// WRITE ROUTES FOR ALL TICKETS HERE

var Tickets = mongoose.model('Tickets', new mongoose.Schema({
  public_id: {
    	type: String,
	unique: false
  },
  ticketNo: {
    type: String,
    unique: true
  },
  username: {
	type: String
  }
}));

app.get('/admin/newTicket',(req,res) => {

	// IF NO PUBLIC ID EXISTS RETURN

	if (req.query.public_id == "") return res.redirect('/showEvents');
	
	res.render('login/ticketForm.hbs',{
		ticket: {
			public_id: req.query.public_id,
			ticketNo: '1',
		},
		redirect: req.query.redirect || 'showEvents',
		required_action: 'newTicket'
		
	})	
	
})

app.post('/admin/newTicket',(req,res) => {
	
	const ticket = new Tickets({
		public_id: req.body.public_id,
		ticketNo: req.body.ticketNo
	})

	ticket.save().then(val => {
		
		res.redirect(`/admin/showTickets?public_id=${req.body.public_id}`);	
	
	}).catch(e => {
		res.status(400).send(e);
	})
	
})

app.get('/admin/showTickets',(req,res) => {
	

  Tickets.aggregate([{
        $match: {
		public_id: req.query.public_id
	}
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
          public_id: 1,
	  ticketNo: 1,
	  username: 1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ])
    .then(val => {
      res.status(200).render('login/showTickets.hbs', {
        allTickets: val
      })
    })
    .catch(e => {
      res.status(400).send(e);
    })
	
})

app.get('/admin/editTicket',(req,res) => {

  Tickets.findOne({
      _id: req.query.id
    })
    .then(val => {
      return res.status(200).render('login/ticketForm.hbs', {
        ticket: val,
        required_action: 'updateTicket'
      })
    })
    .catch(e => {
      res.status(300).send(e);
    });
	
})

app.post('/admin/updateTicket',(req,res) => {

	Tickets.findOneAndUpdate({_id: req.body.id},{
		public_id: req.body.public_id,
		ticketNo: req.body.ticketNo,
		username: req.body.username
	},{
		new:true
	}).then(val => {
		res.status(200).redirect(`/admin/showTickets?public_id=${req.body.public_id}`)
	}).catch(e => {
		res.status(400).send(e);
	})

})

app.get('/admin/showStripeSessions', (req,res) => {
    StripeSession.find().then(val => {
        return res.render('login/showStripeSessions.hbs',{
            allSessions: val
        });
    }).catch(e => {
        res.status(500).send(e);
    });
});

app.get('/admin/editStripeSession', (req,res) => {

    StripeSession.findOne({_id: req.query.id}).then(val => {
        return res.render('login/stripeForm.hbs',{
            StripeSession: val,
            required_action: '/admin/updateStripeSession'
        });
    }).catch(e => {
        res.status(500).send(e);
    });

});

app.post('/admin/updateStripeSession', (req,res) => {
    StripeSession.findOneAndUpdate({
        _id: req.body.id
    },{
        stripeId: req.body.stripeId,
        payment_intent: req.body.payment_intent,
        username: req.body.username,
        ticketNo: req.body.ticketNo
    },{
        new: true
    }).then(val => {
        res.redirect('/admin/showStripeSessions')
    }).catch(e => {
        res.status(500).send(e);
    });

})

app.get('/admin/deleteStripeSession', (req,res) => {
    StripeSession.deleteOne({_id: req.query.id}).then(val => {
        return res.redirect('/admin/showStripeSessions')
    }).catch(e => {
        res.status(500).send(e);
    });
});

// UPDATE PROFILE DETAILS HERE

app.get('/home/profile',(req,res) => {

	Tickets.aggregate([
    { 
        $match: {username: req.person.username} 
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
        $lookup: { 
              from: 'events', 
              localField: 'public_id.str', 
              foreignField: '_id.str', 
              as: 'event' 
            } 
        },
        { 
        $project: { 
            ticketNo: 1,
            _id: 1,
            username: 1,
            public_id: 1,
            photo: { 
              $arrayElemAt: ["$photo.url", 0] 
            },
            date: {
                $arrayElemAt: ["$event.date", 0] 
                },
            title: {
                $arrayElemAt: ["$event.title", 0] 
                },
        }
    }
    ]).then(val => {
	return res.render('login/person.hbs',{
		person: req.person,
		tickets: val
	})
	}).catch(e => {
		res.status(400).send(e)
	});
})

app.get('/home/editProfile',(req,res) => {

       res.status(200).render('login/personForm.hbs', {
        person: {
		password: req.person.password,
		email: req.person.email
	},
        required_action: '/home/updatePerson'
      })
})

app.post('/home/updatePerson', (req,res) => {

  Persons.findOneAndUpdate({
    _id: req.person._id,
  }, {
    email: req.body.email,
    password: req.body.password,
  }, {
    new: true,
  }).then(val => {
    res.redirect(`/home/profile?id=${req.person._id}`)
  }).catch(e => {
    res.status(300).send(e);
  })
})



app.listen(3000)

