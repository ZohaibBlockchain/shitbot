import Servent from './tradeEngine.js';
import Binance from 'node-binance-api';
import 'dotenv/config'
import { Router } from 'express';
const router = Router();

const binance = new Binance().options({
  APIKEY: process.env.APIKEY,
  APISECRET: process.env.SKEY
});

let worker = new Servent('Main', 1000, binance, 15, 'init', 40,7.5,5)


router.get('*', (req, res) => {
  res.send('Welcome to our Shit bot');
});


router.post('/signal', (req, res) => {
  try {
    const { signal } = req.body;
    console.log(signal,0);
    // Assuming worker.updateSignal is a valid function
    worker.updateSignal(signal,'0');
    // Send a response back to the client
    res.status(200).send('Signal received');
  } catch (error) {
    console.error('Error processing signal:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Export the router
export default router;