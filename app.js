import express from 'express';
import { predictFires } from './firePrediction.js';
import { convertMunCodeToName, convertStrToDate } from './utils.js';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/getFirePrediction', async (req, res) => {
  try {
    const { municipalityCode, date: dateStr } = req.body;
    const municipalityName = convertMunCodeToName(municipalityCode);
    const date = convertStrToDate(dateStr);
    const predictedFires = await predictFires(municipalityName, date);
    res.json({
      municipalityCode,
      municipalityName,
      predictedFires,
    });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    if (
      error.message === 'Invalid date' ||
      error.message === 'Invalid municipality code'
    ) {
      return res.status(400).send(error.message);
    }
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
