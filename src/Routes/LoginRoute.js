// routes/auth.js
import { Router } from 'express';
import Credintal from '../Model/Credintals.js';

const router = Router();

router.post('/login', async (request, response) => {
  const { username, password } = request.body;

  try {
    const user = await Credintal.findOne({ username, password });

    if (user) {
      console.log("Successfully validated credentials");
      response.status(200).send("Credentials validated and logged in successfully");
    } else {
      response.status(401).send("Invalid username or password");
    }
  } catch (err) {
    console.error("Error while retrieving the data:", err);
    response.status(500).send("Internal Server Error");
  }
});

export default router;
