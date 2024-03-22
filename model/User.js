const mongoose = require("mongoose");
const NFT = require("./NFT"); // Import the NFT model

const Schema = mongoose.Schema;

const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;

const userSchema = new Schema({
  userID: {
    type: mongoose.Types.ObjectId,
  },
  username: { type: String},
  fname: {
    type: String,
  },
  lname: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },
  password: { type: String },
  walletAddress: {
    type: String,
  },
  userRole:{
    type: String,
    enum: ["seller", "buyer"],
    default: "buyer",
  },
  subscriptionStatus:{
    type: String,
    enum: ["pending", "confirm","Not Verified"],
    default: "pending",
  },
  joinDate:{
    type:Date,
    default: ()=> Date.now()
  },
  userNumber: { type: String, required: true, unique: true },

  totalnft:{
    type:Number,
    default: "0"
  },
  soldnft:{
    type:Number,
    default: "0"
  },
  totalSales:{
    type:Number,
    default: "0"
  },
  pendingnft:{
    type:Number,
    default: "0"
  },
  qrcode: {
    type: String,
  },
  pimage: {
    type: String,
  },
  paymentReferenceNO: {
    type: String,
  },
  myNfts: [{ type: mongoose.Schema.Types.ObjectId, ref: "NFT" }],
  adminNote:{
    type: String,
  }
});

module.exports = mongoose.model("User", userSchema);
