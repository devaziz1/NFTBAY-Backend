const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;
const adminSchema = new Schema({
  name: { type: String },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [gmailRegex, 'Please enter a valid Gmail address']
  },
  qrcode:{
    type: String,
  },
  password: { type: String},
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  myReferenceID:{
    type:String
  },
  revenue: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      value: {
        type: Number,
        default: 0,
      },
    }
  ],  
  totalSubs: [{
    month: String,  // Store the month name
    count: Number,  // Store the subscription count for the month
  }],
  visitedIPs: [
    {
      ipAddress: {
        type: String,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }
  ],  
  numOfsubs:{
    type:Number,
    default: 0
  },

  mySubsCharges:{
    type:String
  },
  newsLetterEmails:[{
    email:{
      type: String,
    }
  }]
});

module.exports = mongoose.model("Admin", adminSchema);
