import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrash, faCog } from '@fortawesome/free-solid-svg-icons';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
}

const AdminMaps: React.FC<{ 
  onLocationChange: (lat: number, lng: number) => void,
  nodos: Nodo[],
  onEdit: (nodo: Nodo) => void,
  onDelete: (nodo: Nodo) => void,
}> = ({ onLocationChange, nodos, onEdit, onDelete }) => {
  const initialPosition: [number, number] = [-43.306843, -65.395059];
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(initialPosition);
  const [hasClicked, setHasClicked] = useState(false);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isEditting, setIsEditting] = useState(false);
  const MapClickHandler = () => {
    debugger;
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setHasClicked(true);
        if(isEditting )
          handleLocationUpdate(lat, lng);
        else
          onLocationChange(lat, lng); 
      }
    });
    return null;
  };

  const openModal = (nodo: Nodo) => {
    setSelectedNodo(nodo);
    setIsModalOpen(true); 
    setMarkerPosition([nodo.posicionx, nodo.posiciony]); // Coloca el marcador en la posición del nodo
    setHasClicked(true);     
  };

  const handleLocationUpdate = (lat: number, lng: number) => {
    if (selectedNodo) {
      setIsEditting(true);
      const updatedNodo = { ...selectedNodo, posicionx: lat, posiciony: lng };
      onEdit(updatedNodo);
      setMarkerPosition([lat, lng]);
      setSelectedNodo(updatedNodo); 
    }
  };

  const closeModal = () => {
    setSelectedNodo(null);
    setIsModalOpen(false);
  };
{/**
  const handleEdit = (nodo:Nodo) =>{
    onEdit(nodo);
    editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
*/}

  return (
    <>
      <MapContainer center={initialPosition} zoom={13} style={{ height: "400px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {/* Renderiza un marcador por cada nodo */}
        {nodos.map((nodo) => (
          <Marker key={nodo.id} position={[nodo.posicionx, nodo.posiciony]}>
            <Popup>
              <strong>{nodo.nombre}</strong>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", gap: "10px" }}>
                <button
                  onClick={() => openModal(nodo)}
                  title="Ver información"
                  className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button
                  onClick={() => onEdit(nodo)}
                  title="Editar nodo"
                  className="bg-yellow-500 text-white rounded p-2 hover:bg-yellow-600 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faCog} />
                </button>
                <button
                  onClick={() => onDelete(nodo)}
                  title="Eliminar nodo"
                  className="bg-red-500 text-white rounded p-2 hover:bg-red-600 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
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

      {selectedNodo && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          style={{
            overlay: {
              backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo oscuro pero más transparente
              zIndex: 1000, //  modal al frente
            },
            content: {
              backgroundColor: "#2c2c2c", // Fondo oscuro para el modal
              color: "white", // Texto blanco
              maxWidth: "400px", // Hacer el modal más pequeño
              width: "90%", // Hacer el modal más ajustado
              margin: "auto",
              padding: "20px",
              borderRadius: "10px",
              zIndex: 1001, // Asegurarse de que el contenido del modal esté por encima del overlay
            },
          }}
          contentLabel="Información del nodo"
        >
          <h2>{selectedNodo.nombre}</h2>
          <p><strong>Latitud:</strong> {selectedNodo.posicionx}</p>
          <p><strong>Longitud:</strong> {selectedNodo.posiciony}</p>
          <p><strong>Descripción:</strong> {selectedNodo.descripcion}</p>
          <button 
            onClick={closeModal} 
            style={{ 
              marginTop: "20px", 
              padding: "10px", 
              background: "gray", 
              color: "white", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer" 
            }}
          >
            Cerrar
          </button>
        </Modal>
      )}
      
    </>
  );
};

export default AdminMaps;
