import { G_MATRIX } from '../data/index.js';

export function calculateStdDev(covariates) {
  return covariates.map((eachDay) => {
    return {
      date: eachDay.date,
      houseType1: calculateStdDevPerHouseType(
        eachDay.houseType1,
        G_MATRIX.houseType1
      ),
      houseType2: calculateStdDevPerHouseType(
        eachDay.houseType2,
        G_MATRIX.houseType2
      ),
      houseType3: calculateStdDevPerHouseType(
        eachDay.houseType3,
        G_MATRIX.houseType3
      ),
      houseType4: calculateStdDevPerHouseType(
        eachDay.houseType4,
        G_MATRIX.houseType4
      )
    };
  });
}

export function calculateScalingFactorsForCI(stdDev) {
  return stdDev.map((eachDay) => {
    return {
      date: eachDay.date,
      houseType1: {
        lower: 1 - eachDay.houseType1 * 1.96,
        upper: 1 + eachDay.houseType1 * 1.96
      },
      houseType2: {
        lower: 1 - eachDay.houseType2 * 1.96,
        upper: 1 + eachDay.houseType2 * 1.96
      },
      houseType3: {
        lower: 1 - eachDay.houseType3 * 1.96,
        upper: 1 + eachDay.houseType3 * 1.96
      },
      houseType4: {
        lower: 1 - eachDay.houseType4 * 1.96,
        upper: 1 + eachDay.houseType4 * 1.96
      }
    };
  });
}

function calculateStdDevPerHouseType(covArr, G) {
  // Convert covArr to a row matrix if it's not already
  const rowMatrixCovArr = Array.isArray(covArr[0]) ? covArr : [covArr];

  // Transpose of covArr
  const transposedCovArr = rowMatrixCovArr[0].map((_, i) => [
    rowMatrixCovArr[0][i]
  ]);

  // Perform matrix multiplication
  const tempResult = matrixMultiply(rowMatrixCovArr, G);
  const scalarValue = matrixMultiply(tempResult, transposedCovArr);

  // Return the scalar value from the 1x1 matrix
  return scalarValue[0][0];
}

function matrixMultiply(A, B) {
  const rowsA = A.length,
    colsA = A[0].length,
    rowsB = B.length,
    colsB = B[0].length,
    C = [];

  if (colsA !== rowsB) {
    throw new Error('Matrix dimensions do not match for multiplication.');
  }

  for (let i = 0; i < rowsA; i++) {
    C[i] = [];
    for (let j = 0; j < colsB; j++) {
      C[i][j] = 0;
      for (let k = 0; k < colsA; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }

  return C;
}
