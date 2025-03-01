const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Middleware for session handling
app.use(session({
  secret: 'yourSecretKey',  // Change this secret for production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 3600000 } // 1 hour maxAge for session cookie
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mourya', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Database connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true },
  password: String, // Plain text password stored directly
  number: String,
  gender: String
});

const User = mongoose.model('User', userSchema);

// Serve static files from 'public' directory (if you have any)
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html (or homepage)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration route
app.post('/register', async (req, res) => {
  const { fullname, email, password, number, gender } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const newUser = new User({
      fullname,
      email,
      password, // Storing password as plain text
      number,
      gender,
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  name: String,
  place: String,
  email: String,
  address: String,
  pincode: String,
  paymentMode: String,
  products: [{
      name: String,
      price: Number,
      quantity: Number,
      imgSrc: String
  }],
  totalPrice: Number,
  orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Route to handle checkout and store the order
app.post('/checkout', (req, res) => {
  const { name, place, email, address, pincode, paymentMode, products, totalPrice } = req.body;

  if (!name || !place || !email || !address || !pincode || !paymentMode || !products || !totalPrice) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  const newOrder = new Order({
      name,
      place,
      email,
      address,
      pincode,
      paymentMode,
      products,
      totalPrice
  });

  newOrder.save()
  .then(order => res.status(201).json({ message: 'Order placed successfully', order }))
  .catch(err => {
      console.error('Error placing order:', err);
      res.status(500).json({ message: 'Failed to place order' });
  });
});

// Adjusted login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password' });
  }

  try {
    // Admin login check
    if (email === 'admin@gmail.com' && password === 'admin') {
      return res.status(200).json({ message: 'Admin login successful', redirect: '/admin.html' });
    }

    // User login check
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {  // Comparing plain text passwords
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user._id;
    req.session.userEmail = user.email;

    res.status(200).json({ message: 'User login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
});

// Route to get bookings for the logged-in user
app.get('/user-bookings', (req, res) => {
  const userEmail = req.session.userEmail;

  if (!userEmail) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  Order.find({ email: userEmail })
    .then(orders => res.status(200).json(orders))
    .catch(err => {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ message: 'Failed to retrieve bookings' });
    });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Failed to log out' });
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Route to retrieve users for the admin page
app.get('/api/admin/users', async (req, res) => {
  try {
      const users = await User.find({}, { fullname: 1, email: 1, number: 1, gender: 1 });
      res.json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Failed to retrieve users.');
  }
});

// Route to retrieve orders for the admin page
app.get('/api/admin/orders', async (req, res) => {
  try {
      const orders = await Order.find({}, { name: 1, place: 1, email: 1, address: 1, pincode: 1, paymentMode: 1, orderDate: 1, totalPrice: 1, products: 1 });
      res.json(orders);
  } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).send('Failed to retrieve orders.');
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
