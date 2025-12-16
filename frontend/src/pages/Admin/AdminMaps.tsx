import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTrash, faCog } from '@fortawesome/free-solid-svg-icons';
import { nodoDefaultIcon } from '../../utils/nodoIcon';
import L from 'leaflet';

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
  onEdit?: (nodo: Nodo) => void,
  onDelete?: (nodo: Nodo) => void,
  readOnly?: boolean,
  externalPosition?: { lat: number; lng: number } | null,
  isEditMode?: boolean,
  editingNodoId?: number | null,
}> = ({ onLocationChange, nodos, onEdit, onDelete, readOnly = false, externalPosition = null, isEditMode = false, editingNodoId = null }) => {
  const initialPosition: [number, number] = [-43.306843, -65.395059];
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(initialPosition);
  const [hasClicked, setHasClicked] = useState(false);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditting, setIsEditting] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialPosition);
  const mapRef = useRef<L.Map | null>(null);

  // Actualizar la posición del marcador cuando cambia la posición externa
  useEffect(() => {
    if (externalPosition) {
      setMarkerPosition([externalPosition.lat, externalPosition.lng]);
      setHasClicked(true);
    }
  }, [externalPosition]);

  // Centrar el mapa en el nodo que se está editando
  useEffect(() => {
    if (isEditMode && editingNodoId) {
      const nodoEditando = nodos.find(n => n.id === editingNodoId);
      if (nodoEditando && mapRef.current) {
        const newCenter: [number, number] = [nodoEditando.posicionx, nodoEditando.posiciony];
        setMapCenter(newCenter);
        mapRef.current.setView(newCenter, 15);
      }
      // Limpiar el marcador temporal cuando entramos en modo edición
      setHasClicked(false);
    }
  }, [isEditMode, editingNodoId, nodos]);

  // Efecto para manejar ESC y cerrar el modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isModalOpen]);

  const MapClickHandler = () => {
    const map = useMapEvents({
      click(e) {
        // Si el mapa es de solo lectura, no permitir clicks
        if (readOnly) {
          return;
        }

        // Si está en modo edición, usar el clic para reposicionar el nodo
        if (isEditMode && editingNodoId) {
          const { lat, lng } = e.latlng;
          onLocationChange(lat, lng);
          return;
        }

        // Si NO está en modo edición, permitir crear marcador temporal
        if (!isEditMode) {
          const { lat, lng } = e.latlng;
          setMarkerPosition([lat, lng]);
          setHasClicked(true);
          onLocationChange(lat, lng);
        }
      }
    });

    // Guardar referencia al mapa y controlar el dragging
    useEffect(() => {
      mapRef.current = map;

      // En modo edición, deshabilitar el arrastre del mapa para permitir arrastrar el marcador
      if (isEditMode && editingNodoId) {
        map.dragging.disable();
        map.scrollWheelZoom.enable(); // Mantener el zoom con scroll
        map.doubleClickZoom.enable(); // Mantener el doble click para zoom
      } else {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
      }
    }, [map, isEditMode, editingNodoId]);

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
      onEdit?.(updatedNodo);
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
      <MapContainer
        center={initialPosition}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {/* Renderiza un marcador por cada nodo */}
        {nodos
          .filter((nodo) => {
            // Si está en modo edición, solo mostrar el nodo que se está editando
            if (isEditMode && editingNodoId) {
              console.log('Filtro activo - Modo edición:', isEditMode, 'ID editando:', editingNodoId, 'Nodo actual:', nodo.id);
              return nodo.id === editingNodoId;
            }
            // Si no está en modo edición, mostrar todos los nodos
            return true;
          })
          .map((nodo) => {
            // Verificar si este nodo está siendo editado
            const isBeingEdited = isEditMode && editingNodoId === nodo.id;
            console.log('Renderizando nodo:', nodo.id, 'isBeingEdited:', isBeingEdited);

            return (
              <Marker
                key={`${nodo.id}-${nodo.posicionx}-${nodo.posiciony}`}
                position={[nodo.posicionx, nodo.posiciony]}
                icon={nodoDefaultIcon}
                draggable={isBeingEdited}
                eventHandlers={{
                  drag: (e) => {
                    if (isBeingEdited) {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      onLocationChange(position.lat, position.lng);
                    }
                  },
                  dragend: (e) => {
                    if (isBeingEdited) {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      onLocationChange(position.lat, position.lng);
                    }
                  }
                }}
              >
                <Popup autoClose={false} closeOnClick={false}>
                  <strong>{nodo.nombre}</strong>
                  {isBeingEdited && (
                    <div style={{ marginTop: '5px', padding: '8px', backgroundColor: '#3C50E0', borderRadius: '5px' }}>
                      <p style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '13px' }}>
                        🖱️ Modo Edición Activo
                      </p>
                      <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '12px' }}>
                        ✓ Arrastra este marcador para cambiar la ubicación
                      </p>
                      <p style={{ color: 'white', margin: '3px 0 0 0', fontSize: '11px', opacity: 0.9 }}>
                        ✓ Usa la rueda del mouse para hacer zoom
                      </p>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", gap: "10px" }}>
                    <button
                      onClick={() => openModal(nodo)}
                      title="Ver información"
                      className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600 focus:outline-none"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    {onEdit && !isBeingEdited && (
                      <button
                        onClick={() => onEdit(nodo)}
                        title="Editar nodo"
                        className="bg-yellow-500 text-white rounded p-2 hover:bg-yellow-600 focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faCog} />
                      </button>
                    )}
                    {onDelete && !isBeingEdited && (
                      <button
                        onClick={() => onDelete(nodo)}
                        title="Eliminar nodo"
                        className="bg-red-500 text-white rounded p-2 hover:bg-red-600 focus:outline-none"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        {/* Solo muestra el marcador de posición seleccionada después de un clic y cuando NO está en modo edición */}
        {hasClicked && !isEditMode && (
          <Marker position={markerPosition} icon={nodoDefaultIcon}>
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
