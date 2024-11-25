const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')

// const passportLocalMongoose = require('passport-local-mongoose');//12345

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: String,
  role: String,
  tokens: [{
    token:{
      type: String,
      required: true
    }
  }],
});

//generating token jwt ko part
adminSchema.methods.generateAuthToken = async function(){
  try {
    console.log(this._id)
    const token = jwt.sign({_id:this._id.toString()}, "abcdefghijklmnopqrstuvwzyzabcdefghijk");
    this.tokens = this.tokens.concat({token:token})
    await this.save();
    // console.log(token);
    return token;
  } catch (error) {
    console.log("the error part:", error)
    
  }

}

// adminSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("admin", adminSchema);