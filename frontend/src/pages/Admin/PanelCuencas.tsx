import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableCuencas from '../../components/Tables/TableCuencas';
import { MapContainer, TileLayer, Polygon, Popup, Polyline, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { createNodoIcon, nodoAvailableIcon, nodoAssignedIcon } from '../../utils/nodoIcon';
import ToastContainer, { ToastData } from '../../components/Toast/ToastContainer';
import ConfirmDialog, { ConfirmType } from '../../components/Modal/ConfirmDialog';

interface Cuenca {
  id: number;
  nombre: string;
  descripcion: string;
  poligono: {
    type: string;
    coordinates: number[][][];
  };
  nodos?: Nodo[];
}

interface Nodo {
  id?: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
  cuenca_id?: number;
}

const PanelCuencas = () => {
  const [cuencas, setCuencas] = useState<Cuenca[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
  });
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [haySuperposicion, setHaySuperposicion] = useState(false);

  // Estados para gestión de nodos
  const [nodosCuenca, setNodosCuenca] = useState<Nodo[]>([]);
  const [nodosOriginalesCuenca, setNodosOriginalesCuenca] = useState<Nodo[]>([]); // Nodos originales para detectar desvinculaciones
  const [todosNodos, setTodosNodos] = useState<Nodo[]>([]); // Todos los nodos disponibles
  const [activeTab, setActiveTab] = useState<'cuenca' | 'nodos'>('cuenca');
  const [nodoParaReubicar, setNodoParaReubicar] = useState<Nodo | null>(null); // Nodo que se está reubicando
  const [isCreatingNode, setIsCreatingNode] = useState(false); // Modo crear nodo

  // Sistema de deshacer
  const [historialNodos, setHistorialNodos] = useState<Nodo[][]>([]);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);

  // Estados para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  // Función para mostrar toast
  const mostrarToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removerToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const obtenerCuencas = async () => {
    try {
      const response = await axios.get('http://localhost:8000/cuencas');
      setCuencas(response.data);
    } catch (error) {
      console.error('Error al obtener las cuencas:', error);
      mostrarToast('error', 'No se pudieron obtener las cuencas');
    }
  };

  const obtenerTodosNodosInicial = async () => {
    try {
      const response = await axios.get('http://localhost:8000/nodos');
      setTodosNodos(response.data);
    } catch (error) {
      console.error('Error al obtener todos los nodos:', error);
    }
  };

  useEffect(() => {
    obtenerCuencas();
    obtenerTodosNodosInicial();
  }, []);

  // Efecto para manejar Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && activeTab === 'nodos' && isModalOpen) {
        e.preventDefault();
        handleDeshacer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historialNodos, activeTab, isModalOpen]);

  // Efecto para manejar ESC y cerrar el modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isModalOpen]);

  // Obtener todos los nodos cuando se activa la pestaña de nodos
  // Esto garantiza que siempre tengamos la lista más actualizada
  useEffect(() => {
    if (activeTab === 'nodos' && isModalOpen) {
      obtenerTodosNodos();
    }
  }, [activeTab, isModalOpen]);

  const obtenerNodosCuenca = async (cuencaId: string, guardarOriginales: boolean = false) => {
    try {
      const response = await axios.get(`http://localhost:8000/cuenca/${cuencaId}`);
      const nodos = response.data.nodos || [];
      setNodosCuenca(nodos);
      // Si se solicita, guardar copia de los nodos originales para detectar cambios
      if (guardarOriginales) {
        setNodosOriginalesCuenca(JSON.parse(JSON.stringify(nodos)));
      }
    } catch (error) {
      console.error('Error al obtener nodos de la cuenca:', error);
    }
  };

  const obtenerTodosNodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/nodos');
      setTodosNodos(response.data);
    } catch (error) {
      console.error('Error al obtener todos los nodos:', error);
    }
  };

  // Guardar estado en historial
  const guardarEnHistorial = () => {
    setHistorialNodos(prev => [...prev, JSON.parse(JSON.stringify(nodosCuenca))]);
    setPuedeDeshacer(true);
  };

  // Deshacer última acción
  const handleDeshacer = () => {
    if (historialNodos.length === 0) {
      mostrarToast('error', 'No hay acciones para deshacer');
      return;
    }

    const ultimoEstado = historialNodos[historialNodos.length - 1];
    setNodosCuenca(JSON.parse(JSON.stringify(ultimoEstado)));
    setHistorialNodos(prev => prev.slice(0, -1));
    setPuedeDeshacer(historialNodos.length > 1);
    mostrarToast('success', 'Acción deshecha');
  };

  const handleOpenModal = async (cuenca?: Cuenca) => {
    // SIEMPRE recargar la lista global de nodos desde el backend
    // Esto asegura que veamos los nodos más recientes (desvinculados de otras cuencas, etc.)
    await obtenerTodosNodos();

    if (cuenca) {
      setFormData({
        id: cuenca.id.toString(),
        nombre: cuenca.nombre,
        descripcion: cuenca.descripcion || '',
      });
      // Convertir coordenadas GeoJSON a formato Leaflet
      const coords = cuenca.poligono.coordinates[0].map(coord => [coord[1], coord[0]] as [number, number]);
      console.log('Polígono cargado para cuenca:', cuenca.nombre, 'Puntos:', coords.length);
      setPolygonPoints(coords);
      setIsEdit(true);
      // Obtener nodos de la cuenca y guardar originales para detectar cambios
      await obtenerNodosCuenca(cuenca.id.toString(), true);
    } else {
      setFormData({
        id: '',
        nombre: '',
        descripcion: '',
      });
      setPolygonPoints([]);
      setNodosCuenca([]);
      setNodosOriginalesCuenca([]);
      setIsEdit(false);
    }
    // Resetear historial al abrir modal
    setHistorialNodos([]);
    setPuedeDeshacer(false);
    setIsModalOpen(true);
    setIsDrawingMode(false);
    setActiveTab('cuenca');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ id: '', nombre: '', descripcion: '' });
    setPolygonPoints([]);
    setNodosCuenca([]);
    setNodosOriginalesCuenca([]);
    setIsDrawingMode(false);
    setActiveTab('cuenca');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función auxiliar para guardar los cambios de nodos (usada tanto desde pestaña Cuenca como Nodos)
  const guardarCambiosCuenca = async () => {
    if (polygonPoints.length < 3) {
      mostrarToast('error', 'Debe dibujar un polígono con al menos 3 puntos');
      return false;
    }

    if (haySuperposicion) {
      mostrarToast('error', 'El polígono se superpone con una cuenca existente. Por favor, ajusta el área.');
      return false;
    }

    try {
      // Convertir coordenadas Leaflet a formato GeoJSON (cerrar el polígono)
      const geoJsonCoords = [...polygonPoints.map(point => [point[1], point[0]])];
      // Cerrar el polígono si no está cerrado
      if (geoJsonCoords[0][0] !== geoJsonCoords[geoJsonCoords.length - 1][0] ||
          geoJsonCoords[0][1] !== geoJsonCoords[geoJsonCoords.length - 1][1]) {
        geoJsonCoords.push(geoJsonCoords[0]);
      }

      const poligonoObj = {
        type: 'Polygon',
        coordinates: [geoJsonCoords]
      };

      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        poligono: poligonoObj,
      };

      if (isEdit) {
        // Actualizar la cuenca
        await axios.put(`http://localhost:8000/cuenca/${formData.id}`, data);

        // Detectar nodos que fueron desvinculados (estaban en originales pero ya no están en nodosCuenca)
        const nodosDesvinculados = nodosOriginalesCuenca.filter(
          nodoOriginal => !nodosCuenca.some(n => n.id === nodoOriginal.id)
        );

        // Desvincular los nodos removidos
        if (nodosDesvinculados.length > 0) {
          for (const nodo of nodosDesvinculados) {
            if (nodo.id) {
              try {
                const nodoData = {
                  nombre: nodo.nombre,
                  descripcion: nodo.descripcion,
                  posicionx: nodo.posicionx,
                  posiciony: nodo.posiciony,
                  cuenca_id: null,
                };
                await axios.put(`http://localhost:8000/nodo/${nodo.id}`, nodoData);
              } catch (error) {
                console.error(`Error al desvincular nodo ${nodo.id}:`, error);
              }
            }
          }
        }

        // Actualizar todos los nodos asignados a esta cuenca
        // Esto incluye nuevas asignaciones y cambios de posición
        if (nodosCuenca.length > 0) {
          for (const nodo of nodosCuenca) {
            if (nodo.id) {
              try {
                const nodoData = {
                  nombre: nodo.nombre,
                  descripcion: nodo.descripcion,
                  posicionx: nodo.posicionx,
                  posiciony: nodo.posiciony,
                  cuenca_id: parseInt(formData.id),
                };
                await axios.put(`http://localhost:8000/nodo/${nodo.id}`, nodoData);
              } catch (error) {
                console.error(`Error al actualizar nodo ${nodo.id}:`, error);
              }
            }
          }
        }

        mostrarToast('success', 'Cuenca y nodos actualizados exitosamente');
      } else {
        // Crear la cuenca
        const response = await axios.post('http://localhost:8000/cuenca', data);
        const nuevaCuencaId = response.data.id;

        // Si hay nodos asignados temporalmente, vincularlos a la cuenca recién creada
        if (nodosCuenca.length > 0) {
          mostrarToast('info', `Vinculando ${nodosCuenca.length} nodo(s) a la cuenca...`);

          for (const nodo of nodosCuenca) {
            if (nodo.id) {
              try {
                const nodoData = {
                  nombre: nodo.nombre,
                  descripcion: nodo.descripcion,
                  posicionx: nodo.posicionx,
                  posiciony: nodo.posiciony,
                  cuenca_id: nuevaCuencaId,
                };
                await axios.put(`http://localhost:8000/nodo/${nodo.id}`, nodoData);
              } catch (error) {
                console.error(`Error al vincular nodo ${nodo.id}:`, error);
              }
            }
          }

          mostrarToast('success', `Cuenca creada exitosamente con ${nodosCuenca.length} nodo(s) vinculado(s)`);
        } else {
          mostrarToast('success', 'Cuenca creada exitosamente');
        }
      }

      handleCloseModal();
      // Recargar cuencas Y todos los nodos para reflejar los cambios globalmente
      obtenerCuencas();
      obtenerTodosNodosInicial();
      return true;
    } catch (error: any) {
      console.error('Error al guardar la cuenca:', error);
      const errorMsg = error.response?.data?.detail || 'Error al guardar la cuenca';
      mostrarToast('error', errorMsg);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await guardarCambiosCuenca();
  };

  // Guardar cambios desde la pestaña de Nodos
  const handleGuardarDesdeNodos = async () => {
    await guardarCambiosCuenca();
  };

  const handleDelete = async (cuencaId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cuenca',
      message: '¿Está seguro que desea eliminar esta cuenca?\n\nSe eliminarán también todos los nodos asociados.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await axios.delete(`http://localhost:8000/cuenca/${cuencaId}`);
          mostrarToast('success', 'Cuenca eliminada exitosamente');
          obtenerCuencas();
        } catch (error: any) {
          console.error('Error al eliminar la cuenca:', error);
          const errorMsg = error.response?.data?.detail || 'Error al eliminar la cuenca';
          mostrarToast('error', errorMsg);
        }
      },
    });
  };

  const initialPosition: [number, number] = [-43.306843, -65.395059];

  // Convertir coordenadas GeoJSON (lng, lat) a formato Leaflet (lat, lng)
  const convertCoordinates = (coordinates: number[][][]): [number, number][][] => {
    return coordinates.map((polygon) =>
      polygon.map((coord) => [coord[1], coord[0]] as [number, number])
    );
  };

  // Función para verificar si un punto está dentro de un polígono (Ray casting algorithm)
  const puntoEnPoligono = (punto: [number, number], poligonoCoords: [number, number][]): boolean => {
    const [x, y] = punto;
    const n = poligonoCoords.length;
    let dentro = false;

    let j = n - 1;
    for (let i = 0; i < n; i++) {
      const [xi, yi] = poligonoCoords[i];
      const [xj, yj] = poligonoCoords[j];

      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        dentro = !dentro;
      }

      j = i;
    }

    return dentro;
  };

  // Función para verificar si dos segmentos se cruzan
  const segmentosSeCruzan = (
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    p4: [number, number]
  ): boolean => {
    const ccw = (A: [number, number], B: [number, number], C: [number, number]) => {
      return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  };

  // Función para verificar si dos polígonos se superponen
  const poligonosSeSuperponenLocal = (
    coords1: [number, number][],
    coords2: [number, number][]
  ): boolean => {
    if (coords1.length < 3 || coords2.length < 3) return false;

    // Verificar si algún vértice de coords1 está dentro de coords2
    for (const punto of coords1) {
      if (puntoEnPoligono(punto, coords2)) {
        return true;
      }
    }

    // Verificar si algún vértice de coords2 está dentro de coords1
    for (const punto of coords2) {
      if (puntoEnPoligono(punto, coords1)) {
        return true;
      }
    }

    // Verificar intersección de bordes
    for (let i = 0; i < coords1.length - 1; i++) {
      for (let j = 0; j < coords2.length - 1; j++) {
        if (segmentosSeCruzan(coords1[i], coords1[i + 1], coords2[j], coords2[j + 1])) {
          return true;
        }
      }
    }

    return false;
  };

  // Verificar superposición cada vez que cambia el polígono
  useEffect(() => {
    if (polygonPoints.length >= 3) {
      const cuencasFiltradas = cuencas.filter(c => !isEdit || c.id !== parseInt(formData.id));
      let superposicion = false;

      for (const cuenca of cuencasFiltradas) {
        try {
          const coordsCuencaExistente = convertCoordinates(cuenca.poligono.coordinates)[0];
          if (poligonosSeSuperponenLocal(polygonPoints, coordsCuencaExistente)) {
            superposicion = true;
            break;
          }
        } catch (error) {
          console.error('Error al verificar superposición:', error);
        }
      }

      setHaySuperposicion(superposicion);
    } else {
      setHaySuperposicion(false);
    }
  }, [polygonPoints, cuencas, isEdit, formData.id]);

  // Componente para auto-ajustar el zoom al polígono
  const FitBoundsToPolygon = ({ points }: { points: [number, number][] }) => {
    const map = useMap();

    useEffect(() => {
      if (points.length >= 3) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [points, map]);

    return null;
  };

  // Componente para capturar clics en el mapa (para polígono)
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (isDrawingMode) {
          const { lat, lng } = e.latlng;
          // Agregar el punto antes del último punto (que cierra el polígono)
          setPolygonPoints(prev => {
            if (prev.length === 0) {
              return [[lat, lng]];
            }
            // Si el polígono está cerrado, insertar antes del último punto
            const lastPoint = prev[prev.length - 1];
            const firstPoint = prev[0];
            const isClosed = lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1];

            if (isClosed && prev.length > 1) {
              // Insertar antes del punto de cierre
              return [...prev.slice(0, -1), [lat, lng], lastPoint];
            } else {
              // Agregar al final
              return [...prev, [lat, lng]];
            }
          });
        }
      },
    });
    return null;
  };

  // Componente para capturar clics en el mapa de nodos
  const NodoMapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        // Si hay un nodo para reubicar, actualizarlo
        if (nodoParaReubicar) {
          guardarEnHistorial(); // Guardar estado antes de modificar
          const nodoActualizado = {
            ...nodoParaReubicar,
            posicionx: lat,
            posiciony: lng,
          };

          // Actualizar inmediatamente en el estado local (optimistic update)
          setNodosCuenca(prev => {
            // Si el nodo ya está en la lista, actualizar su posición
            const exists = prev.some(n => n.id === nodoActualizado.id);
            if (exists) {
              return prev.map(n => n.id === nodoActualizado.id ? nodoActualizado : n);
            } else {
              // Si no está, agregarlo
              return [...prev, nodoActualizado];
            }
          });

          handleUpdateNodo(nodoActualizado);
          setNodoParaReubicar(null); // Limpiar el estado
          mostrarToast('success', `Nodo "${nodoParaReubicar.nombre}" reubicado exitosamente`);
        } else if (isCreatingNode) {
          // Solo crear un nuevo nodo si estamos en modo creación
          guardarEnHistorial(); // Guardar estado antes de agregar
          const newNodo: Nodo = {
            nombre: `Nodo ${nodosCuenca.length + 1}`,
            descripcion: '',
            posicionx: lat,
            posiciony: lng,
            cuenca_id: formData.id ? parseInt(formData.id) : undefined,
          };
          setNodosCuenca(prev => [...prev, newNodo]);
          setIsCreatingNode(false); // Desactivar modo creación después de crear
          mostrarToast('success', 'Nodo creado. Completa los detalles y guarda.');
        }
      },
    });
    return null;
  };

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    // No limpiar los puntos existentes cuando se está editando
  };

  const handleFinishDrawing = () => {
    setIsDrawingMode(false);
  };

  const handleClearPolygon = () => {
    setPolygonPoints([]);
    setIsDrawingMode(false);
  };

  const handleRemoveLastPoint = () => {
    setPolygonPoints(prev => {
      // Si el polígono está cerrado, mantener el punto de cierre
      if (prev.length > 2) {
        const lastPoint = prev[prev.length - 1];
        const firstPoint = prev[0];
        const isClosed = lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1];

        if (isClosed) {
          // Eliminar el penúltimo punto, manteniendo el punto de cierre
          return [...prev.slice(0, -2), lastPoint];
        }
      }
      return prev.slice(0, -1);
    });
  };

  // Componente para punto del polígono arrastrable
  const DraggablePolygonPoint = ({ position, index }: { position: [number, number]; index: number }) => {
    const [pos, setPos] = useState<[number, number]>(position);

    useEffect(() => {
      setPos(position);
    }, [position]);

    const eventHandlers = {
      dragend: (e: L.DragEndEvent) => {
        const marker = e.target;
        const newPos = marker.getLatLng();
        setPos([newPos.lat, newPos.lng]);

        // Actualizar el punto en el array
        setPolygonPoints(prev => {
          const updated = [...prev];
          updated[index] = [newPos.lat, newPos.lng];

          // Si es el primer punto y el polígono está cerrado, actualizar también el último punto
          if (index === 0 && updated.length > 2) {
            const lastIndex = updated.length - 1;
            const firstPoint = updated[0];
            const lastPoint = updated[lastIndex];
            if (firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]) {
              updated[lastIndex] = [newPos.lat, newPos.lng];
            }
          }

          return updated;
        });
      },
    };

    const handleDeletePoint = () => {
      setPolygonPoints(prev => {
        const updated = [...prev];
        const firstPoint = updated[0];
        const lastPoint = updated[updated.length - 1];
        const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];

        // Si el polígono está cerrado y eliminamos un punto que no es el primero
        if (isClosed && index !== 0) {
          // Eliminar el punto y mantener el cierre
          return [...updated.slice(0, index), ...updated.slice(index + 1)];
        } else if (isClosed && index === 0) {
          // Si eliminamos el primer punto, el nuevo primer punto será el segundo
          const newFirst = updated[1];
          return [...updated.slice(1, -1), newFirst];
        } else {
          // Polígono no cerrado, simplemente eliminar
          return [...updated.slice(0, index), ...updated.slice(index + 1)];
        }
      });
    };

    // No mostrar marcador para el punto de cierre si es igual al primero
    if (index > 0 && polygonPoints.length > 2) {
      const firstPoint = polygonPoints[0];
      const lastPoint = polygonPoints[polygonPoints.length - 1];
      const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];

      if (isClosed && index === polygonPoints.length - 1) {
        return null; // No mostrar el marcador del punto de cierre
      }
    }

    return (
      <Marker
        position={pos}
        draggable={true}
        eventHandlers={eventHandlers}
      >
        <Popup>
          <div className="p-2">
            <p className="text-sm font-bold">Punto {index + 1}</p>
            <p className="text-xs text-gray-500">
              Lat: {pos[0].toFixed(6)}<br />
              Lng: {pos[1].toFixed(6)}
            </p>
            <p className="text-xs mt-2 text-gray-600">
              Arrastra para mover
            </p>
            {polygonPoints.length > 3 && (
              <button
                onClick={handleDeletePoint}
                className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 w-full"
              >
                Eliminar punto
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    );
  };

  // Funciones para gestión de nodos
  const handleCreateNodo = async (nodo: Nodo) => {
    if (!formData.id) {
      mostrarToast('error', 'Debe guardar la cuenca primero antes de agregar nodos');
      return;
    }

    try {
      const nodoData = {
        nombre: nodo.nombre,
        descripcion: nodo.descripcion,
        posicionx: nodo.posicionx,
        posiciony: nodo.posiciony,
        cuenca_id: parseInt(formData.id),
      };
      await axios.post('http://localhost:8000/nodo', nodoData);
      mostrarToast('success', 'Nodo creado exitosamente');
      await obtenerNodosCuenca(formData.id);
    } catch (error: any) {
      console.error('Error al crear nodo:', error);
      mostrarToast('error', 'Error al crear el nodo');
    }
  };

  const handleUpdateNodo = async (nodo: Nodo) => {
    if (!nodo.id) return;

    try {
      const nodoData = {
        nombre: nodo.nombre,
        descripcion: nodo.descripcion,
        posicionx: nodo.posicionx,
        posiciony: nodo.posiciony,
        cuenca_id: nodo.cuenca_id || (formData.id ? parseInt(formData.id) : null),
      };
      await axios.put(`http://localhost:8000/nodo/${nodo.id}`, nodoData);
      mostrarToast('success', 'Nodo actualizado exitosamente');

      // Actualizar las listas después de la modificación
      if (formData.id) {
        const responseCuenca = await axios.get(`http://localhost:8000/cuenca/${formData.id}`);
        const nodosActualizados = responseCuenca.data.nodos || [];
        setNodosCuenca(nodosActualizados);
      }

      // Actualizar todos los nodos
      const responseTodos = await axios.get('http://localhost:8000/nodos');
      setTodosNodos(responseTodos.data);

      // Actualizar el mapa principal de cuencas
      await obtenerCuencas();
    } catch (error: any) {
      console.error('Error al actualizar nodo:', error);
      mostrarToast('error', 'Error al actualizar el nodo');
    }
  };

  const handleDeleteNodo = async (nodoId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Nodo',
      message: '¿Está seguro que desea eliminar este nodo permanentemente del sistema?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await axios.delete(`http://localhost:8000/nodo/${nodoId}`);
          mostrarToast('success', 'Nodo eliminado exitosamente');
          setNodosCuenca(prev => prev.filter(n => n.id !== nodoId));

          // Actualizar listas
          const responseTodos = await axios.get('http://localhost:8000/nodos');
          setTodosNodos(responseTodos.data);
          await obtenerCuencas();
        } catch (error: any) {
          console.error('Error al eliminar nodo:', error);
          mostrarToast('error', 'Error al eliminar el nodo');
        }
      },
    });
  };

  const handleDesvincularNodo = async (nodo: Nodo) => {
    // En AMBOS modos (creación y edición), simplemente quitar el nodo de la lista local
    // Los cambios se persistirán cuando el usuario presione "Guardar"
    setConfirmDialog({
      isOpen: true,
      title: 'Quitar Nodo',
      message: `¿Está seguro que desea quitar "${nodo.nombre}" de esta cuenca?\n\nEl nodo volverá a estar disponible. ${isEdit ? 'Recuerda guardar los cambios.' : ''}`,
      type: 'info',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        // Quitar de la lista local de nodos de la cuenca
        setNodosCuenca(prev => prev.filter(n => n.id !== nodo.id));

        // NO modificamos todosNodos aquí porque son cambios temporales
        // La lista de nodos disponibles se actualizará desde el backend cuando:
        // 1. El usuario guarde los cambios (handleSubmit recarga obtenerTodosNodosInicial)
        // 2. El usuario cambie de pestaña (useEffect recarga obtenerTodosNodos)
        // Esto garantiza consistencia con el estado real del backend

        const mensaje = isEdit
          ? `Nodo "${nodo.nombre}" quitado de la cuenca. Guarda los cambios para confirmar.`
          : `Nodo "${nodo.nombre}" quitado de la cuenca temporal`;
        mostrarToast('success', mensaje);
      },
    });
  };

  const handleNodoNameChange = (index: number, value: string) => {
    setNodosCuenca(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], nombre: value };
      return updated;
    });
  };

  const handleNodoDescChange = (index: number, value: string) => {
    setNodosCuenca(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], descripcion: value };
      return updated;
    });
  };


  // Asignar un nodo disponible a la cuenca actual
  const handleAsignarNodo = async (nodo: Nodo) => {
    // Guardar estado antes de asignar
    guardarEnHistorial();

    // Calcular el centro del polígono de la cuenca
    let centroLat = 0;
    let centroLng = 0;

    if (polygonPoints.length >= 3) {
      // Calcular el centroide del polígono
      polygonPoints.forEach(point => {
        centroLat += point[0];
        centroLng += point[1];
      });
      centroLat /= polygonPoints.length;
      centroLng /= polygonPoints.length;
    } else {
      // Si no hay polígono, usar la posición original
      centroLat = nodo.posicionx;
      centroLng = nodo.posiciony;
    }

    // USAR CALLBACK EN setNodosCuenca PARA ACCEDER AL ESTADO MÁS RECIENTE
    // Esto garantiza que calcularPosicionSinSuperposicion tenga acceso a todos los nodos ya asignados
    setNodosCuenca(prev => {
      // Verificar si el nodo ya existe
      const exists = prev.some(n => n.id === nodo.id);
      if (exists) {
        // Si ya existe, solo actualizar su información
        return prev.map(n => n.id === nodo.id ? {
          ...nodo,
          cuenca_id: formData.id ? parseInt(formData.id) : undefined,
        } : n);
      }

      // Calcular posición sin superposición usando el estado más reciente (prev)
      const calcularPosicionActualizada = () => {
        const radioBase = 0.001;
        const maxIntentos = 100;
        const distanciaMinima = 0.0008;

        const estaDemasiadoCerca = (lat: number, lng: number) => {
          // Usar 'prev' (estado actualizado) en lugar de nodosCuenca (que puede estar desactualizado)
          const todosLosNodosRelevantes = [
            ...prev, // Nodos ya en esta cuenca (estado más reciente)
            ...todosNodos.filter(n => !prev.some(nc => nc.id === n.id))
          ];

          for (const nodoExistente of todosLosNodosRelevantes) {
            const distancia = Math.sqrt(
              Math.pow(nodoExistente.posicionx - lat, 2) +
              Math.pow(nodoExistente.posiciony - lng, 2)
            );

            if (distancia < distanciaMinima) {
              console.log(`Posición (${lat.toFixed(6)}, ${lng.toFixed(6)}) muy cerca del nodo "${nodoExistente.nombre}" (distancia: ${distancia.toFixed(6)})`);
              return true;
            }
          }
          return false;
        };

        // Verificar si el centroide está libre
        if (!estaDemasiadoCerca(centroLat, centroLng)) {
          console.log(`Nodo colocado en el centroide (${centroLat.toFixed(6)}, ${centroLng.toFixed(6)})`);
          return { lat: centroLat, lng: centroLng };
        }

        // Intentar encontrar una posición libre usando patrón en espiral
        for (let i = 1; i <= maxIntentos; i++) {
          const angulo = (Math.PI * 2 * i) / 12;
          const radio = radioBase * (1 + Math.floor(i / 12));

          const nuevaLat = centroLat + Math.cos(angulo) * radio;
          const nuevaLng = centroLng + Math.sin(angulo) * radio;

          if (!estaDemasiadoCerca(nuevaLat, nuevaLng)) {
            console.log(`Nodo colocado en intento ${i}, radio ${radio.toFixed(4)}, ángulo ${(angulo * 180 / Math.PI).toFixed(0)}°, posición (${nuevaLat.toFixed(6)}, ${nuevaLng.toFixed(6)})`);
            return { lat: nuevaLat, lng: nuevaLng };
          }
        }

        // Fallback: offset grande
        const offsetFinal = radioBase * (2 + maxIntentos / 12);
        const anguloAleatorio = Math.random() * Math.PI * 2;
        console.warn('No se encontró posición libre, usando offset final:', offsetFinal);

        return {
          lat: centroLat + Math.cos(anguloAleatorio) * offsetFinal,
          lng: centroLng + Math.sin(anguloAleatorio) * offsetFinal,
        };
      };

      const posicionFinal = calcularPosicionActualizada();

      // Crear el nodo con la nueva posición
      const nodoEnCuenca = {
        ...nodo,
        posicionx: posicionFinal.lat,
        posiciony: posicionFinal.lng,
        cuenca_id: formData.id ? parseInt(formData.id) : undefined,
      };

      // Retornar el nuevo array con el nodo agregado
      return [...prev, nodoEnCuenca];
    });

    // IMPORTANTE: NO guardamos inmediatamente en el backend, ni siquiera en modo edición
    // Los cambios se aplicarán cuando el usuario presione "Guardar" en el formulario
    // Esto previene que los nodos se persistan al presionar ESC

    const mensaje = isEdit
      ? `Nodo "${nodo.nombre}" asignado a la cuenca. Guarda los cambios para confirmar la asignación.`
      : `Nodo "${nodo.nombre}" vinculado temporalmente. Guarda la cuenca en la pestaña "Cuenca" para confirmar la asignación.`;

    mostrarToast('success', mensaje);
  };

  // Marcador personalizado draggable
  const DraggableMarker = ({ nodo, index }: { nodo: Nodo; index: number }) => {
    const [position, setPosition] = useState<[number, number]>([nodo.posicionx, nodo.posiciony]);

    useEffect(() => {
      setPosition([nodo.posicionx, nodo.posiciony]);
    }, [nodo.posicionx, nodo.posiciony]);

    const eventHandlers = {
      dragend: (e: L.DragEndEvent) => {
        const marker = e.target;
        const newPos = marker.getLatLng();
        setPosition([newPos.lat, newPos.lng]);

        // Actualizar el nodo en el estado local
        // Los cambios se guardarán al backend cuando el usuario presione "Guardar"
        setNodosCuenca(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            posicionx: newPos.lat,
            posiciony: newPos.lng,
          };
          return updated;
        });

        // NO guardamos inmediatamente en el backend para evitar persistencia no deseada
        // Los cambios se aplicarán al presionar "Guardar" en el formulario
      },
    };

    return (
      <Marker
        position={position}
        draggable={true}
        eventHandlers={eventHandlers}
        icon={nodoAssignedIcon}
      >
        <Popup>
          <div className="p-2">
            <strong>{nodo.nombre}</strong>
            {nodo.descripcion && <p className="text-sm">{nodo.descripcion}</p>}
            <p className="text-xs text-gray-500">
              Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Arrastra para mover
            </p>
            {nodo.id && (
              <div className="mt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleDesvincularNodo(nodo)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 w-full"
                  title="Quitar de esta cuenca"
                >
                  Desvincular de cuenca
                </button>
                <button
                  onClick={() => handleDeleteNodo(nodo.id!)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 w-full"
                  title="Eliminar permanentemente"
                >
                  Eliminar permanentemente
                </button>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  };

  return (
    <>
      <Breadcrumb pageName="Gestión de Cuencas" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Crear Nueva Cuenca
        </button>
      </div>

      {/* Mapa de Cuencas */}
      <div className="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Mapa de Cuencas
          </h4>
        </div>
        <div className="px-4 pb-6">
          <MapContainer
            key={`main-map-${cuencas.reduce((acc, c) => acc + (c.nodos?.length || 0), 0)}`}
            center={initialPosition}
            zoom={10}
            style={{ height: "500px", width: "100%", borderRadius: "8px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {cuencas.map((cuenca) => {
              try {
                const positions = convertCoordinates(cuenca.poligono.coordinates);
                return (
                  <React.Fragment key={`cuenca-${cuenca.id}`}>
                    <Polygon
                      positions={positions[0]}
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-lg">{cuenca.nombre}</h3>
                          {cuenca.descripcion && (
                            <p className="text-sm mt-1">{cuenca.descripcion}</p>
                          )}
                          {cuenca.nodos && cuenca.nodos.length > 0 && (
                            <p className="text-xs text-gray-600 mt-2">
                              Nodos: {cuenca.nodos.length}
                            </p>
                          )}
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleOpenModal(cuenca)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(cuenca.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Polygon>

                    {/* Mostrar nodos de esta cuenca */}
                    {cuenca.nodos && cuenca.nodos.map((nodo) => (
                      <Marker
                        key={`nodo-${nodo.id}`}
                        position={[nodo.posicionx, nodo.posiciony]}
                        icon={nodoAssignedIcon}
                      >
                        <Popup>
                          <div className="p-2">
                            <strong>{nodo.nombre}</strong>
                            {nodo.descripcion && (
                              <p className="text-sm mt-1">{nodo.descripcion}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Cuenca: {cuenca.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              Lat: {nodo.posicionx.toFixed(6)}, Lng: {nodo.posiciony.toFixed(6)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </React.Fragment>
                );
              } catch (error) {
                console.error(`Error al renderizar cuenca ${cuenca.id}:`, error);
                return null;
              }
            })}

            {/* Mostrar nodos sin cuenca asignada */}
            {todosNodos
              .filter(nodo => !nodo.cuenca_id)
              .map((nodo) => (
                <Marker
                  key={`nodo-sin-cuenca-${nodo.id}`}
                  position={[nodo.posicionx, nodo.posiciony]}
                  icon={nodoAvailableIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <strong>{nodo.nombre}</strong>
                      {nodo.descripcion && (
                        <p className="text-sm mt-1">{nodo.descripcion}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-1">
                        Nodo disponible (sin cuenca asignada)
                      </p>
                      <p className="text-xs text-gray-500">
                        Lat: {nodo.posicionx.toFixed(6)}, Lng: {nodo.posiciony.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      <TableCuencas
        cuencas={cuencas}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 dark:bg-boxdark shadow-xl">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
              {isEdit ? 'Editar Cuenca' : 'Crear Nueva Cuenca'}
            </h3>

            {/* Tabs */}
            <div className="mb-4 border-b border-stroke dark:border-strokedark">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('cuenca')}
                  className={`pb-2 px-4 font-medium transition-colors ${
                    activeTab === 'cuenca'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-primary'
                  }`}
                >
                  Cuenca
                </button>
                <button
                  onClick={() => setActiveTab('nodos')}
                  disabled={polygonPoints.length < 3}
                  className={`pb-2 px-4 font-medium transition-colors ${
                    activeTab === 'nodos'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-primary'
                  } ${polygonPoints.length < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={polygonPoints.length < 3 ? 'Primero dibuja el polígono de la cuenca' : ''}
                >
                  Nodos ({nodosCuenca.length})
                </button>
              </div>
            </div>

            {/* Contenido de la pestaña Cuenca */}
            {activeTab === 'cuenca' && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Nombre <span className="text-meta-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                {/* Mapa para dibujar polígono */}
                <div className="mb-4">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Polígono <span className="text-meta-1">*</span>
                  </label>
                  <p className="mb-2 text-sm text-gray-500">
                    {isDrawingMode
                      ? 'Haz clic en el mapa para agregar puntos al polígono'
                      : 'Haz clic en "Comenzar a dibujar" y luego haz clic en el mapa para crear el polígono'}
                  </p>
                  <div className="mb-2 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981', opacity: 0.5 }} />
                      <span className="text-gray-600 dark:text-gray-400">Tu cuenca (verde)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-dashed" style={{ borderColor: '#ef4444', backgroundColor: '#ef4444', opacity: 0.3 }} />
                      <span className="text-gray-600 dark:text-gray-400">Cuencas existentes (rojo) - Evita superponer</span>
                    </div>
                  </div>

                  {!isEdit && nodosCuenca.length > 0 && (
                    <div className="mb-3 rounded-lg bg-green-100 border border-green-500 p-3 dark:bg-green-900 dark:border-green-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          {nodosCuenca.length} nodo(s) vinculado(s) temporalmente. Se asignarán al guardar la cuenca.
                        </p>
                      </div>
                    </div>
                  )}

                  {haySuperposicion && polygonPoints.length >= 3 && (
                    <div className="mb-3 rounded-lg bg-red-100 border-2 border-red-500 p-3 dark:bg-red-900 dark:border-red-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                          ¡Advertencia! El polígono se superpone con una cuenca existente. Ajusta el área antes de guardar.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-3 flex gap-2">
                    {!isDrawingMode ? (
                      <button
                        type="button"
                        onClick={handleStartDrawing}
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                      >
                        Comenzar a dibujar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleFinishDrawing}
                          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                        >
                          Finalizar
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLastPoint}
                          disabled={polygonPoints.length === 0}
                          className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Quitar último punto
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleClearPolygon}
                      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                    >
                      Limpiar polígono
                    </button>
                    <span className="inline-flex items-center px-3 py-2 text-sm text-black dark:text-white">
                      Puntos: {polygonPoints.length}
                    </span>
                  </div>

                  <MapContainer
                    center={initialPosition}
                    zoom={10}
                    style={{ height: "400px", width: "100%", borderRadius: "8px" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <MapClickHandler />

                    {/* Auto-ajustar zoom al polígono cuando se edita */}
                    {isEdit && polygonPoints.length >= 3 && (
                      <FitBoundsToPolygon points={polygonPoints} />
                    )}

                    {/* Mostrar cuencas existentes en modo semi-transparente */}
                    {cuencas
                      .filter(c => !isEdit || c.id !== parseInt(formData.id))
                      .map((cuenca) => {
                        try {
                          const positions = convertCoordinates(cuenca.poligono.coordinates);
                          return (
                            <Polygon
                              key={`cuenca-existing-${cuenca.id}`}
                              positions={positions[0]}
                              pathOptions={{
                                color: '#ef4444',
                                fillColor: '#ef4444',
                                fillOpacity: 0.15,
                                weight: 2,
                                dashArray: '5, 5',
                              }}
                            >
                              <Popup>
                                <div className="p-2">
                                  <p className="font-bold text-sm text-red-600">Cuenca existente</p>
                                  <p className="font-semibold">{cuenca.nombre}</p>
                                  {cuenca.descripcion && (
                                    <p className="text-xs mt-1">{cuenca.descripcion}</p>
                                  )}
                                </div>
                              </Popup>
                            </Polygon>
                          );
                        } catch (error) {
                          console.error(`Error al renderizar cuenca ${cuenca.id}:`, error);
                          return null;
                        }
                      })}

                    {/* Mostrar puntos marcados arrastrables */}
                    {polygonPoints.map((point, index) => (
                      <DraggablePolygonPoint key={`point-${index}`} position={point} index={index} />
                    ))}

                    {/* Mostrar líneas entre puntos */}
                    {polygonPoints.length > 1 && (
                      <Polyline positions={polygonPoints} color="blue" weight={2} />
                    )}

                    {/* Mostrar polígono cuando hay al menos 3 puntos */}
                    {polygonPoints.length >= 3 && (
                      <Polygon
                        positions={polygonPoints}
                        pathOptions={{
                          color: haySuperposicion ? '#ef4444' : '#10b981',
                          fillColor: haySuperposicion ? '#ef4444' : '#10b981',
                          fillOpacity: haySuperposicion ? 0.4 : 0.3,
                          weight: haySuperposicion ? 3 : 2,
                        }}
                      />
                    )}
                  </MapContainer>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded bg-gray-200 px-6 py-2 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={polygonPoints.length < 3 || haySuperposicion}
                    className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={haySuperposicion ? 'No se puede guardar: hay superposición con otra cuenca' : ''}
                  >
                    {isEdit ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            )}

            {/* Contenido de la pestaña Nodos */}
            {activeTab === 'nodos' && (
              <div>
                {!isEdit && (
                  <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900 dark:border-blue-700">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Modo Creación:</strong> Los nodos se vincularán temporalmente a esta cuenca.
                      Debes regresar a la pestaña "Cuenca" y guardar la cuenca primero antes de poder crear nodos nuevos.
                    </p>
                  </div>
                )}
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {isCreatingNode
                    ? '📍 Haz clic en el mapa para colocar el nuevo nodo.'
                    : isEdit
                      ? 'Usa el botón "+ Crear Nodo" para agregar un nuevo nodo en el mapa. Arrastra los marcadores verdes para mover los nodos existentes.'
                      : 'Asigna nodos disponibles a esta cuenca. Puedes ajustar su posición después de asignarlos.'}
                </p>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }} />
                      <span>Nodo asignado a esta cuenca (verde)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
                      <span>Nodo disponible (azul)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#9ca3af' }} />
                      <span>Nodo de otra cuenca (gris)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEdit && (
                      <button
                        onClick={() => setIsCreatingNode(!isCreatingNode)}
                        className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                          isCreatingNode
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title={isCreatingNode ? 'Cancelar creación de nodo' : 'Crear un nuevo nodo en el mapa'}
                      >
                        {isCreatingNode ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Crear Nodo
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleDeshacer}
                      disabled={!puedeDeshacer}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        puedeDeshacer
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Deshacer última acción (Ctrl+Z)"
                    >
                      ↶ Deshacer (Ctrl+Z)
                    </button>
                  </div>
                </div>

                {/* Lista de nodos */}
                <div className="mb-4 max-h-60 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Nombre</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Descripción</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Posición</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodosCuenca.map((nodo, index) => (
                        <tr key={nodo.id || index} className="border-b dark:border-gray-700">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={nodo.nombre}
                              onChange={(e) => handleNodoNameChange(index, e.target.value)}
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={nodo.descripcion}
                              onChange={(e) => handleNodoDescChange(index, e.target.value)}
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600"
                            />
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {nodo.posicionx.toFixed(4)}, {nodo.posiciony.toFixed(4)}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2 flex-wrap">
                              {!isEdit ? (
                                // Modo creación: solo permitir quitar nodos temporalmente
                                <button
                                  onClick={() => handleDesvincularNodo(nodo)}
                                  className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                                  title="Quitar de esta cuenca temporal"
                                >
                                  Quitar
                                </button>
                              ) : !nodo.id ? (
                                // Modo edición: nodo nuevo sin ID
                                <button
                                  onClick={() => handleCreateNodo(nodo)}
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                >
                                  Guardar
                                </button>
                              ) : (
                                // Modo edición: nodo existente con ID
                                <>
                                  <button
                                    onClick={() => handleUpdateNodo(nodo)}
                                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                  >
                                    Actualizar
                                  </button>
                                  <button
                                    onClick={() => handleDesvincularNodo(nodo)}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                                    title="Quitar de esta cuenca"
                                  >
                                    Desvincular
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNodo(nodo.id!)}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                    title="Eliminar permanentemente"
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lista de nodos disponibles para asignar */}
                <div className="mb-4">
                  <h5 className="text-lg font-semibold text-black dark:text-white mb-3">
                    Nodos Disponibles para Asignar
                  </h5>
                  <div className="max-h-60 overflow-y-auto border border-stroke dark:border-strokedark rounded">
                    {todosNodos.filter(nodo => !nodo.cuenca_id && !nodosCuenca.some(n => n.id === nodo.id)).length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No hay nodos disponibles sin asignar
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Nombre</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Descripción</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Posición</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todosNodos
                            .filter(nodo => !nodo.cuenca_id && !nodosCuenca.some(n => n.id === nodo.id))
                            .map((nodo) => (
                              <tr key={`disponible-${nodo.id}`} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-4 py-2 text-sm">{nodo.nombre}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                  {nodo.descripcion || '-'}
                                </td>
                                <td className="px-4 py-2 text-xs text-gray-500">
                                  {nodo.posicionx.toFixed(4)}, {nodo.posiciony.toFixed(4)}
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => handleAsignarNodo(nodo)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 flex items-center gap-1"
                                    title="Asignar a esta cuenca"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Asignar
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Mapa de gestión de nodos */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Polígono de la cuenca: {polygonPoints.length >= 3 ?
                        `Visible (${polygonPoints.length} puntos)` :
                        `No visible (${polygonPoints.length} puntos - mínimo 3 requeridos)`}
                    </p>
                    {nodoParaReubicar && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-blue-600 font-semibold">
                          📍 Reubicando: {nodoParaReubicar.nombre}
                        </p>
                        <button
                          onClick={() => {
                            setNodoParaReubicar(null);
                            mostrarToast('success', 'Reubicación cancelada');
                          }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <MapContainer
                    key={`map-nodos-${nodosCuenca.length}-${todosNodos.length}-${nodoParaReubicar?.id || 'none'}-${nodosCuenca.map(n => `${n.id}-${n.posicionx}-${n.posiciony}`).join('_')}`}
                    center={polygonPoints.length >= 3 ? polygonPoints[0] : initialPosition}
                    zoom={11}
                    style={{
                      height: "500px",
                      width: "100%",
                      borderRadius: "8px",
                      cursor: nodoParaReubicar || isCreatingNode ? 'crosshair' : 'default',
                      border: isCreatingNode ? '3px solid #10b981' : '1px solid #e5e7eb'
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <NodoMapClickHandler />

                    {/* Auto-ajustar zoom al polígono de la cuenca */}
                    {polygonPoints.length >= 3 && (
                      <FitBoundsToPolygon points={polygonPoints} />
                    )}

                    {/* Mostrar polígono de la cuenca */}
                    {polygonPoints.length >= 3 && (
                      <Polygon
                        positions={polygonPoints}
                        pathOptions={{
                          color: '#10b981',
                          fillColor: '#10b981',
                          fillOpacity: 0.2,
                          weight: 3,
                        }}
                      />
                    )}

                    {/* Mostrar nodos draggables (asignados a esta cuenca) */}
                    {nodosCuenca.map((nodo, index) => (
                      <DraggableMarker key={nodo.id || `temp-${index}`} nodo={nodo} index={index} />
                    ))}

                    {/* Mostrar nodos disponibles (sin asignar o de otras cuencas) */}
                    {todosNodos
                      .filter(nodo => {
                        // Filtrar nodos que no están en esta cuenca
                        const isInCuenca = nodosCuenca.some(n => n.id === nodo.id);
                        // No mostrar el nodo que se está reubicando
                        const isBeingRelocated = nodoParaReubicar && nodoParaReubicar.id === nodo.id;
                        // Solo filtrar por si está en nodosCuenca y si se está reubicando
                        return !isInCuenca && !isBeingRelocated;
                      })
                      .map(nodo => (
                        <Marker
                          key={`available-${nodo.id}`}
                          position={[nodo.posicionx, nodo.posiciony]}
                          icon={nodo.cuenca_id ? createNodoIcon('#9ca3af') : nodoAvailableIcon}
                        >
                          <Popup>
                            <div className="p-2">
                              <strong>{nodo.nombre}</strong>
                              {nodo.descripcion && <p className="text-sm">{nodo.descripcion}</p>}
                              <p className="text-xs text-gray-500">
                                Lat: {nodo.posicionx.toFixed(6)}, Lng: {nodo.posiciony.toFixed(6)}
                              </p>
                              {nodo.cuenca_id ? (
                                <p className="text-xs text-yellow-600 mt-2">
                                  Este nodo está asignado a otra cuenca
                                </p>
                              ) : (
                                <button
                                  onClick={() => handleAsignarNodo(nodo)}
                                  className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 w-full"
                                >
                                  Asignar a esta cuenca
                                </button>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>

                <div className="flex justify-between items-center">
                  {!isEdit && nodosCuenca.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded px-4 py-2 dark:bg-green-900 dark:border-green-700">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {nodosCuenca.length} nodo(s) vinculado(s) temporalmente
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {/* Botón para guardar cambios directamente desde la pestaña Nodos */}
                    {isEdit ? (
                      <button
                        type="button"
                        onClick={handleGuardarDesdeNodos}
                        className="inline-flex items-center gap-2 rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar Cambios
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveTab('cuenca')}
                          className="rounded bg-gray-400 px-6 py-2 text-white hover:bg-gray-500"
                        >
                          Volver a Cuenca
                        </button>
                        <button
                          type="button"
                          onClick={handleGuardarDesdeNodos}
                          className="inline-flex items-center gap-2 rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar Cuenca y Nodos
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="rounded bg-gray-200 px-6 py-2 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones toast */}
      <ToastContainer toasts={toasts} onRemoveToast={removerToast} />

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default PanelCuencas;
