require('dotenv').config();

const express = require('express');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    if (process.env.NODE_ENV === 'development') {
      // Development: dùng alter để cập nhật cấu trúc
      await sequelize.sync({ alter: true });
      console.log('Database synchronized (alter mode - structure updated)');
    } else {
      // Production: chỉ kiểm tra, không thay đổi cấu trúc
      await sequelize.sync({ alter: false });
      console.log('Database schema validated (production mode)');
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    process.on('SIGTERM', async () => {
      console.log(' SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log(' SIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
