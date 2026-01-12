const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 8080;

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

    if (
      process.env.DB_SYNC === 'true' &&
      process.env.NODE_ENV === 'development'
    ) {
      await sequelize.sync({ alter: true });
      console.log('Database schema synchronized');
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
}

startServer();
