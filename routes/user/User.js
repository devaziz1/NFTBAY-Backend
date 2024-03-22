const express = require("express");
require("dotenv").config();
const multer = require("multer");
const app = express();
const argon2 = require("argon2");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../../model/User");
const Order = require("../../model/Order");
const NFT = require("../../model/NFT");
const Subscription = require("../../model/Subscription");
const Admin = require("../../model/Admin");

app.use(express.json());

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

function generateAccessToken(email) {
  const payload = {
    email,
  };
  const secretKey = "NFTBAY-KEY";
  const options = {
    expiresIn: "1h",
  };

  return jwt.sign(payload, secretKey, options);
}

// Define a separate function to get the next order number
const getNextUserNumber = async () => {
  // Retrieve the last order number from the database and increment it

  const lastOrder = await User.findOne({}, {}, { sort: { userNumber: -1 } });
  const lastOrderNumber = lastOrder ? parseInt(lastOrder.userNumber, 10) : 0;
  return (lastOrderNumber + 1).toString().padStart(3, "0");
};

router.post("/signup", async (req, res, next) => {
  try {
    const { fname, lname, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(404).json({ error: "Email already exist!" });
    }

    const hashPassword = await argon2.hash(password);
    const UserNumber = await getNextUserNumber();
    console.log("Cureent user number");
    console.log(UserNumber);
    const user = new User({
      fname,
      lname,
      email,
      userNumber: UserNumber,
      password: hashPassword,
    });
    const token = generateAccessToken(email);
    await user.save();

    return res
      .status(201)
      .json({ message: "Account Created Successfully", token });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Invalid Email!" });
    }

    const fname = user.fname;
    const username = user.username;
    const role = user.userRole;

    const passwordMatches = await argon2.verify(user.password, password);

    if (!passwordMatches) {
      return res.status(404).json({ error: "Invalid Password!" });
    }

    const token = generateAccessToken(email);

    return res
      .status(201)
      .json({
        message: "User log in successfully",
        token,
        email,
        fname,
        username,
        role,
      });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post("/becomeseller", async (req, res, next) => {
  try {
    const username = req.body.username;

    existingName = await User.findOne({ username });

    if (existingName) {
      return res.status(404).json({ error: "Username already taken!" });
    }

    const email = req.body.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Invalid User Email!" });
    }

    user.username = username;

    await user.save();

    res.status(200).json({ message: "Step 1 done successfully", username });
  } catch (error) {
    next(error);
  }
});

router.post("/becomeseller1", async (req, res, next) => {
  try {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    existingName = await User.findOne({ username });

    if (existingName) {
      return res.status(404).json({ error: "Username already taken!" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(404).json({ error: "Email already exist!" });
    }

    const hashPassword = await argon2.hash(password);
    const UserNumber = await getNextUserNumber();

    const newuser = new User({
      username,
      email,
      userNumber: UserNumber,
      password: hashPassword,
    });

    await newuser.save();

    const token = generateAccessToken(email);

    res
      .status(200)
      .json({ message: "Step 1 done successfully", token, email, username });
  } catch (error) {
    next(error);
  }
});

router.post("/becomeseller2", upload.single("qrcode"),async (req, res, next) => {
    try {
      if (!req.file) {
        const error = new Error("No file provided");
        error.statusCode = 400;
        throw error;
      }

      const email = req.body.email;
      const walletAddress = req.body.walletAddress;

      console.log(email);
      console.log(walletAddress);

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.walletAddress = walletAddress;

      user.qrcode = req.file.buffer.toString("base64");

      await user.save();

      res.status(200).json({ message: "Step 2 done successfully" });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/becomeseller3", async (req, res, next) => {
  try {
    const paymentReferenceNO = req.body.paymentReferenceNO;
    const email = req.body.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = "seller";
    user.paymentReferenceNO = paymentReferenceNO;
    user.userRole = userRole;
    const admin = await Admin.findOne({email:"salman001@gmail.com"});
    console.log("Admin charges:");
    console.log(admin.mySubsCharges);
    const currentPrice1 = admin.mySubsCharges;
    const currentPrice =  currentPrice1;
    const subscrptionNumber = await getNextSubscriptionNumber();
    const subscription = new Subscription({
      email,
      currentPrice,
      paymentReferenceNO,
      subscrptionNumber,
    });
    await subscription.save();
    await user.save();

    res.status(200).json({ message: "Step 3 done successfully", });
  } catch (error) {
    next(error);
  }
});



router.post("/createSubscription", async (req, res, next) => {
  try {

    const admin = await Admin.findOne({email:"salman001@gmail.com"});
    const paymentReferenceNO = req.body.paymentReferenceNO;
    const email = req.body.email;
    const subscrptionNumber = await getNextSubscriptionNumber();
    console.log("Admin charges:");
    console.log(admin.mySubsCharges);
    const currentPrice1 = admin.mySubsCharges;
    const currentPrice =  currentPrice1;
    const subscription = new Subscription({
      email,
      paymentReferenceNO,
      currentPrice,
      subscrptionNumber,
    });
    await subscription.save();

    res
      .status(200)
      .json({ message: "Subscription Process Completed successfully" });
  } catch (error) {
    next(error);
  }
});


router.post("/createNFT", upload.single("nftImage"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(404).json({ error: "Please Provide Nft Image" });
    }
    const { email, name, description, price, category } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const username = user.username;
    const sellerStatus = user.subscriptionStatus;
    const pimage = user.pimage;
    user.totalnft += 1;
    user.pendingnft += 1;
    const nftImage = req.file.buffer.toString("base64");

    if (!pimage) {
      const nft = new NFT({
        nftImage,
        sellerStatus,
        username,
        name,
        sellerEmail: email,
        description,
        price,
        category,
      });

      await nft.save();
    } else {
      const nft = new NFT({
        nftImage,
        username,
        name,
        sellerEmail: email,
        description,
        price,
        pimage,
        category,
      });

      await nft.save();
    }

    await user.save();

    res.status(200).json({ message: "NFT Created successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/get-qrcode", async (req, res, next) => {
  try {
    // Assuming you have a way to identify the user (e.g., by email) in your request
    const email = req.query.email; // Change this based on your authentication method

    // Find the user by their email
    const user = await User.findOne({ email });

    // Check if the user exists and has a QR code
    if (!user || !user.qrcode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    // Send the QR code image as binary data
    res.setHeader("Content-Type", "image/png"); // Set the content type
    res.send(Buffer.from(user.qrcode, "base64")); // Send the image data
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
});


router.get("/getAllNfts", async (req, res) => {
  console.log("Inside get NFTs");
  try {
    // Find all pending NFTs
    const pendingNFTs = await NFT.find({
      status: { $in: ["pending", "Not Verified"] }
    });

    // Find all users with a confirmed subscription status
    const confirmedSellers = await User.find({ subscriptionStatus: "confirm" });

    // Create a map of user emails to users for easy lookup
    const usersMap = confirmedSellers.reduce((map, user) => {
      map[user.email] = user;
      return map;
    }, {});

    // Filter the pending NFTs and include user information
    const nftsWithConfirmedSellers = pendingNFTs
      .filter((nft) => usersMap[nft.sellerEmail])
      .map((nft) => {
        const seller = usersMap[nft.sellerEmail];
        return {
          nft,
          seller,
        };
      });

    console.log("NFTs with confirmed sellers:", nftsWithConfirmedSellers);

    res.status(200).json(nftsWithConfirmedSellers);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});




// router.get("/getAllNfts", async (req, res) => {
//   try {
//     const pendingNFTs = await NFT.find({ status: "pending" });

//     res.status(200).json(pendingNFTs);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// router.get("/getAllNfts", async (req, res) => {
//   console.log("Inside get NFTs");
//   try {
 
//     const pendingNFTs = await NFT.find({ status: "pending" });


//     const nftsWithConfirmedSellers = await Promise.all(
//       pendingNFTs.map(async (nft) => {
//         const seller = await User.findOne({ email: nft.sellerEmail });
//         if (seller && seller.subscriptionStatus === "confirm") {
//           return nft;
//         }

//         return null;
//       })
//     );

//     console.log("NFTs with confirmed sellers:", nftsWithConfirmedSellers);

//     const filteredNFTs = nftsWithConfirmedSellers.filter((nft) => nft !== null);

//     res.status(200).json(filteredNFTs);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

const getNextOrderNumber = async () => {
  // Retrieve the last order number from the database and increment it
  const lastOrder = await Order.findOne({}, {}, { sort: { orderNumber: -1 } });
  const lastOrderNumber = lastOrder ? parseInt(lastOrder.orderNumber, 10) : 0;
  return (lastOrderNumber + 1).toString().padStart(3, "0");
};

router.post("/buyNFT", async (req, res, next) => {
  try {
    const {
      buyerName,
      buyerEmail,
      sellerEmail,
      referenceNumber,
      amount,
      nftID,
    } = req.body;

    console.log("Inside this API");
    console.log(buyerName);
    console.log(buyerEmail);
    console.log(sellerEmail);
    console.log(referenceNumber);

    const user = await User.findOne({ email: sellerEmail });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.pendingnft -=1;

    // Use `await` when finding the NFT by ID
    const nft = await NFT.findById(nftID);

    if (!nft) {
      return res.status(404).json({ error: "NFT not found" });
    }

    const nftSold = nft.status == "sold";

    if(nftSold){
      return res.status(404).json({ error: "NFT Already Sold" });
    }

    nft.status = "sold";

    await nft.save();

    // Get the next order number from the function
    const formattedOrderNumber = await getNextOrderNumber();

    console.log(formattedOrderNumber);

    const order = new Order({
      buyerName,
      buyerEmail,
      nftID,
      sellerEmail,
      orderNumber: formattedOrderNumber,
      referenceNumber,
      amount
    });

    await order.save();

    res
      .status(200)
      .json({ message: "Your order has been placed successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getAllorders/:sellerEmail", async (req, res, next) => {
  try {
    const { sellerEmail } = req.params;

    // Use Mongoose to find all orders with the specified sellerEmail
    const orders = await Order.find({ sellerEmail });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getnftID/:ID", async (req, res) => {
  try {
    const { ID } = req.params; // Use req.params to access route parameters

    console.log("Request Params:");

    console.log(req.params.ID);

    const nft = await NFT.findById(ID); // Ensure you use `await` to wait for the result

    if (!nft) {
      return res.status(404).json({ message: "NFT not found" });
    }

    // If the NFT is found, send the NFT details as the response
    res.status(200).json({ nft });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/renewSubscription", async (req, res) => {
  try {
    const { email, paymentReferenceNO, adminNote } = req.body;
    console.log("Inside Controller");
    console.log("Request Body");
    console.log(email);
    const subscription = await Subscription.findOne({ email });
    const admin = await Admin.findOne({email:"salman001@gmail.com"});


    if (!subscription) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(paymentReferenceNO);
    console.log(adminNote);
    const currentPrice1 = admin.mySubsCharges;


    subscription.adminNote = adminNote;
    subscription.paymentReferenceNO = paymentReferenceNO;
    subscription.currentPrice = currentPrice1;


    

    await subscription.save();
    return res.status(200).json({ message: "Subscription Renew sucessfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post(
  "/editPaymentDetails",
  upload.single("qrcode"),
  async (req, res) => {
    try {
      if (!req.file) {
        const error = new Error("No file provided");
        error.statusCode = 400;
        throw error;
      }
      const { email, walletAddress } = req.body;
      console.log("Inside Controller");
      console.log("Request Body");
      console.log(email);
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.qrcode = req.file.buffer.toString("base64");
      user.walletAddress = walletAddress;
      await user.save();
      return res
        .status(200)
        .json({ message: "Payment Details Updated Sucessfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.post("/editProfileDetails1",upload.single("pimage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(404).json({ message: "Image is required" });
      }

      const { fname, lname, email, nemail, password, npassword, cnpassword } =
        req.body;
      console.log("Inside Controller");
      console.log("Request Body");
      console.log(email);
      console.log(nemail);
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: "User Does not exist" });
      }

      if(email !== nemail){
        const existingUser = await User.findOne({ email: nemail });
        if (existingUser) {
          return res.status(404).json({ error: "Email Already Exist..." });
        }
      }

      const passwordMatches = await argon2.verify(user.password, password);

      if (!passwordMatches) {
        return res.status(404).json({ error: "Invalid Password!" });
      }

      if (npassword !== cnpassword) {
        return res
          .status(404)
          .json({ error: "Confirm Password does not match!" });
      }

      const hashPassword = await argon2.hash(npassword);

      user.email = email;
      user.password = hashPassword;
      user.fname = fname;
      user.lname = lname;
      user.pimage = req.file.buffer.toString("base64");

      await user.save();
      return res.status(200).json({ message: "Profile Updated sucessfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.post("/editProfileDetails", upload.none(), async (req, res) =>{
  try {
    const { fname, lname, email, nemail, password, npassword, cnpassword } = req.body;

    console.log("Inside Controller");
    console.log("Request Body");
    console.log(email);
    console.log("New Email");
    console.log(nemail);
    console.log(fname);
    console.log(lname);
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "User Does not exist" });
    }

    if(email !== nemail){
      const existingUser = await User.findOne({ email: nemail });
      if (existingUser) {
        return res.status(404).json({ error: "Email Already Exist..." });
      }
    }

    const passwordMatches = await argon2.verify(user.password, password);

    if (!passwordMatches) {
      return res.status(404).json({ error: "Invalid Password!" });
    }

    if (npassword !== cnpassword) {
      return res
        .status(404)
        .json({ error: "Confirm Password does not match!" });
    }

    const hashPassword = await argon2.hash(npassword);

    user.email = email;
    user.password = hashPassword;
    user.fname = fname;
    user.lname = lname;

    await user.save();
    return res.status(200).json({ message: "Profile Updated sucessfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/getAllSellerNFTs/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log("Slleremail:" + email);
    const user = await User.findOne({ email });

    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

   

    const allNfts = await NFT.find({ sellerEmail: email, status: { $in: ["pending", "Not Verified"] }})

    return res.status(200).json(allNfts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Define a separate function to get the next order number
const getNextSubscriptionNumber = async () => {
  // Retrieve the last order number from the database and increment it

  const lastOrder = await Subscription.findOne(
    {},
    {},
    { sort: { subscrptionNumber: -1 } }
  );
  const lastOrderNumber = lastOrder
    ? parseInt(lastOrder.subscrptionNumber, 10)
    : 0;
  return (lastOrderNumber + 1).toString().padStart(3, "0");
};



router.get("/getnftDetails/:ID", async (req, res) => {
  try {
    const { ID } = req.params;

    const nft = await NFT.findById(ID);

    if (!nft) {
      return res.status(404).json({ message: "NFT not found" });
    }

    // Find the user who owns the NFT using the sellerEmail field
    const user = await User.findOne({ email: nft.sellerEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found for the NFT" });
    }

    // If both the NFT and user are found, send the response with NFT and user details
    res.status(200).json({ nft, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/profileDetails/:email", async (req, res, next) => {
  try {
    // Assuming you have a way to identify the admin (e.g., by email) in your request
    const email = req.params.email; // Change this based on your authentication method

    console.log(email);

    // Find the admin by their email
    const user = await User.findOne({ email });

    // Check if the admin exists and has a QR code
    if (!user || !user.pimage) {
      return res.status(404).json({ error: "QR code not found" });
    }

    console.log(user.fname);
    console.log(user.lname);

    // Prepare the data to send in the response
    const responseData = {
      pimage: user.pimage,
      fname: user.fname,
      username: user.username,
      listed: user.pendingnft,
      sold: user.soldnft,
      lname: user.lname,
      email: user.email,
    };

    // Send the response as a JSON object
    res.status(200).json(responseData);
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
});


router.get("/userProfileDtails/:email", async (req, res, next) => {
  try {
    // Assuming you have a way to identify the admin (e.g., by email) in your request
    const email = req.params.email; // Change this based on your authentication method

    console.log(email);

    // Find the admin by their email
    const user = await User.findOne({ email });


    console.log(user.fname);
    console.log(user.lname);

    // Prepare the data to send in the response
    const responseData = {
      pimage: user.pimage,
      fname: user.fname,
      username: user.username,
      listed: user.pendingnft,
      sold: user.soldnft,
      lname: user.lname,
      email: user.email,
    };

    // Send the response as a JSON object
    res.status(200).json(responseData);
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
});


router.get("/getnftbyCategory/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const page = req.query.page || 1; // Default to page 1 if not provided
    const perPage = 10;
    const skip = (page - 1) * perPage;
    const { nftName } = req.query;

    // Create a filter object to build the query condition
    
    const filter = { category: categoryName };

    if (nftName) {
      filter.name = nftName;
    }

    filter.status = "pending";
    filter.sellerStatus = "confirm";

    console.log("Page: " + page);
    console.log("Category: " + categoryName);
    console.log("NFT Name: " + nftName);
    console.log("Filter: " + filter);

    const nfts = await NFT.find(filter).skip(skip).limit(perPage);

    const numberOfNFTs = await NFT.countDocuments(filter);

    if (nfts.length === 0) {
      return res.status(404).json({ error: "No NFTs Found" });
    }

  
    const nftsWithUsers = await Promise.all(
      nfts.map(async (nft) => {
        try {
          const user = await User.findOne({
            email: nft.sellerEmail,
            subscriptionStatus: "confirm"
          });
          console.log("User ")
          console.log(user);
          if (user) {
            return { nft, user };
          } else {
            console.log(`No user found for email: ${nft.sellerEmail}`);
            return { nft, user: null };
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          return { nft, user: null };
        }
      })
    );
    

    res.status(200).json({ nftsWithUsers, numberOfNFTs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/getnftCount/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    console.log("NFT count function");

    console.log("User email: " + userEmail);

    // Find the user based on the provided email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalNFTs = user.totalnft;
    const pendingNFTs = user.pendingnft;
    const soldNFTs = user.soldnft;

    res.status(200).json({ totalNFTs, pendingNFTs, soldNFTs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/getSellerQrcode/:ID", async (req, res, next) => {
  try {
    const { ID } = req.params;

    const nft = await NFT.findById(ID);

    if (!nft) {
      return res.status(404).json({ message: "NFT not found" });
    }

    // Find the user who owns the NFT using the sellerEmail field
    const user = await User.findOne({ email: nft.sellerEmail });

    // Check if the admin exists and has a QR code
    if (!user || !user.qrcode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    console.log(user.walletAddress);

    // Prepare the data to send in the response
    const responseData = {
      qrcode: user.qrcode,
      walletAddress: user.walletAddress,
    };

    // Send the response as a JSON object
    res.status(200).json(responseData);
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
});

router.get("/getAllPendingNFTsAndUsers", async (req, res) => {
  try {
    const usersWithPendingNFTs = await User.find({}); // Find all users

    // Populate the NFTs for each user where status is "pending"
    await Promise.all(
      usersWithPendingNFTs.map(async (user) => {
        user.myNfts = await NFT.find({
          seller: user._id,
          status: "pending",
        });
      })
    );

    res.status(200).json(usersWithPendingNFTs);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/changeNftStatusP/:nftID", async (req, res, next) => {
  try {
    const { nftID } = req.params;

    console.log("Inside this API");
    console.log(nftID);

    // Use `await` when finding the NFT by ID
    const nft = await NFT.findById(nftID);

    if (!nft) {
      return res.status(404).json({ error: "NFT not found" });
    }

    nft.status = "pending";

    await nft.save();

    res.status(200).json({ message: "NFT status changed" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/changeNftStatusS/:nftID", async (req, res, next) => {
  try {
    const { nftID } = req.params;

    console.log("Inside this API");
    console.log(nftID);

    // Use `await` when finding the NFT by ID
    const nft = await NFT.findById(nftID);

    if (!nft) {
      return res.status(404).json({ error: "NFT not found" });
    }

    const user = await User.findOne({ email: nft.sellerEmail });

    user.soldnft += 1;

    nft.status = "sold";

    await nft.save();

    await user.save();

    res.status(200).json({ message: "NFT status changed Sold" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getPendingNFTsMaylike/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    console.log("Inside get Pending NFTs By Category");
    console.log(categoryName);
    // Find up to three pending NFTs that match the given category name
    const nfts = await NFT.find({
      category: categoryName,
      status: "pending",
    }).limit(3);
    const numberOfNFTs = nfts.length;

    if (nfts.length === 0) {
      return res.status(404).json({ error: "No Pending NFTs Found" });
    }

    // You can loop through nfts and fetch user details for each NFT here
    const nftsWithUsers = await Promise.all(
      nfts.map(async (nft) => {
        const user = await User.findOne({ email: nft.sellerEmail, subscriptionStatus : "confirm"});
        return { nft, user };
      })
    );

    res.status(200).json({ nftsWithUsers, numberOfNFTs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// router.post("/confirmNFT/:email/:nftID", async (req, res) => {
//   try {
//     // Extract nftID and userEmail from req.params
//     const { nftID, email } = req.params;
//     console.log(nftID);
//     console.log(email);

//     // Find a unique user based on nftID and userEmail
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Use await when calling NFT.findById to ensure you have an instance of the NFT model
//     const order = await Order.findById(nftID);

//     if (!order) {
//       return res.status(404).json({ message: "order not found" });
//     }
//     const nft = await NFT.findById(order.nftID);
//     user.soldnft += 1;
//     user.soldnft += nft.price;
//     const nftt = await NFT.findByIdAndDelete(order.nftID);
//     const orderr = await Order.findByIdAndDelete(nftID);


   

//     await user.save();

//     return res.status(200).json({ message: "NFT status updated to confirm" });
//   } catch (error) {
//     console.error("Error updating NFT status:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });


router.post("/confirmNFT/:email/:nftID", async (req, res) => {
  try {
    // Extract nftID and userEmail from req.params
    const { nftID, email } = req.params;
    console.log(nftID);
    console.log(email);

    // Find a unique user based on email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use await when calling Order.findById to ensure you have an instance of the Order model
    const order = await Order.findById(nftID);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const nft = await NFT.findById(order.nftID);

    // Increment user.soldnft by 1
    user.soldnft += 1;

    // Increment user.soldnft by nft.price
    user.totalSales += nft.price;
     const orderr = await Order.findById(nftID);

     orderr.orderStatus = "confirm"

    // const nftt = await NFT.findByIdAndDelete(order.nftID);
    // const orderr = await Order.findByIdAndDelete(nftID);

    await user.save();

    return res.status(200).json({ message: "NFT status updated to confirm" });
  } catch (error) {
    console.error("Error updating NFT status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/pendingNFT/:email/:nftID", async (req, res) => {
  try {
    // Extract nftID and userEmail from req.params
    const { nftID, email } = req.params;
    console.log("Inside pending");
    console.log(nftID);
    console.log(email);

    // Find a unique user based on nftID and userEmail
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use await when calling NFT.findById to ensure you have an instance of the NFT model
    const order = await Order.findById(nftID);

    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    const nft = await NFT.findById(order.nftID);

    const status = "Not Verified";
    nft.status = status;

    await nft.save();
    await user.save();

    return res.status(200).json({ message: "NFT status updated to Not Verified" });
  } catch (error) {
    console.error("Error updating NFT status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/getallnftforSearch", async (req, res) => {
  try {
   
    const page = req.query.page || 1; // Default to page 1 if not provided
    const perPage = 10;
    const skip = (page - 1) * perPage;
  
    console.log("Page: " + page);
   
    const nfts = await NFT.find({sellerStatus: "confirm"}).skip(skip).limit(perPage);

    const numberOfNFTs = await NFT.countDocuments(nfts);

    if (nfts.length === 0) {
      return res.status(404).json({ error: "No NFTs Found" });
    }

  
    const nftsWithUsers = await Promise.all(
      nfts.map(async (nft) => {
        try {
          const user = await User.findOne({
            email: { $regex: new RegExp(nft.sellerEmail, 'i') }, // Case-insensitive
            subscriptionStatus: "confirm"
          });
          console.log("User with confirm subscription status")
          console.log(user.email);
          if (user) {
            return { nft, user };
          } else {
            console.log(`No user found for email: ${nft.sellerEmail}`);
            return { nft, user: null };
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          return { nft, user: null };
        }
      })
    );
    

    res.status(200).json({ nftsWithUsers, numberOfNFTs });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// router.get("/getallnftforSearch", async (req, res) => {
//   try {
//     const page = req.query.page || 1; // Default to page 1 if not provided
//     const perPage = 10;
//     const skip = (page - 1) * perPage;

//     console.log("Page: " + page);

//     // Step 1: Find users with subscription status "confirm"
//     const usersWithConfirmSubscription = await User.find({
//       subscriptionStatus: "confirm"
//     });

//     if (usersWithConfirmSubscription.length === 0) {
//       return res.status(404).json({ error: "No users with 'confirm' subscription status found" });
//     }

//     // Step 2: Get NFTs for each user with "confirm" subscription status
//     const nftsWithUsers = [];

//     for (const user of usersWithConfirmSubscription) {
//       const nfts = await NFT.find({ sellerEmail: user.email,status: "pending" })
//         .skip(skip)
//         .limit(perPage);

//       nftsWithUsers.push({ user, nfts });
//     }

//     // Calculate the total number of NFTs
//     const numberOfNFTs = nftsWithUsers.reduce((total, item) => total + item.nfts.length, 0);

//     if (numberOfNFTs === 0) {
//       return res.status(404).json({ error: "No NFTs found for users with 'confirm' subscription status" });
//     }

//     res.status(200).json({ nftsWithUsers, numberOfNFTs });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });


router.get("/getOrdersHistory/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    // Use Mongoose to find all orders with the specified sellerEmail
    const orders = await Order.find({buyerEmail: email });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
