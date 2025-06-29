import mongoose from 'mongoose';
const DBConnect = (req, res, next) =>{

    mongoose.connect('mongodb+srv://sudeepsubedi72:wdf4A8ypJKVMxunU@sahascooperative.eyybn0u.mongodb.net/?retryWrites=true&w=majority&appName=SahasCooperative', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Error while connecting to database:', err));
    
    next();
}
// 'mongodb://localhost:27017/Sahas'
//process.env.MONGO_URI
export default DBConnect;


const uri = "mongodb+srv://sudeepsubedi72:<db_password>@sahascooperative.eyybn0u.mongodb.net/?retryWrites=true&w=majority&appName=SahasCooperative";
