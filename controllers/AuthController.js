const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register a new user
const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username){
      return res.status(400).json({ error: 'username is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    console.log(username, email);
    console.log(await User.find({}));

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'username already exists' });
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ error: 'email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, email, role: 'user' });
    console.log(user);
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };

