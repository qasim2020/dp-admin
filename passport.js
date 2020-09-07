var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  {User} = require('./users'),
  bcrypt = require('bcryptjs');

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
          message: 'Incorrect username.'
        });
      }
      // Match password
      if (!user.password) return done(null, false, {
        message: `You have already signed up using social media login.`
      })
      bcrypt.compare(password, user.password, (err, isMatch) => {
        console.log(err);
        if (err) return done(null, false, {
          message: 'Something wrong.'
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



module.exports = {
  passport
}
