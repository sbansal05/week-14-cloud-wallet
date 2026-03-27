const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)

const UserSchema = mongoose.Schema({
    username: String,
    password: String,
    privateKey: String,
    publicKey: String
})

const userModel = mongoose.Model("users,", UserSchema);

module.exports = {
    userModel
}