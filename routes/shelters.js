const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

const passportLocalMongoose = require('passport-local-mongoose');//12345

const shelterSchema = new mongoose.Schema({
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
    default: 'shelter'
  },
  tokens: [{
    token:{
      type: String,
      required: true
    }
  }],
  latitude: Number,
  longitude: Number
});

//generating token jwt ko part
shelterSchema.methods.generateAuthToken = async function(){
  try {
    console.log(this._id)
    const token = jwt.sign({_id:this._id.toString()}, "abcdefghijklmnopqrstuvwzyzabcdefghijkl");
    this.tokens = this.tokens.concat({token:token})
    await this.save();
    // console.log(token);
    return token;
  } catch (error) {
    console.log("the error part:", error)
    
  }

}

// shelterSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("shelter", shelterSchema);