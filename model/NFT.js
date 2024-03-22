const mongoose = require("mongoose");

const NFTSchema = new mongoose.Schema({
  nftID: {
    type: mongoose.Types.ObjectId,
  },
  nftImage: {
    type: String,
  },
  sellerEmail:{
    type:String,
  },
  name: {
    type: String,
  },
  username: {
    type: String,
  },
  description: {
    type: String,
  },
  price: {
    type: String,
  },
  status: {
    type: String,
    enum: ["sold", "pending","Not Verified"],
    default: "pending",
  },
  sellerStatus:{
    type: String,
    enum: ["pending", "confirm","Not Verified"],
    default: "pending",
  },
  category: {
    type: String,
  },
  pimage: {
    type: String,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const NFTModel = mongoose.model("NFT", NFTSchema);

module.exports = NFTModel;
