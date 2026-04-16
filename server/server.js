require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
const cors = require('cors');

app.use(cors({
  origin: [
    'https://namdev-chiwada-mern.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/wishlist', require('./routes/wishlist'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Namdev Chiwada API running 🎉' });
});
app.get('/test', (req, res) => {
  res.send('Server working');
});

// Error handler (must be last)
app.use(errorHandler);

// ✅ START SERVER ONLY AFTER DB CONNECTS
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1); // stop app if DB fails
  });