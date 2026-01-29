require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Import Routes (Lấy code mới nhất từ develop)
const reviewRoutes = require('./routes/review.route');
const authRoutes = require('./routes/auth.routes');
const favoriteRoutes = require('./routes/favorite.route');
const placeRoutes = require('./routes/place.route');
const placeRoute = require('./routes/place.routes');
const categoryRoutes = require('./routes/category.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const adminRoutes = require('./routes/admin.route'); // <-- Quan trọng: Phải có cái này Dashboard mới chạy

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =======================
   CORS CONFIG (QUAN TRỌNG)
======================= */
// Để cors() trống nghĩa là chấp nhận tất cả (Cho Vercel truy cập thoải mái)
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Cấu hình Routes
app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/places', placeRoute);
app.use('/api/places', placeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes); // <-- Route cho Admin Dashboard

app.use(errorHandler);

module.exports = app;