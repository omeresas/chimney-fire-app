# Chimney Fire Prediction API

## Overview

This API predicts the expected number of chimney fires in

- 14 gemeente (municipalities),
- 120 wijken (neighborhoods),
- 517 buurten (blocks)
- 6268 500x500 meter boxes

in Twente, leveraging spatial and temporal prediction models. It provides efficient and accurate predictions based on spatial and temporal data.

### Prediction Model

- **Spatial Terms**: Uses precalculated values based on house types in different areas.
- **Temporal Terms**: Incorporates weather forecast data to forecast the expected number of fires for today and the next ten days. The weather forecast is fetched at the start of the application and then at **0:35, 7:35, 12:35 and 18:35** every day.

## API Endpoints

### Aggregate Area Prediction

- `GET /prediction/gemeente`
- `GET /prediction/wijk`
- `GET /prediction/buurt`
- `GET /prediction/box`

These endpoints return fire predictions for all areas of the specified type, as an array of the objects in the structure below. The optional query parameter **`includeGeoInfo`** can be set to `true` to include the `geoInfo` property in the response, like in the example below.

- `GET /prediction/gemeente?includeGeoInfo=true`

The response consists of below keys:

- **`lastWeatherFetchTimestamp`**: The timestamp of the last weather forecast fetch from Meteoserver API.
- **`predictions`**: Array of objects, each containing the `prediction` array for that area (gemeente, wijk, buurt or box) and, optionally, the `geoInfo` property. `areaId` is the CBS code of that area. The `prediction` array contains the following keys:
  - **`date`**: The date of the prediction.
  - **`numberOfFires`**: The expected number of fires.
  - **`lowerBoundOfFires`**: The lower bound of the 95% confidence interval. In other words, the model is 95% confident that the actual number of fires will be greater than or equal to this value.
  - **`upperBoundOfFires`**: The upper bound of the 95% confidence interval. In other words, the model is 95% confident that the actual number of fires will be less than or equal to this value.
- **`geoInfo`**: GeoJSON geometry data for the area, if requested.

An example response that includes the `geoInfo` property is given below:

```json
{
  "lastWeatherFetchTimestamp": "string",
  "predictions": [
    {
      "areaId": "string",
      "prediction": [
        {
          "date": "string",
          "numberOfFires": "string",
          "lowerBoundOfFires": "string",
          "upperBoundOfFires": "string"
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
        },
        "geometry": {
          "type": "MultiPolygon",
          "coordinates": "array[][][][]"
        }
      }
    }
  ]
}
```

Note that **`geoInfo.properties`** for a box is different from that of a gemeente, wijk or buurt and is given below:

```json
{
  "properties": {
    "gid": "number",
    "objectid": "number",
    "c28992r500": "string"
  }
}
```

### Individual Area Prediction

- `GET /prediction/gemeente/:gemeenteId`
- `GET /prediction/wijk/:wijkId`
- `GET /prediction/buurt/:buurtId`
- `GET /prediction/box/:boxId`

These endpoints return the fire prediction for a specific gemeente, wijk, buurt or box, identified by their CBS codes. The optional query parameter **`includeGeoInfo`** can be set to `true` to include the `geoInfo` property in the response.

The response includes a `prediction` array for the specified area and, optionally, the `geoInfo` property providing GeoJSON geometry data.

```json
{
  "lastWeatherFetchTimestamp": "string",
  "predictions": {
    "areaId": "string",
    "prediction": [
      {
        "date": "string",
        "numberOfFires": "string",
        "lowerBoundOfFires": "string",
        "upperBoundOfFires": "string"
      },
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
}
```

##### Example Usage

- Request for all gemeente:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/gemeente
```

- Request for all buurten including GeoInfo:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/buurt?includeGeoInfo=true
```

- Request for a specific gemeente:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/gemeente/GM0153
```

- Request for a specific wijk including GeoInfo:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/wijk/WK015300?includeGeoInfo=true
```

- Request for all boxes, this is the **largest response**, which is **5.76 MB** and takes **1.7 seconds** from Azure domain:

```plaintext
GET https://chimneyfireproject.azurewebsites.net/prediction/box
```

## Structure of the Excel Files Used for Model Refitting

