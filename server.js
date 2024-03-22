const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const bodyParser = require('body-parser'); // Import bodyParser

const userRouter = require("./routes/user/User");
const adminRouter = require("./routes/admin/Admin");
const newVisitorMiddleware = require('./middleware/newVisitor');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: `https://nftbay.uk/`,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(bodyParser.json()); // Use bodyParser for JSON parsing

app.use(newVisitorMiddleware);



// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NFTBAY', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

// Define your routes here

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.use("/user", userRouter);
app.use("/admin", adminRouter);




app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const mesg = err.message;
  const data = err.data;
  res.status(statusCode).json({ mesg,  data });
});
