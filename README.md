# Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in various municipalities given historical and meteorological data, leveraging both spatial and temporal prediction models. The API is designed to be both accurate and efficient, providing quick responses to client requests with minimized computational overhead.

### Prediction Model

- **Spatial Prediction**: Uses precalculated values determined by an R script, which calculates the expected number of fires for different house types in various municipalities.
- **Temporal Prediction**: A mathematical model calculates the expected number of fires based on temporal factors, such as the time of year and weather conditions (e.g., wind chill).

The final prediction is computed by multiplying the spatial and temporal predictions together, providing an estimate that considers both the inherent risk of the area and the specific conditions of the requested date.

## API Endpoint

### `GET /prediction`

#### Query Parameters

- `areaCode`: A string representing the neighbourhood code or box ID.
- `date`: A string representing the date in the "YYYY-MM-DD" format.

Example query:

```
/prediction?areaCode=BU01411000&date=2023-01-01
```

#### Response

The `geoInfo` property returns a GeoJSON object complying to GeoJSON RFC 7946 specifications, such as right hand rule ordering of linear rings, aka order of items in `geometry.coordinates`.

```json
{
  "areaCode": "string",
  "date": "string",
  "predictedFires": "number",
  "geoInfo": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": "array"
    }
  }
}
```

#### Description

Given a `areaCode` and a `date` as query parameters, the API returns the predicted number of chimney fires in the specified municipality on the specified date. It utilizes both spatial and temporal models for the prediction.

### Example Usage

Assuming the API server is running locally on port 3000:

```plaintext
curl -G http://localhost:3000/prediction --data-urlencode "areaCode=BU01411000" --data-urlencode "date=2023-01-01"
```

#### Example Output

```json
{
  "areaCode": "BU01411000",
  "date": "2023-01-01T00:00:00.000Z",
  "predictedFires": 0.00220974867688225,
  "geoInfo": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        //array below is kept short for examplary purposes
        [
          [242557.0675, 486757.7291],
          [242550.2459, 486801.7022],
          [242529.9823, 486799.9199],
          [242586.9057, 486603.8248],
          [242573.4457, 486669.1897],
          [242557.0675, 486757.7291]
        ]
      ]
    }
  }
}
```

## Running the Docker Container

### 1. Pull the Image

```bash
docker pull oesasdocker/chimney-fire-project:latest
```

### 2. Run Docker Container

The app reads the port from an environment variable `PORT`. If it's not set, it will default to `3000`. When you run the Docker container, you can specify the port on which you want the app to run by setting the `PORT` environment variable:

```bash
docker run -p desiredExternalPort:desiredAppPort -e PORT=desiredAppPort oesasdocker/chimney-fire-project:latest
```

- `desiredExternalPort`: This is the port on the host machine that will forward to `desiredAppPort` inside the container.
- `desiredAppPort`: This is the port inside the container on which the app will run.

For example, if you want the app to run on port `8080` inside the container and be accessible on port `4000` of the host machine:

```bash
docker run -p 4000:8080 -e PORT=8080 oesasdocker/chimney-fire-project:latest
```
