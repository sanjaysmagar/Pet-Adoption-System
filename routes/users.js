// var express = require('express');
// var router = express.Router();

const mongoose = require('mongoose');

const passportLocalMongoose = require('passport-local-mongoose');//12345



const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: String,
  mobileNo: String,
  email: String,
  password: String,
  username: String,
  role: {
    type: String,
    default: 'user'
  },
  latitude: Number,
  longitude: Number
});



userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", userSchema);
