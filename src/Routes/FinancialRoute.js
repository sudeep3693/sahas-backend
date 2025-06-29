// routes/auth.js
import { Router } from 'express';
import InstitutionalDetail from '../Model/InstitutionalProfile.js';

const router = Router();

router.post('/add', async (request, response) => {
  try {
    console.log("Received data for institutional profile");

    const existing = await InstitutionalDetail.findOne();

    if (existing) {
      // Update the existing document
      await InstitutionalDetail.updateOne(
        { _id: existing._id },
        { $set: request.body }
      );
      response.status(200).json({ message: "Institutional details updated" });
      console.log("Institutional data updated successfully");
    } else {
      // Create a new document
      const newRecord = new InstitutionalDetail(request.body);
      await newRecord.save();
      response.status(201).json({ message: "Institutional details created" });
      console.log("Institutional data created successfully");
    }

  } catch (err) {
    console.error("Error saving institutional details:", err);
    response.status(500).json({ error: "Failed to save data" });
  }
});


router.get('/getAll', async (request,response)=>{

  try{
    console.log("getting institutional data");
    const record = await InstitutionalDetail.find();
    response.status(200).json(record);
  }
  catch (err){

    console.log("error while retriving data");
    response.status(500).json({error: "error while retriving data"});

  }
});


export default router;
