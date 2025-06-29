import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({

    imageName:String,
    date: String,
    heading: String,
    newsDescription:String,

});

const NewsDetails = mongoose.model('News', NewsSchema);
export default NewsDetails;