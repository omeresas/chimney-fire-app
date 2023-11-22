# Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in various municipalities given historical and meteorological data, leveraging both spatial and temporal prediction models. The API is designed to be both accurate and efficient, providing quick responses to client requests with minimized computational overhead.

### Prediction Model

- **Spatial Prediction**: Uses precalculated values determined by an R script, which calculates the expected number of fires for different house types in various municipalities.
- **Temporal Prediction**: Incorporates **weather forecast data from Meteoserver API** to forecast the expected number of fires based on temporal factors such as the time of year and current weather conditions **for today and the next ten days**.

The final prediction is computed by multiplying the spatial and temporal predictions together, providing an estimate that considers both the inherent risk of the area and the specific conditions of weather forecast.

## API Endpoint

### `GET /prediction`

#### Query Parameters

- `areaId`: A string representing the neighbourhood code or box ID.

Example query:

```
/prediction?areaId=GM0164
```

#### Response

The response includes a `prediction` array that contains 11 objects, each representing the predicted number of chimney fires for a specific day. The `geoInfo` property returns a GeoJSON object that tells about the geometry of the queried neighbourhood.

```json
{
  "areaId": "string",
  "prediction": [
    {
      "date": "string",
      "numberOfFires": "number"
    }
  ],
  "geoInfo": {
    "type": "Feature",
    "crs": {
      "type": "name",
      "properties": {
        "name": "urn:ogc:def:crs:EPSG::28992"
      }
    },
    "properties": {
            "id": "number",
            "fid": "number",
            "gemeenteco": "string",
            "gemeentena": "string",
            "jaarstatco": "string",
            "jaar": "number"
        },,
    "geometry": {
      "type": "MultiPolygon",
      "coordinates": "array[][][][]"
    }
  }
}
```

#### Description

Given an `areaId`, the API returns the predicted number of chimney fires in the specified municipality for today and the next ten days. It utilizes both spatial and temporal models for the prediction.

### Example Usage

Assuming the API server is running locally on port 3000:

```plaintext
curl -G http://localhost:3000/prediction --data-urlencode "areaId=GM0164"
```

#### Example Output

Note that the number of items in `prediction` array and in `coordinates[][]` array is kept short in below example for readability. In `prediction`, the `date` is in DD-MM-YYYY format.

```json
{
  "areaId": "GM0164",
  "prediction": [
    {
      "date": "10-11-2023",
      "numberOfFires": 0.06
    },
    {
      "date": "11-11-2023",
      "numberOfFires": 0.04
    }
  ],
  "geoInfo": {
    "type": "Feature",
    "crs": {
      "type": "name",
      "properties": {
        "name": "urn:ogc:def:crs:EPSG::28992"
      }
    },
    "properties": {
      "id": 114,
      "fid": 114,
      "gemeenteco": "GM0164",
      "gemeentena": "Hengelo",
      "jaarstatco": "2021GM0164",
      "jaar": 2021
    },
    "geometry": {
      "type": "MultiPolygon",
      "coordinates": [
        [
          [
            [251978.591, 481220.258],
            [251979.382, 481218.495],
            [251983.707, 481220.19]
          ]
        ]
      ]
    }
  }
}
```

## Running the Docker Container via Docker CLI

### 1. Pull the Image

```bash
docker pull oesasdocker/chimney-fire-project:latest
```

### 2. Run Docker Container

The app reads the port from an environment variable `PORT`. If it's not set, it will default to `3000`.

```bash
docker run -e METEOSERVER_API_KEY=YOUR_KEY oesasdocker/chimney-fire-project:latest
```

You can also change the port on the host machine:

- `desiredExternalPort`: This is the port on the host machine that will forward to `desiredAppPort` inside the container.
- `desiredAppPort`: This is the port inside the container on which the app will run.

For example, if you want the app to run on port `8080` inside the container and be accessible on port `4000` of the host machine:

```bash
docker run -p 4000:8080 -e PORT=8080 -e METEOSERVER_API_KEY=YOUR_KEY oesasdocker/chimney-fire-project:latest
```

## Deploying to Azure App Service

When deploying the application to Azure App Service, there are specific settings to be aware of to ensure smooth deployment and operation of the application.

### Application Settings

1. **WEBSITES_PORT Configuration**:
   - In the Azure portal, navigate to your App Service.
   - Go to the `Settings` section and select `Configuration`.
   - Under the `Application settings` tab, add a new key-value pair:
     - **Name**: `WEBSITES_PORT`
     - **Value**: `3000`
       This setting ensures that Azure knows to communicate with the container using port 3000.
2. **API Key Configuration**:
   - Still in the `Application settings` tab of your App Service's `Configuration` section, add another key-value pair for the Meteoserver API key:
     - **Name**: `METEOSERVER_API_KEY`
     - **Value**: `your_meteoserver_api_key`
