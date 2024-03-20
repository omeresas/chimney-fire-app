import createError from 'http-errors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import debugLib from 'debug';
import { getCurrentTimeInNetherlands } from '../lib/utils.js';

const debug = debugLib('chimney-fire-app:model');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = 'src/r/r-data/excel/';
    // Ensure the directory exists. If not, create it.
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new createError.BadRequest('Only Excel files are allowed.'));
  }
};

export function handleFileUpload(req, res, next) {
  const upload = multer({ storage: storage, fileFilter: fileFilter }).array(
    'excelFiles',
    5
  );

  upload(req, res, function (err) {
    if (
      err instanceof multer.MulterError &&
      err.message === 'Unexpected field'
    ) {
      return next(
        new createError.InternalServerError(
          `Invalid field name in form data. Use 'excelFiles' as the field name.`
        )
      );
    } else if (err) {
      return next(
        new createError.InternalServerError(`Upload error: ${err.message}`)
      );
    }

    if (!req.files || req.files.length === 0) {
      return next(new createError.BadRequest('No files were uploaded.'));
    }

    res.json({
      message: `${req.files.length} File(s) uploaded successfully.`
    });
  });
}

export async function updateHouseCount(req, res, next) {
  try {
    await executeRScript(
      `${process.env.MY_APP_PATH}/r/r-script/update_house_count.R`
    );

    res.json({
      message: 'House count updating process completed.'
    });
  } catch (err) {
    console.error('Error during house count updating process:', err);
    next(
      new createError.InternalServerError(
        `House count updating failed: ${err.message}`
      )
    );
  }
}

export async function refitModel(req, res, next) {
  try {
    await executeRScript(`${process.env.MY_APP_PATH}/r/r-script/fit_model.R`);

    res.json({ message: 'Model refitting process completed.' });
  } catch (err) {
    console.error('Error during model refitting process:', err);
    next(
      new createError.InternalServerError(
        `Model refitting failed: ${err.message}`
      )
    );
  }
}

function executeRScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const scriptName = path.basename(scriptPath);
    debug(`Executing R script: ${scriptName}`);
    debug(`Start time: ${getCurrentTimeInNetherlands()}`);
    exec(`Rscript ${scriptPath}`, function (error, stdout) {
      if (error) {
        console.error(`Error executing R script: ${error}`);
        return reject(
          new createError.InternalServerError('R script execution failed.')
        );
      }
      debug(`End time: ${getCurrentTimeInNetherlands()}`);
      resolve(stdout);
    });
  });
}
