const mongoose = require('mongoose');

const passportLocalMongoose = require('passport-local-mongoose');//12345


const petSchema = new mongoose.Schema({
  petname: String,
  category: String,
  birthdate: {
    type: Date,
    required: true
  },
  breed: String,
  vaccinated: Boolean,
  trained: Boolean,
  color: String,
  location: String,
  description: String,
  imageName: String, // Name of the image file
  // image: String,
  latitude: Number,
  longitude: Number,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shelter' // Reference the Shelter model
  }
});

// console.log("added by :", this.addedBy);
// console.log(this.breed)

// Create a virtual property 'age' to calculate the age dynamically
petSchema.virtual('age').get(function () {
  const currentYear = new Date().getFullYear();
  const birthYear = this.birthdate.getFullYear();
  return currentYear - birthYear;
});


// petSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('pet', petSchema);