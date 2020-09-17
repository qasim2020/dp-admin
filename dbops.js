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
},{
  timestamps: true
}));

// DB OPERATIONS

// SCHOOL DB OPERATIONS END HERE

// RENDER SCHOOL FORM FOR NEW AND EDIT SCHOOLS

// 1. Load the FORM
app.get('/newSchool', (req,res) => {
  res.status(200).render('7/schoolForm.hbs',{
    name: "Beacon House Public School",
    identity: "beacon",
    required_action: "createSchool"
  })
})

// 2. Save the Form
app.post('/createSchool', (req, res) => {
  console.log(req.body);
  const newSchool = new Schools({
    name: req.body.name,
    identity: req.body.identity
  });

  newSchool.save()
  .then(val => {
    res.redirect('/showSchools')
  })
  .catch(e => {
    res.status(400).send(e);
  })

})

// 3. Now show all Schools
app.get('/showSchools', (req,res) => {
  Schools.find().then(val => {
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
app.get('/editSchool', (req,res) => {
  Schools.findOne({
    id: req.query.id
  }).then(val => {
    res.status(200).render('7/schoolForm.hbs', {
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
app.post('/updateSchool', (req, res) => {
  Schools.findOneAndUpdate({
    id: req.body.id
  }, {
    name: req.body.name,
    identity: req.body.identity
  })
  .then(val => {
    res.redirect('/showSchools')
  })
  .catch(e => {
    res.status(400).send(e);
  })
})

// 6. Delete a school from show schools page
app.get('/deleteSchool', (req,res) => {
  Schools.deleteOne({
    id: req.body.id
  })
  .then(val => {
    res.redirect('/showSchools')
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
  return {
    url: "/15.png",
    public_id: public_id
  }
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

//  IMAGE OPERATIONS

var Images = mongoose.model('Images', new mongoose.Schema({
  public_id: {
    type: String
  },
  url: {
    type: String
  }
},{
  timestamps: true
}));

// 1. saveNewImage route

app.get('/newImage',(req,res) => {
  res.status(200).render('7/imageForm.hbs',{
    public_id: req.query.public_id,
    required_action: 'newImage'
  })
})

// 2. Save this image and route to show Schools
app.post('/newImage', (req,res) => {
  uploadCloudinary(req.query.img,req.query.public_id)
  .then(val => {
    const image = new Images({
      url: val.url,
      public_id: req.query.public_id
    });

    return image.save()
  })
  .then(val => {
    res.redirect('/showSchools');
  })
  .catch(e => {
    res.status(400).send(e);
  })
})

// 3. edit an old image route

app.get('/editImage', (req,res) => {
  res.status(200).render('7/imageForm.hbs',{
    public_id: req.query.public_id,
    required_action: 'uploadImage'
  })
})

// 3. Upload image in database

app.post('/uplaodImage', (req,res) => {
  uploadCloudinary(req.query.img,req.query.public_id)
  .then(val => {
    res.redirect('/showSchools');
  })
  .catch(e => {
    res.status(400).send(e);
  })
})

// 4. show all images route to let user edit the images

app.listen(3000)
