import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
}

const AdminMaps: React.FC<{ 
  onLocationChange: (lat: number, lng: number) => void,
  nodos: Nodo[]
}> = ({ onLocationChange, nodos }) => {
  const initialPosition: [number, number] = [-43.306843, -65.395059];
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(initialPosition);
  const [hasClicked, setHasClicked] = useState(false);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setHasClicked(true);
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
           <Popup>
            <div>
              <strong>{nodo.nombre}</strong>
              <p><strong>Latitud:</strong> {nodo.posicionx}</p>
              <p><strong >Longitud:</strong> {nodo.posiciony}</p>
              <p><strong>Descripción:</strong><p> {nodo.descripcion}</p></p>
            </div>
          </Popup>   
        </Marker>
      ))}
      {/* Solo muestra el marcador de posición seleccionada después de un clic */}
      {hasClicked && (
        <Marker position={markerPosition}>
          <Popup>Ubicación seleccionada.</Popup>
        </Marker>
      )}
      <MapClickHandler />
    </MapContainer>
  );
};
export default AdminMaps;