// routes/auth.js
import { Router } from 'express';
import Credintal from '../Model/Credintals.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/login', async (request, response) => {
  const { username, password } = request.body;

  try {
    const user = await Credintal.findOne({ username, password });

    if (user) {
      logger.info(`Login success for username: ${username}`);
      response.status(200).send("Credentials validated and logged in successfully");
    } else {
      logger.warn(`Failed login attempt for username: ${username}`);
      response.status(401).send("Invalid username or password");
    }
  } catch (err) {
    logger.error('Login error', err);
    response.status(500).json({ message: "Internal Server Error", error: err.message || String(err) });
  }
});

export default router;
