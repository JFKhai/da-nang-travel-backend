require('dotenv').config();

const express = require('express');
const { sequelize } = require('./models');
// const uploadRoutes = require('./routes/upload.route');
// const authRoutes = require('./routes/auth.routes');
// const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.get('/', (req, res) => {
//   res.send('Welcome to the Image Upload API');
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // 🔥 CHỈ SYNC KHI CHỦ ĐỘNG BẬT
    if (process.env.DB_INIT === 'true') {
      await sequelize.sync();
      console.log('DB initialized (sync executed)');
    } else {
      console.log('DB sync skipped');
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
