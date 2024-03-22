const Admin = require('../model/Admin');

const newVisitorMiddleware = async (req, res, next) => {
  try {
    // Get the visitor's IP address from the request object
    const visitorIP = req.ip;

    // Check if the IP address is new for the website
    const admin = await Admin.findOne({ email: 'salman001@gmail.com' }); // Replace with your admin's email
    if (admin) {
      const isIPVisited = admin.visitedIPs.some((visitedIP) => visitedIP.ipAddress === visitorIP);
      if (!isIPVisited) {
        // Add the new IP address to the admin's visitedIPs array
        admin.visitedIPs.push({ ipAddress: visitorIP });
        await admin.save();
      }
    }

    next();
  } catch (error) {
    console.error('Error tracking new visitors:', error);
    next();
  }
};

module.exports = newVisitorMiddleware;
