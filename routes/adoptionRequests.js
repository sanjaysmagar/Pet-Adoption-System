const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken')

// const passportLocalMongoose = require('passport-local-mongoose');//12345

const arSchema = new mongoose.Schema({
  petId: String,
  petName: String,
  category: String,
  birthdate: Date,
  breed: String,
  vaccinated: Boolean,
  trained: Boolean,
  color: String,
  location: String,
  description: String,
  imageName: String, 
  addedBy: Object,

  userId: String,
  firstName: String,
  lastName: String,
  email: String,
  mobileNo: String,
});

arSchema.virtual('age').get(function () {
  const currentYear = new Date().getFullYear();
  const birthYear = this.birthdate.getFullYear();
  return currentYear - birthYear;
});


module.exports = mongoose.model("adoptionRequests", arSchema);