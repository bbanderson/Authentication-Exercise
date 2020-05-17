//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// console.log(process.env.API_KEY);

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]})

// userSchema.plugin(encrypt, { encryptionKey: encKey, signingKey: sigKey, encryptedFields: ['age'] });


const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home")
});

app.route("/register")
  .get(function (req, res) {
    res.render("register")
  })

  .post(function (req, res) {
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password)
    });
    
    newUser.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });

app.route("/login")
  .get(function (req, res) {
    res.render("login")
  })

  .post(function (req, res) {
    const userName = req.body.username;
    const password = md5(req.body.password);
    User.findOne({email: userName}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result) {
          if (result.password === password) {
            res.send("good")
          }
        }
      }
    })
  })

app.listen(3000, () => console.log("Server is connected on port 3000."))