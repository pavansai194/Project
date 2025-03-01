// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow Cross-Origin requests
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// In-memory user storage (for demonstration purposes)
let users = [];

// Registration route
app.post('/register', (req, res) => {
    const { fullname, email, password, number, gender } = req.body;

    // Validate input
    if (!fullname || !email || !password || !number || !gender) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if passwords match (you might want to add more security checks)
    if (req.body.password !== req.body.confirmpassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    // Save user (In a real application, you would save this to a database)
    users.push({ fullname, email, password, number, gender });
    res.status(201).json({ message: 'User registered successfully' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
