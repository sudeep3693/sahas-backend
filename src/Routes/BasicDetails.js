import { Router } from 'express';
import DBConnect from '../MiddleWare/DatabaseConnection.js';
import BasicDetails from '../Model/BasicDetails.js';
const router = Router();


router.use(DBConnect);
router.post("/basicDetails", async (request, response) => {
  try {
    const filter = {};
    const update = request.body;
    const options = { new: true, upsert: true };

    const updatedData = await BasicDetails.findOneAndUpdate(filter, update, options);

    console.log("Upserted Record:", updatedData);
    response.status(200).json({
      message: "Data saved or updated successfully",
      data: updatedData
    });
  } catch (error) {
    console.error("Error saving/updating DB:", error);
    response.status(500).json({ error: "Server error" });
  }
});

router.get("/getBasicDetails", async (request,response)=>{
  try{
    const data = await BasicDetails.find();
    console.log("data received :",data);
    response.status(200).json(data);
  }
  catch(error){
console.error("Error retriving record: ", error);
    response.status(500).json({ error: "Server error" });

  }
})


export default router;
