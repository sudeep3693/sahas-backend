// routes/auth.js
import { Router } from 'express';
import InstitutionalDetail from '../Model/InstitutionalProfile.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/add', async (request, response) => {
  try {
    console.log("Received data for institutional profile");

    const existing = await InstitutionalDetail.findOne();

    if (existing) {
      await InstitutionalDetail.updateOne(
        { _id: existing._id },
        { $set: request.body }
      );
      response.status(200).json({ message: "Institutional details updated" });
      logger.info('Institutional details updated successfully');
    } else {
      const newRecord = new InstitutionalDetail(request.body);
      await newRecord.save();
      response.status(201).json({ message: "Institutional details created" });
      logger.info('Institutional details created successfully');
    }

  } catch (err) {
    logger.error('Error saving institutional details', err);
    response.status(500).json({ error: "Failed to save data", details: err.message || String(err) });
  }
});


router.get('/getAll', async (request,response)=>{

  try{
    const record = await InstitutionalDetail.find();
    logger.info(`Institutional records fetched: ${record.length} record(s)`);
    response.status(200).json(record);
  }
  catch (err){
    logger.error('Error retrieving institutional details', err);
    response.status(500).json({error: "error while retriving data", details: err.message || String(err)});
  }
});


export default router;
