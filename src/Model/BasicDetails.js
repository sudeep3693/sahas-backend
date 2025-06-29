import mongoose, { mongo } from "mongoose";

const BasicDetails = new mongoose.Schema({

    name:String,
    email:String,
    telephone:Number,
    mobile:Number,
    location:String,
    district:String,
    province:String,
    fax:Number,
    pbox:Number

});

const BasicDetailsSchema = mongoose.model('BasicDetails', BasicDetails);
export default BasicDetailsSchema;