const mongoose = require("mongoose");
const plm = require('passport-local-mongoose')

mongoose.connect("mongodb://127.0.0.1:27017/instagram");
const userSchema = mongoose.Schema({
  fullname : String,
  email : String, 
  password : String,
  username : String,
  profileImage: String,
  bio: String,
  posts :[{type: mongoose.Schema.Types.ObjectId, ref: "post"}],
});

userSchema.plugin(plm)

module.exports = mongoose .model("user", userSchema);