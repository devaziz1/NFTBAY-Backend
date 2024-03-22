const express = require("express");
require("dotenv").config();
const multer = require("multer");
const app = express();
const argon2 = require("argon2");
const router = express.Router();
const jwt = require("jsonwebtoken");
const moment = require('moment');


const User = require("../../model/User");
const Admin = require("../../model/Admin");
const Subscription = require("../../model/Subscription");
const Order = require("../../model/Order");
const NFT = require("../../model/NFT");

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await Admin.findOne({ email });

    if (existingUser) {
      return res.status(404).json({ error: "Email already exist!" });
    }

    const hashPassword = await argon2.hash(password);

    const admin = new Admin({
      name,
      email,
      password: hashPassword,
    });

    await admin.save();

    return res
      .status(201)
      .json({ message: "Account Created Successfully", admin });
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

    const user = await Admin.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Invalid Email!" });
    }

    const passwordMatches = await argon2.verify(user.password, password);

    if (!passwordMatches) {
      return res.status(404).json({ error: "Invalid Password!" });
    }

    return res.status(201).json({ message: "User log in successfully", email });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post("/editProfile", upload.single("qrcode"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(404).json({ error: "Please Upload QR Code" });
    }
    console.log("Inside edit profile");
    const { email, myReferenceID, mySubsCharges } = req.body;

    console.log(myReferenceID);
    console.log(mySubsCharges);

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "admin not found" });
    }

    const qrcode = req.file.buffer.toString("base64");

    admin.myReferenceID = myReferenceID;
    admin.mySubsCharges = mySubsCharges;
    admin.qrcode = qrcode;
    Subscription.amount = mySubsCharges;

    await admin.save();

    res.status(200).json({ message: "Profile Updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/upload-qrcode",
  upload.single("qrcode"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const admin = await Admin.findOne({ email: "salman001@gmail.com" });

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      admin.qrcode = req.file.buffer.toString("base64");
      await admin.save();

      return res
        .status(200)
        .json({ message: "Admin's QR code uploaded successfully" });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/get-qrcode/:email", async (req, res, next) => {
  try {
    // Assuming you have a way to identify the admin (e.g., by email) in your request
    const email = req.params.email; // Change this based on your authentication method

    console.log(email);

    // Find the admin by their email
    const admin = await Admin.findOne({ email });

    // Check if the admin exists and has a QR code
    if (!admin || !admin.qrcode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    console.log(admin.myReferenceID);

    // Prepare the data to send in the response
    const responseData = {
      qrcode: admin.qrcode,
      myReferenceID: admin.myReferenceID,
    };

    // Send the response as a JSON object
    res.status(200).json(responseData);
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
});

router.get("/getAllUsers", async (req, res, next) => {
  try {
    const allUsers = await User.find();

    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getSubscriptionDetails", async (req, res, next) => {
  try {
    const allSubscriptions = await Subscription.find();

    res.status(200).json(allSubscriptions);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getReecentSubscriptions", async (req, res, next) => {
  try {
    const recentSubscriptions = await Subscription.find()
      .sort({ purchaseDate: -1 }) // Sort by purchaseDate in descending order
      .limit(5); // Limit the results to the first 5 records

    res.status(200).json(recentSubscriptions);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getPurchaseHistory", async (req, res, next) => {
  try {
    const allPurchaseHistory = await Order.find();

    res.status(200).json(allPurchaseHistory);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/profileDetails/:email", async (req, res, next) => {
  try {
    // Assuming you have a way to identify the admin (e.g., by email) in your request
    const email = req.params.email; // Change this based on your authentication method

    console.log(email);

    // Find the admin by their email
    const admin = await Admin.findOne({ email });

    // Check if the admin exists and has a QR code
    if (!admin || !admin.qrcode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    console.log(admin.myReferenceID);
    console.log(admin.mySubsCharges);

    // Prepare the data to send in the response
    const responseData = {
      qrcode: admin.qrcode,
      myReferenceID: admin.myReferenceID,
      mySubsCharges: admin.mySubsCharges,
    };

    // Send the response as a JSON object
    res.status(200).json(responseData);
  } catch (error) {
    next(error); // Pass the error to the error handler middleware
  }
});

router.post("/changeSubsStatusP/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    console.log("Inside this API");
    console.log(email);

    // Use `await` when finding the NFT by ID
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await Subscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    subscription.subscriptionStatus = "Not Verified";
    user.subscriptionStatus = "Not Verified";

    await user.save();
    await subscription.save();

    res.status(200).json({ message: "subscription status changed to Not Verified" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/changeSubsStatusC/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    console.log("Inside this API");
    console.log(email);

    // Use `await` when finding the NFT by ID
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subscription = await Subscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    subscription.subscriptionStatus = "confirm";

    user.subscriptionStatus = "confirm";
    await user.save();
    await subscription.save();

    res.status(200).json({ message: "subscription status changed to confirm" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



const getMonthName = (month) => {
  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];
  return monthNames[month];
};


router.get("/totalRevenue-visits/:email", async (req, res, next) => {
  const { email } = req.params;

  try {
    // Find the admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Get values from admin's attributes
    const numOfsubs = admin.numOfsubs;
    const mySubsCharges = parseFloat(admin.mySubsCharges);

    // Calculate the total revenue
    const totalRevenue = numOfsubs * mySubsCharges;

    // Update the new visits array for the entire year
    const newVisits = admin.visitedIPs ? admin.visitedIPs.length : 0;

    const yearlyMonthlyDataRevenue = [];
    const yearlyMonthlyDataVisits = [];

    // Calculate monthly revenue and visits
    for (let month = 0; month < 12; month++) {
      const monthName = getMonthName(month);

      const monthlyRevenue = calculateMonthlyRevenue(admin, month);
      const monthlyVisits = calculateMonthlyVisits(admin, month);

      yearlyMonthlyDataRevenue.push({
      
        revenue: monthlyRevenue,
      });

      yearlyMonthlyDataVisits.push({
      
        visits: monthlyVisits,
      });
    }

    // Define a function to calculate monthly revenue
    function calculateMonthlyRevenue(admin, month) {
      const startOfMonth = moment().month(month).startOf('month');
      const endOfMonth = moment().month(month).endOf('month');

      const monthlyRevenueData = admin.revenue.filter((entry) => {
        const timestamp = moment(entry.timestamp);
        return timestamp.isBetween(startOfMonth, endOfMonth, null, '[]');
      });

      const monthlyRevenue = monthlyRevenueData.reduce(
        (total, entry) => total + entry.value,
        0
      );

      return monthlyRevenue;
    }

    // Define a function to calculate monthly visits
    function calculateMonthlyVisits(admin, month) {
      const startOfMonth = moment().month(month).startOf('month');
      const endOfMonth = moment().month(month).endOf('month');

      const monthlyVisitsData = admin.visitedIPs
        ? admin.visitedIPs.filter((entry) => {
            const timestamp = moment(entry.timestamp);
            return timestamp.isBetween(startOfMonth, endOfMonth, null, '[]');
          })
        : [];

      const monthlyVisits = monthlyVisitsData.length;

      return monthlyVisits;
    }

    await admin.save();

    res.status(200).json({
      message: "Total revenue calculated and updated",
      totalRevenue,
      newVisits,
      yearlyMonthlyDataRevenue,
      yearlyMonthlyDataVisits,
    });
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});







// router.get("/totalRevenue-visits/:email", async (req, res, next) => {
//   const { email } = req.params;

//   try {
//     // Find the admin by email
//     const admin = await Admin.findOne({ email });

//     if (!admin) {
//       return res.status(404).json({ error: 'Admin not found' });
//     }

//     // Get values from admin's attributes
//     const numOfsubs = admin.numOfsubs;
//     const mySubsCharges = parseFloat(admin.mySubsCharges);

//     // Calculate the total revenue
//     const totalRevenue = numOfsubs * mySubsCharges;

//     // Update the admin's revenue attribute
//     admin.revenue.push({
//       timestamp: Date.now(),
//       value: totalRevenue,
//     });

//     // Update the new visits array for the entire year
//     const newVisits = admin.visitedIPs.length;

//     await admin.save();

//     res.status(200).json({ message: 'Total revenue calculated and updated', totalRevenue, newVisits });
//   } catch (error) {
//     console.error('Error calculating total revenue:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.get("/monthlysubs/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const monthlySubscriptions = [];

    for (let month = 0; month < 12; month++) {
      // Calculate the start and end dates for the current month
      const startDate = new Date(new Date().getFullYear(), month, 1);
      const endDate = new Date(new Date().getFullYear(), month + 1, 0);

      // Debugging
      console.log(`Checking subscriptions for ${getMonthName(month)}:`);
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);

      // Find all confirmed subscriptions within the current month for users associated with the admin
      const userEmails = admin.users.map((user) => user.email);

      // Debugging
      console.log("User Emails:", userEmails);

      const subscriptions = await Subscription.find({
        subscriptionStatus: "confirm",
        purchaseDate: { $gte: startDate, $lte: endDate },
      });

      // Debugging
      console.log(`Subscriptions for ${getMonthName(month)}:`, subscriptions);

      // Store the count of subscriptions in the array for the current month
      monthlySubscriptions.push({ count: subscriptions.length });
    }

    // Update the admin's totalSubs array with monthly subscriptions
    await Admin.findByIdAndUpdate(admin._id, {
      totalSubs: monthlySubscriptions,
    });

    console.log("Monthly subscriptions calculated and updated.");

    res.status(200).json({ monthlySubscriptions });
  } catch (error) {
    console.error(
      "Error calculating and updating monthly subscriptions:",
      error
    );
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/new-visits", async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email: "salman001@gmail.com" }); // Replace with your admin's email

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const newVisits = admin.visitedIPs.length;
    res.json({ newVisits });
  } catch (error) {
    console.error("Error getting new visits:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define a route to delete a user by email
router.delete("/deleteUser/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;

    // Find the user based on the provided email
    const user = await User.findOneAndDelete({ email: userEmail });
    const nft = await NFT.findOneAndDelete({ sellerEmail: userEmail });
    const sunbscription = await Subscription.findOneAndDelete({
      email: userEmail,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// Define a route for adding emails to the admin's newsletter list
router.post('/addEmailToNewsletter', async (req, res) => {
  try {
    const { newEmail } = req.body;

    // Find the admin by email
    const admin = await Admin.findOne({ email: "salman001@gmail.com" });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if the email is not already in the list
    if (admin.newsLetterEmails.some((item) => item.email === newEmail)) {
      return res.status(400).json({ error: 'Email Already Subscribed' });
    }

    // Push the new email into the newsletter list
    admin.newsLetterEmails.push({ email: newEmail });

    // Save the admin document with the updated list
    await admin.save();

    return res.status(200).json({ message: 'Your Email Subscribed Successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
