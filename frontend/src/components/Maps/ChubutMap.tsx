import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ChubutMap.css'; // Asegúrate de que la ruta sea correcta


const customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});


interface Nodo {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
}

const nodos: Nodo[] = [
  { id: 1, nombre: 'Cuenca Sagmata', lat: -43.538333, lng: -66.4 }, // Arroyo Saguamanta
  { id: 2, nombre: 'Boca Toma', lat: -43.4400, lng: -65.9100 }, // Boca Toma
];




const ChubutMap: React.FC = () => {
  return (
    <MapContainer center={[-43.3, -65.1]} zoom={7} className="leaflet-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {nodos.map((nodo) => (
        <Marker key={nodo.id} position={[nodo.lat, nodo.lng] } icon={customIcon}>
          <Popup>{nodo.nombre}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ChubutMap;
