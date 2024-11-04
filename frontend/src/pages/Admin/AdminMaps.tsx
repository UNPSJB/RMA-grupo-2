import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Nodo {
  id: number;
  nombre: string
  posicionx: number;
  posiciony: number;
}

const AdminMaps: React.FC<{ 
  onLocationChange: (lat: number, lng: number) => void,
  nodos: Nodo[]
}> = ({ onLocationChange, nodos }) => {
  const initialPosition: [number, number] = [-43.306843, -65.395059];
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(initialPosition);
  
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
    <MapContainer center={initialPosition} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {/* Renderiza un marcador por cada nodo */}
      {nodos.map((nodo) => (
        <Marker key={nodo.id} position={[nodo.posicionx, nodo.posiciony]}>
          <Popup>{nodo.nombre}</Popup>
        </Marker>
      ))}
      <Marker position={markerPosition}>
        <Popup>Ubicación seleccionada.</Popup>
      </Marker>
      <MapClickHandler />
    </MapContainer>
  );
};

export default AdminMaps;

