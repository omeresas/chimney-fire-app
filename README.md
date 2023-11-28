# Chimney Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in various municipalities (gemeente), neighborhoods (wijk), and blocks (buurt) in Twente, leveraging spatial and temporal prediction models. It provides efficient and accurate predictions based on spatial and temporal data. It is currently hosted on **chimneyfireproject.azurewebsites.net** domain.

### Prediction Model

- **Spatial Terms**: Uses precalculated values based on house types in different areas.
- **Temporal Terms**: Incorporates weather forecast data to forecast the expected number of fires for today and the next ten days. The weather forecast is fetched every hour.

## API Endpoints

### Aggregate Area Prediction

- `GET /prediction/gemeente`
- `GET /prediction/wijk`
- `GET /prediction/buurt`

These endpoints return fire predictions for all areas of the specified type, as an array of the objects in the structure below. The optional query parameter `excludeGeoInfo` can be set to `true` to omit the `geoInfo` property in the response.

#### Response

The response is an array of objects, each containing the `prediction` array for that area (geemente, wijk or buurt) and, optionally, the `geoInfo` property. `areaId` is the CBS code of that area.

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

### Individual Area Prediction

- `GET /prediction/gemeente/:gemeenteId`
- `GET /prediction/wijk/:wijkId`
- `GET /prediction/buurt/:buurtId`

These endpoints return the fire prediction for a specific gemeente, wijk, or buurt, identified by their CBS codes. The optional query parameter `excludeGeoInfo` can be set to `true` to omit the `geoInfo` property in the response.

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

## Example Usage

- Request for all gemeente:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/gemeente
```

- Request for all buurten without GeoInfo:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/buurt?excludeGeoInfo=true
```

- Request for a specific gemeente:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/gemeente/GM0153
```

- Request for a specific wijk without GeoInfo:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/wijk/WK015300?excludeGeoInfo=true
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
