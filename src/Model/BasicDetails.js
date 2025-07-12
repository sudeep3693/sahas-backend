import mongoose, { mongo } from "mongoose";

const BasicDetails = new mongoose.Schema({

    name:String,
    email:String,
    telephone:String,
    mobile:String,
    location:String,
    district:String,
    province:String,
    fax:Number,
    pbox:Number

});

const BasicDetailsSchema = mongoose.model('BasicDetails', BasicDetails);
export default BasicDetailsSchema;