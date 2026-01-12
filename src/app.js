require('dotenv').config();

const express = require('express');
const reviewRoutes = require('./routes/review.route');
const authRoutes = require('./routes/auth.routes');
const favoriteRoutes = require('./routes/favorite.route');
const placeRoutes = require('./routes/place.route');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();
const morgan = require('morgan');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/places', placeRoutes);
app.use("/api/places", placeRoutes);

app.use(errorHandler);

module.exports = app;
