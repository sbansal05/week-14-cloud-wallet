const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const UserSchema = mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    privateKey: String,
    publicKey: String
})



const userModel = mongoose.model("users", UserSchema);

module.exports = {
    userModel
}