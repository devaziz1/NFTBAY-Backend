const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const buyerSchema = new Schema({
  buyerName: { type: String },
  buyerEmail: {
    type: String,
    required: true,
  },
  nftID: {
    type: String,
    required: true,
  },
  sellerEmail: {
    type: String,
    required: true,
  },
  code:{
    type:String
  },
  orderNumber:{
    type:String
  },
  purchaseDate:{
    type: Date,
    default: () => Date.now(),
  },
  amount:{
    type:String
  },
  referenceNumber: { type: String},
  orderStatus:{
    type: String,
    enum: ["pending", "confirm"],
    default: "pending",
  },
});

module.exports = mongoose.model("Buyer", buyerSchema);
