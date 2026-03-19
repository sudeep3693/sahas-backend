import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://sudeepsubedi72:wdf4A8ypJKVMxunU@ac-4rretqi-shard-00-00.eyybn0u.mongodb.net:27017,ac-4rretqi-shard-00-01.eyybn0u.mongodb.net:27017,ac-4rretqi-shard-00-02.eyybn0u.mongodb.net:27017/?ssl=true&replicaSet=atlas-12cw1q-shard-0&authSource=admin&appName=SahasCooperative';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Error while connecting to database:', err);
    process.exit(1);
  }
};

export default connectDB;
// mongodb+srv://sudeepsubedi72:wdf4A8ypJKVMxunU@sahascooperative.eyybn0u.mongodb.net/SahasCooperative?retryWrites=true&w=majority&appName=SahasCooperative
// mongodb://sudeepsubedi72:wdf4A8ypJKVMxunU@ac-4rretqi-shard-00-00.eyybn0u.mongodb.net:27017,ac-4rretqi-shard-00-01.eyybn0u.mongodb.net:27017,ac-4rretqi-shard-00-02.eyybn0u.mongodb.net:27017/?ssl=true&replicaSet=atlas-12cw1q-shard-0&authSource=admin&appName=SahasCooperative