**Example Excel Files**: Please refer to the [excel](./backend/src/r/r-data/excel/) directory for the existing Excel files used calculate the current model parameters.

Before explaining how to update the prediction model, it is necessary to understand the structure of the data digested by the model. These are **the four Excel files** that are read by the application, therefore it is necessary to use **the same exact names with correct capitalization** for the Excel files, the columns in the Excel files and the possible values in the columns. The Excel files are as follows:

1. **kro.xlsx**: Contains the building data. The necessary columns are:

   - **bouwjaar**: The year the building was built.
   - **status**: The status of the building indicates whether the building is currently being used. The app uses rows where the status is equal to one of below values:
     - `Pand in gebruik`
     - `Pand in gebruik (niet ingemeten)`
   - **gebrklasse**: The usage class of the building. The app differentiates between houses that are "free-standing or semi-detached (2 under 1)" or not. To do so, the app checks whether the `gebrklasse` column contains one of the following values:
     - `2 onder 1 kap doelgroepwoning`
     - `2 onder 1 kap recreatiewoning`
     - `2 onder 1 kap woning`
     - `Vrijstaande doelgroepwoning`
     - `Vrijstaande recreatiewoning`
     - `Vrijstaande woning`
   - **x**: The x-coordinate of the building in RD Amersfoort coordinate system.
   - **y**: The y-coordinate of the building in RD Amersfoort coordinate system.

2. **incident.xlsx**: Contains the chimney fire incident data. The necessary columns are:

   - **Year**: The year of the incident.
   - **Day**: The day of the incident, from 1 to 365.
   - **Xcoordinate**: The x-coordinate of the incident location in RD Amersfoort coordinate system.
   - **Ycoordinate**: The y-coordinate of the incident location in RD Amersfoort coordinate system.
   - **bouwjaar**: The year the building was built.
   - **gebrklasse**: The usage class of the building. The app looks for the same values mentioned in the `kro.xlsx` file.

3. **windchill.xlsx**: Contains the wind chill data. The first row should contain the column names, such as `WC2004`, `WC2005`, etc. Each column, from the second row until and including 366th row, should contain the average wind chill value for the corresponding day of the year. Each cell (each day) uses decimal comma as the decimal separator and calculated using the formula below:

   ```plaintext
   Wind chill = 13.12 + 0.6215 * T - 11.37 * V^0.16 + 0.3965 * T * V^0.16
   ```

   where:

   - **T**: The temperature in Celsius on that day.
   - **V**: The wind speed in km/h on that day.

4. **windspeed.xlsx**: Contains the wind speed data. The first row should contain the column names, such as `FG2004`, `FG2005`, etc. Each column, from the second row until and including 366th row, should contain the average wind speed value for the corresponding day of the year. Each cell (each day) uses decimal comma as the decimal separator and the wind speed should be in km/h.

## API Interactions for Model Refitting

### 1. Uploading the Excel Files

The Excel files can be uploaded to the API using the following endpoint:

- `PUT /model/upload`: With request body as `multipart/form-data` and the below key-value pair:

  - **`excelFiles`**: The four Excel files described above.

The successful response will be a JSON object with the following structure:

```json
{
  "message": "(4) Files uploaded successfully."
}
```

### 2. Updating Building Data

The next step is to make a request to trigger the app to read the new building data. This request will start an R script inside the app that reads `kro.xlsx`:

- `POST /model/update`: With an empty request body.

Depending on the computation power allocated to the the Azure app container, this process may take from 10 minutes to a couple of hours. The successful response will be a JSON object with the following content:

```json
{
  "message": "House count updating process completed."
}
```

### 3. Refitting the Model

The final step is to make another request to trigger the app to read all the four Excel files and re-calculate the parameters of the prediction model. This request will start an R script inside the app that reads all the Excel files:

- `POST /model/refit`: With an empty request body.

Depending on the computation power allocated to the the Azure app container, this process may take from 10 minutes to a couple of hours. The successful response will be a JSON object with the following content:

```json
{
  "message": "Model refitting process completed."
}
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
3. **Health Check Endpoint**:
   - The `/health` endpoint can be used by Azure to determine the health of the application. If the endpoint returns a status code of 200, the application is considered healthy.
