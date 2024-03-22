const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;

const subscriptionSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },
  subscriptionStatus: {
    type: String,
    enum: ["pending", "confirm","Not Verified"],
    default: "pending",
  },
  purchaseDate: {
    type: Date,
    default: () => Date.now(),
  },
  subscrptionNumber: { type: String, required: true, unique: true },
  paymentReferenceNO: {
    type: String,
  },
  currentPrice:{
    type:String,
    default: "0"
  },
  adminNote: {
    type: String,
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
