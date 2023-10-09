# Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in various municipalities given historical and meteorological data, leveraging both spatial and temporal prediction models. The API is designed to be both accurate and efficient, providing quick responses to client requests with minimized computational overhead.

### Prediction Model

- **Spatial Prediction**: Uses precalculated values determined by an R script, which calculates the expected number of fires for different house types in various municipalities.
- **Temporal Prediction**: A mathematical model calculates the expected number of fires based on temporal factors, such as the time of year and weather conditions (e.g., wind chill).

The final prediction is computed by multiplying the spatial and temporal predictions together, providing an estimate that considers both the inherent risk of the area and the specific conditions of the requested date.

## API Endpoint

### `POST /getFirePrediction`

#### Request Body

```json
{
  "municipalityCode": "string",
  "date": "string (YYYY-MM-DD)"
}
```

#### Response

```json
{
  "municipalityCode": "string",
  "municipalityName": "string",
  "predictedFires": "number"
}
```

#### Description

Given a `municipalityCode` and a `date`, returns the predicted number of chimney fires in the specified municipality on the specified date. Utilizes both spatial and temporal models for the prediction.
