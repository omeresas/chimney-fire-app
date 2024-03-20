import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import mapData from '../data/gemeente.json';
import 'leaflet/dist/leaflet.css';

const MapComponent = () => {
  const [fireRiskData, setFireRiskData] = useState({});
  const mapRef = useRef();

  useEffect(() => {
    const fetchFireRiskData = async () => {
      try {
        const response = await fetch(
          'http://localhost:3000/prediction/gemeente'
        );
        const json = await response.json();
        const formattedData = json.data.reduce((acc, item) => {
          acc[item.areaId] = item.prediction;
          return acc;
        }, {});
        setFireRiskData(formattedData);
      } catch (error) {
        console.error('Failed to fetch fire risk data:', error);
      }
    };

    fetchFireRiskData();
  }, []);

  const onEachFeature = (feature, layer) => {
    const cityName = feature.properties.gemeentena;
    const cityCode = feature.properties.gemeenteco;

    let popupContent = `<h2>${cityName}</h2><p>Code: ${cityCode}</p>`;

    layer.bindPopup(popupContent);
  };

  const corner1 = L.latLng(52.520117, 7.224884);
  const corner2 = L.latLng(52.087204, 6.266481);
  const twenteCenter = L.latLng(52.223399, 6.868496);
  const bounds = L.latLngBounds(corner1, corner2);

  return (
    <MapContainer
      style={{ height: '100vh' }}
      center={twenteCenter}
      zoom={11}
      minZoom={11}
      scrollWheelZoom={false}
      maxBounds={bounds}
      maxBoundsViscosity={0.7}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={mapData.features} onEachFeature={onEachFeature} />
    </MapContainer>
  );
};

export default MapComponent;
