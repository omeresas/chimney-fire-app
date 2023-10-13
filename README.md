# Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in various municipalities given historical and meteorological data, leveraging both spatial and temporal prediction models. The API is designed to be both accurate and efficient, providing quick responses to client requests with minimized computational overhead.

### Prediction Model

- **Spatial Prediction**: Uses precalculated values determined by an R script, which calculates the expected number of fires for different house types in various municipalities.
- **Temporal Prediction**: A mathematical model calculates the expected number of fires based on temporal factors, such as the time of year and weather conditions (e.g., wind chill).

The final prediction is computed by multiplying the spatial and temporal predictions together, providing an estimate that considers both the inherent risk of the area and the specific conditions of the requested date.

## API Endpoint

### `GET /api/fire-prediction`

#### Query Parameters

- `areaCode`: A string representing the neighbourhood code or box ID.
- `date`: A string representing the date in the "YYYY-MM-DD" format.

Example query:

```
/api/fire-prediction?areaCode=GM0153&date=2023-01-01
```

#### Response

```json
{
  "areaCode": "string",
  "predictedFires": "number"
}
```

#### Description

Given a `areaCode` and a `date` as query parameters, the API returns the predicted number of chimney fires in the specified municipality on the specified date. It utilizes both spatial and temporal models for the prediction.

### Example Usage

Assuming the API server is running locally on port 3000:

```plaintext
curl -G http://localhost:3000/api/fire-prediction --data-urlencode "areaCode=GM0153" --data-urlencode "date=2023-01-01"
```

#### Example Output

```json
{
  "areaCode": "GM0153",
  "predictedFires": 0.11390911777445555
}
```
