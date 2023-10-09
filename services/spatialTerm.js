import { exec } from 'child_process';

export async function calculateSpatialTerms(scriptPath, municipalityName) {
  try {
    const output = await executeRScript(scriptPath, municipalityName);
    return output.split(',').reduce(function (obj, value, index) {
      obj[`houseType${index + 1}`] = parseFloat(value.trim());
      return obj;
    }, {});
  } catch (error) {
    throw new Error('Failed to calculate spatial terms');
  }
}

// move to utils
function executeRScript(scriptPath, args) {
  return new Promise(function (resolve, reject) {
    exec(`Rscript ${scriptPath} ${args}`, function (error, stdout, stderr) {
      if (error) {
        console.error(`Error executing R script: ${error}`);
        return reject(new Error('Internal Server Error'));
      }
      resolve(stdout);
    });
  });
}
