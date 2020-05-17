//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
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
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home")
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

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