//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(session({
  secret: "ThisSecretIsEqualToCustomKeyForEncryption.",
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
  res.render("home")
});

app.get("/auth/google",
  passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get("/auth/facebook",

)

app.get("/secrets", function (req, res) {
    User.find({"secret": {$ne: null}}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets", {usersWithSecret: result})
      }
    })
});

app.route("/submit")
  .get(function (req, res) {
    if (req.isAuthenticated()) {
      res.render("submit")
    } else {
      res.redirect("/login")
    }
  })
  .post(function (req, res) {
    const submittedSecret = req.body.secret;

    User.findOne({_id: req.user.id}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result) {
          result.secret = submittedSecret;
          result.save(function () {
            res.redirect("/secrets")
          });
        } else {
          console.log("There is no result for this id.")
        }
      }
    })
    console.log(req.user);
    
  })

app.route("/register")
  .get(function (req, res) {
    res.render("register")
  })

  .post(function (req, res) {
    User.register({username: req.body.username}, req.body.password, function (err, newUser) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        // HTML 폼에서 POST를 보내는 과정, 즉 회원가입 과정에서 에러가 없는 경우에 한해 아래 로그인세션 기억 코드(passport.authenticate())가 실행된다.
        passport.authenticate("local") (req, res, function () {
          // 아래 콜백함수 코드는 회원가입에 이어 그 상태로 로그인까지 연속해서 인증성공했고 + 해당 인증 내용을 바탕으로 하는 로그인 상태 쿠키 생성 성공일 때 실행된다.
          res.redirect("/secrets")
        })
      }
    })
  });

app.route("/login")
  .get(function (req, res) {
    res.render("login")
  })

  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function (err) {
      if (err) {
        // const user에 해당하는 정보로 로그인할 수 없을 경우 호출되는 부분
        console.log(err);
      } else {
        passport.authenticate("local") (req, res, function () {
          res.redirect("/secrets");
        })
      }
    })
  });

app.route("/logout")
  .get(function (req, res) {
    req.logout();
    res.redirect("/");
  });

app.listen(3000, () => console.log("Server is connected on port 3000."))