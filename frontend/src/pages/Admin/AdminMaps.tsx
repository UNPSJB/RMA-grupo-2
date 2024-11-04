import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AdminMaps: React.FC<{ onLocationChange: (lat: number, lng: number) => void }> = ({ onLocationChange }) => {
  const position: [number, number] = [-43.306843, -65.395059];
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);
  
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        onLocationChange(lat, lng); 
      }
    });
    return null;
  };

  return (
    <MapContainer center={position} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={markerPosition}>
        <Popup>
          Ubicación seleccionada.
        </Popup>
      </Marker>
      <MapClickHandler />
    </MapContainer>
  );
};

export default AdminMaps;
