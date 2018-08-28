var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var sessions = require('express-session');
var fs = require('fs');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

var GITHUB_CLIENT_ID = "5ca5eaac5e2f54e71495";
var GITHUB_CLIENT_SECRET = "a99f05a334bd137ab7be31039ec8407a95855cbb";

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: "http://127.0.0.1:4568/auth/github/callback"
},
function (accessToken, refreshToken, profile, done) {
  new User({ githubId: profile.id }).fetch().then((found) => {
    if (found) {
      return done(null, profile);
    } else {
      Users.create({
        username: profile.username,
        githubId: profile.id
      })
        .then(user => {
          return done(null, user);
        })
        .catch(err => {
          console.log(err);
          return;
        });
    }
  });
}
));


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessions({ secret: 'abcd', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


// const checkUser = function (request, response) {
//   if (request.session.loggedIn) {
//     return true;
//   } else {
//     response.redirect('/login');
//   }
// };

app.get('/', util.checkUser, (req, res) => {
  res.render('index');
});

app.get('/create', util.checkUser, (req, res) => {
  res.render('create');
});

app.get('/links', util.checkUser, (req, res) => {
  Links.reset().fetch().then(function (links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', util.checkUser, (req, res) => {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function (found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function (err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
          .then(function (newLink) {
            res.status(200).send(newLink);
          });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  let password = req.body.password;
  let username = req.body.username;

  new User({ username: username })
    .fetch()
    .then((user) => {
      if (!user) {
        res.redirect('/login');
      } else {
        user.comparePassword(password, (match) => {
          if (!match) {
            res.redirect('/login');
          } else {
            util.createSession(req, res, user);
          }
        });
      }
    });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  let password = req.body.password;
  let username = req.body.username;


  new User({ username: username }).fetch().then((user) => {
    if (user) {
      console.log('User already exists');
      res.redirect('/signup');
    } else {
      new User({
        username: username,
        password: password
      })
        .save()
        .then((newUser) => {
          util.createSession(req, res, newUser);
        });
    }
  });

});

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }), (req, res) => {

});

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res, next) => {
  util.createSession(req, res, req.user);
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function (req, res) {
  new Link({ code: req.params[0] }).fetch().then(function (link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function () {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function () {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
