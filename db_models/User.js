const mongoose = require("mongoose");

//User model
const UserSchema = mongoose.Schema({
    user: {type: String, required: true},  
    password: {type: String, required: true},
    createdAt: {type: Date, default: Date.now()},  
    refreshToken: {type: String, default: ''}
});


//create and export the model
module.exports = mongoose.model("User", UserSchema);