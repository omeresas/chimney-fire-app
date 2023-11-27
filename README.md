# Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in various municipalities, neighborhoods, and blocks, leveraging spatial and temporal prediction models. It provides efficient and accurate predictions based on spatial and temporal data.

### Prediction Model

- **Spatial Terms**: Uses precalculated values based on house types in different areas.
- **Temporal Terms**: Incorporates weather forecast data to forecast the expected number of fires for today and the next ten days.

## API Endpoints

### Individual Area Prediction

#### `GET /prediction/gemeente/:gemeenteId`, `/prediction/wijk/:wijkId`, `/prediction/buurt/:buurtId`

These endpoints return the fire prediction for a specific municipality (`gemeente`), neighborhood (`wijk`), or block (`buurt`).

#### Query Parameters

- `includeGeoInfo` (optional): Set to `false` to omit the `geoInfo` property in the response.

#### Response

The response includes a `prediction` array for the specified area and, optionally, the `geoInfo` property providing GeoJSON geometry data.

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

### Bulk Area Prediction

#### `GET /prediction/gemeente, /prediction/wijk, /prediction/buurt`

These endpoints return fire predictions for all areas of the specified type.

#### Query Parameters

- `includeGeoInfo` (optional): Set to `false` to omit the `geoInfo` property in the response.

#### Response

The response is an array of objects, each containing the prediction array for an area and, optionally, the geoInfo property.

```json
[
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
  },
]
```

### Example Usage

Request for a specific municipality with GeoInfo:

```plaintext
curl -G http://localhost:3000/prediction/gemeente/GM0164
```

Request for all municipalities without GeoInfo:

```plaintext
curl -G http://localhost:3000/prediction/gemeente --data-urlencode "includeGeoInfo=false"
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
