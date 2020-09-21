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

hbs.registerPartials(__dirname + '/views/7/partials');

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

// DB OPERATIONS

// SCHOOL DB OPERATIONS END HERE

// RENDER SCHOOL FORM FOR NEW AND EDIT SCHOOLS

// 1. Load the FORM
app.get('/admin/newSchool', (req, res) => {
  res.status(200).render('7/schoolForm.hbs', {
    name: "Beacon House Public School",
    identity: "beacon",
    required_action: "createSchool"
  })
})

// 2. Save the Form
app.post('/admin/createSchool', (req, res) => {
  console.log(req.body);
  const newSchool = new Schools({
    name: req.body.name,
    identity: req.body.identity
  });

  newSchool.save()
    .then(val => {
      res.redirect('/admin/showSchools')
    })
    .catch(e => {
      res.status(400).send(e);
    })

})

// 3. Now show all Schools
app.get('/admin/showSchools', (req, res) => {
  Schools.aggregate([{
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
          name: 1,
          identity: 1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ])
    .then(val => {
      console.log(val);
      res.status(200).render('7/showSchools.hbs', {
        allSchools: val
      })
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

// 4. Press edit on any one School to Load the Form with this school data
app.get('/admin/editSchool', (req, res) => {
  Schools.findOne({
      _id: req.query.id
    }).then(val => {
      console.log(val);
      res.status(200).render('7/schoolForm.hbs', {
        _id: val._id,
        name: val.name,
        identity: val.identity,
        required_action: "updateSchool"
      })
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

// 5. Update these changes in this school database
app.post('/admin/updateSchool', (req, res) => {
  Schools.findOneAndUpdate({
      _id: req.body.id
    }, {
      name: req.body.name,
      identity: req.body.identity
    })
    .then(val => {
      res.redirect('/admin/showSchools')
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

// 6. Delete a school from show schools page
app.get('/admin/deleteSchool', (req, res) => {
  Schools.deleteOne({
      _id: req.query.id
    })
    .then(val => {
      res.redirect('/admin/showSchools')
    })
    .catch(e => {
      res.status(400).send(e);
    })
})

cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key: process.env.cloudAPI,
  api_secret: process.env.cloudAPISecret
});

let uploadCloudinary = (img, public_id) => {
  // return {
  //   url: "/15.png",
  //   public_id: public_id
  // }
  console.log(img, public_id);
  return cloudinary.uploader.upload(img, {
    resource_type: "image",
    public_id: public_id || mongoose.Types.ObjectId().toString(),
    folder: '7AM',
    overwrite: true,
    transformation: [{
      width: 800,
      height: 400,
      crop: "limit"
    }],
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
  res.status(200).render('7/imageForm.hbs', {
    public_id: req.query.public_id,
    required_action: 'newImage',
    redirect: req.query.redirect
  })
})

// 2. Save this image and route to show Schools
app.post('/admin/newImage', (req, res) => {
  // give me dataURL and public_id
  // return console.log(req.body);
  uploadCloudinary(req.body.photo, req.body.public_id)
    .then(val => {
      console.log(val.url, val.public_id);
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
      console.log(val);
      res.status(200).render('7/imageForm.hbs', {
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
    return res.status(200).render('7/showImages.hbs', {
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


// ITEM OPERATIONS

var Items = mongoose.model('Items', new mongoose.Schema({
  name: {
    type: String
  },
  school: {
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
  }
}));

app.get('/admin/newItem', (req, res) => {
  Schools.find().then(val => {
    return res.status(200).render('7/itemForm.hbs', {
      schoolsList: val,
      name: "Winter Uniform Set",
      cost: "120",
      size: "size",
      qty: "10",
      required_action: "saveItem"
    })
  })

})

app.post('/admin/saveItem', (req, res) => {
  const item = new Items({
    name: req.body.name,
    school: req.body.school,
    cost: req.body.cost,
    size: req.body.size,
    qty: req.body.qty,
  })

  item.save().then(val => {
    res.redirect('/admin/showItems');
  }).catch(e => {
    res.status(400).send(e);
  });
})

app.get('/admin/showItems', (req, res) => {
  // FETCH THE IMAGE HERE ONCE IT IS SAVED IN CLOUDINARY
  Items.aggregate([{
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
          name: 1,
          cost: 1,
          size: 1,
          qty: 1,
          photo: {
            $arrayElemAt: ["$photo.url", 0]
          }
        }
      }
    ])
    .then(val => {
      res.status(200).render('7/showItems.hbs', {
        allItems: val
      })
    })
})

// edit the item to update the NAME OF THE SCHOOL

app.get('/admin/edititem', (req, res) => {
  Promise.all([
    Items.findOne({
      _id: req.query.id
    }),
    Schools.find()
  ]).then(val => {
    schoolsList = val[1].map(object => {
      return {
        name: object.name,
        identity: object.identity,
        selected: (val[0].school == object.name) ? "selected" : ""
      }
    });
    return res.status(200).render('7/itemForm.hbs', {
      schoolsList: schoolsList,
      _id: val[0]._id,
      name: val[0].name,
      cost: val[0].cost,
      size: val[0].size,
      qty: val[0].qty,
      required_action: "updateItem"
    })
  })
})

app.post('/admin/updateItem', (req, res) => {
  Items.findOneAndUpdate({
    _id: req.body.id
  }, {
    name: req.body.name,
    school: req.body.school,
    cost: req.body.cost,
    size: req.body.size,
    qty: req.body.qty,
  }).then(val => {
    res.redirect('/admin/showItems');
  }).catch(e => {
    res.status(200).send(e);
  })
})

app.get('/admin/deleteItem', (req, res) => {
  Items.deleteOne({
    _id: req.query.id
  }).then(val => {
    res.redirect('/admin/showItems')
  }).catch(e => {
    res.status(200).send(e);
  })
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
  res.redirect('/admin/showSchools');
})

app.get('/signin', (req, res) => {
  res.status(200).render('7/signinForm.hbs', {
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
  res.status(200).render('7/signupForm.hbs', {
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

app.listen(3000)


