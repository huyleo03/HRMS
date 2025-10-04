const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Retrying connection in 5 seconds...');
    
    // Retry connection after 5 seconds instead of exiting
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  console.log('Attempting to reconnect...');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
  console.log('Attempting to reconnect in 5 seconds...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing mongoose connection:', err);
    process.exit(1);
  }
});

module.exports = connectDB; 