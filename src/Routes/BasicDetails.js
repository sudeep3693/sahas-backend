import { Router } from 'express';
import DBConnect from '../MiddleWare/DatabaseConnection.js';
import BasicDetails from '../Model/BasicDetails.js';
import logger from '../utils/logger.js';
const router = Router();


router.use(DBConnect);
router.post("/basicDetails", async (request, response) => {
  try {
    const filter = {};
    const update = request.body;
    const options = { new: true, upsert: true };

    const updatedData = await BasicDetails.findOneAndUpdate(filter, update, options);

    logger.info('BasicDetails upserted', { id: updatedData?._id });
    response.status(200).json({
      message: "Data saved or updated successfully",
      data: updatedData
    });
  } catch (error) {
    logger.error('Error saving/updating BasicDetails', error);
    response.status(500).json({ error: "Server error", details: error.message || String(error) });
  }
});

router.get("/getBasicDetails", async (request,response)=>{
  try{
    const data = await BasicDetails.find();
    logger.info(`BasicDetails fetched: ${data.length} record(s)`);
    response.status(200).json(data);
  }
  catch(error){
    logger.error('Error retrieving BasicDetails', error);
    response.status(500).json({ error: "Server error", details: error.message || String(error) });
  }
})


export default router;
