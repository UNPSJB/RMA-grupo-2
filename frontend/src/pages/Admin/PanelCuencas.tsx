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

  // Estados para gestión de nodos
  const [nodosCuenca, setNodosCuenca] = useState<Nodo[]>([]);
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
  useEffect(() => {
    if (activeTab === 'nodos' && isEdit) {
      obtenerTodosNodos();
    }
  }, [activeTab, isEdit]);

  const obtenerNodosCuenca = async (cuencaId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/cuenca/${cuencaId}`);
      setNodosCuenca(response.data.nodos || []);
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
      // Obtener nodos de la cuenca y todos los nodos disponibles
      await obtenerNodosCuenca(cuenca.id.toString());
      await obtenerTodosNodos();
    } else {
      setFormData({
        id: '',
        nombre: '',
        descripcion: '',
      });
      setPolygonPoints([]);
      setNodosCuenca([]);
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
    setIsDrawingMode(false);
    setActiveTab('cuenca');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (polygonPoints.length < 3) {
      mostrarToast('error', 'Debe dibujar un polígono con al menos 3 puntos');
      return;
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
        await axios.put(`http://localhost:8000/cuenca/${formData.id}`, data);
        mostrarToast('success', 'Cuenca actualizada exitosamente');
      } else {
        await axios.post('http://localhost:8000/cuenca', data);
        mostrarToast('success', 'Cuenca creada exitosamente');
      }

      handleCloseModal();
      obtenerCuencas();
    } catch (error: any) {
      console.error('Error al guardar la cuenca:', error);
      const errorMsg = error.response?.data?.detail || 'Error al guardar la cuenca';
      mostrarToast('error', errorMsg);
    }
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
    setConfirmDialog({
      isOpen: true,
      title: 'Desvincular Nodo',
      message: `¿Está seguro que desea quitar "${nodo.nombre}" de esta cuenca?\n\nEl nodo no se eliminará, solo se desvinculará de la cuenca.`,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          if (!nodo.id) return;

          const nodoData = {
            nombre: nodo.nombre,
            descripcion: nodo.descripcion,
            posicionx: nodo.posicionx,
            posiciony: nodo.posiciony,
            cuenca_id: null, // Desvincular
          };

          // Actualizar inmediatamente en el estado local (optimistic update)
          // Remover de nodosCuenca
          setNodosCuenca(prev => prev.filter(n => n.id !== nodo.id));

          // Agregar a todosNodos como disponible (sin cuenca_id)
          setTodosNodos(prev => {
            const exists = prev.some(n => n.id === nodo.id);
            if (exists) {
              // Actualizar el nodo existente para quitarle el cuenca_id
              return prev.map(n => n.id === nodo.id ? { ...n, cuenca_id: undefined } : n);
            } else {
              // Si por alguna razón no está en la lista, agregarlo
              return [...prev, { ...nodo, cuenca_id: undefined }];
            }
          });

          await axios.put(`http://localhost:8000/nodo/${nodo.id}`, nodoData);
          mostrarToast('success', `Nodo "${nodo.nombre}" desvinculado de la cuenca`);

          // Actualizar listas desde el backend para sincronizar
          if (formData.id) {
            const responseCuenca = await axios.get(`http://localhost:8000/cuenca/${formData.id}`);
            const nodosActualizados = responseCuenca.data.nodos || [];
            setNodosCuenca(nodosActualizados);
          }

          const responseTodos = await axios.get('http://localhost:8000/nodos');
          setTodosNodos(responseTodos.data);
          await obtenerCuencas();
          await obtenerTodosNodosInicial(); // Actualizar también en el mapa principal
        } catch (error: any) {
          console.error('Error al desvincular nodo:', error);
          mostrarToast('error', 'Error al desvincular el nodo');

          // En caso de error, revertir los cambios optimistas
          if (formData.id) {
            const responseCuenca = await axios.get(`http://localhost:8000/cuenca/${formData.id}`);
            const nodosActualizados = responseCuenca.data.nodos || [];
            setNodosCuenca(nodosActualizados);
          }
          const responseTodos = await axios.get('http://localhost:8000/nodos');
          setTodosNodos(responseTodos.data);
        }
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

  // Calcular posición sin superposición para asignar nodo
  const calcularPosicionSinSuperposicion = (centroLat: number, centroLng: number) => {
    // Radio de búsqueda inicial (en grados, aproximadamente 100 metros)
    const radioBase = 0.001;
    const maxIntentos = 50;
    const distanciaMinima = 0.0005; // Distancia mínima entre nodos

    // Verificar si una posición está muy cerca de otro nodo
    // IMPORTANTE: Revisar TODOS los nodos, no solo los de esta cuenca
    // Esto evita superposición con nodos desvinculados o de otras cuencas
    const estaDemasiadoCerca = (lat: number, lng: number) => {
      // Combinar nodos de la cuenca actual con todos los nodos disponibles
      const todosLosNodosRelevantes = [
        ...nodosCuenca,
        ...todosNodos.filter(n => !nodosCuenca.some(nc => nc.id === n.id))
      ];

      return todosLosNodosRelevantes.some(nodo => {
        const distancia = Math.sqrt(
          Math.pow(nodo.posicionx - lat, 2) +
          Math.pow(nodo.posiciony - lng, 2)
        );
        return distancia < distanciaMinima;
      });
    };

    // Verificar si el centroide está libre
    if (!estaDemasiadoCerca(centroLat, centroLng)) {
      return { lat: centroLat, lng: centroLng };
    }

    // Intentar encontrar una posición libre cerca del centroide
    for (let i = 0; i < maxIntentos; i++) {
      const angulo = (Math.PI * 2 * i) / 8; // 8 posiciones alrededor del centro
      const radio = radioBase * (1 + Math.floor(i / 8)); // Aumentar el radio en cada vuelta

      const nuevaLat = centroLat + Math.cos(angulo) * radio;
      const nuevaLng = centroLng + Math.sin(angulo) * radio;

      if (!estaDemasiadoCerca(nuevaLat, nuevaLng)) {
        return { lat: nuevaLat, lng: nuevaLng };
      }
    }

    // Si no encuentra una posición libre, agregar un pequeño offset aleatorio
    const offsetAleatorio = radioBase * (1 + Math.random());
    const anguloAleatorio = Math.random() * Math.PI * 2;

    return {
      lat: centroLat + Math.cos(anguloAleatorio) * offsetAleatorio,
      lng: centroLng + Math.sin(anguloAleatorio) * offsetAleatorio,
    };
  };

  // Asignar un nodo disponible a la cuenca actual
  const handleAsignarNodo = async (nodo: Nodo) => {
    if (!formData.id) {
      mostrarToast('error', 'Debe guardar la cuenca primero');
      return;
    }

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

    // Calcular posición final evitando superposición
    const posicionFinal = calcularPosicionSinSuperposicion(centroLat, centroLng);

    // Crear el nodo con la nueva posición sin superposición
    const nodoEnCuenca = {
      ...nodo,
      posicionx: posicionFinal.lat,
      posiciony: posicionFinal.lng,
      cuenca_id: parseInt(formData.id),
    };

    // Agregar inmediatamente el nodo a la cuenca con su nueva posición
    setNodosCuenca(prev => {
      const exists = prev.some(n => n.id === nodo.id);
      if (exists) {
        return prev.map(n => n.id === nodo.id ? nodoEnCuenca : n);
      } else {
        return [...prev, nodoEnCuenca];
      }
    });

    // Actualizar en el backend
    if (nodo.id) {
      handleUpdateNodo(nodoEnCuenca);
    }

    mostrarToast('success', `Nodo "${nodo.nombre}" asignado a la cuenca. Puedes arrastrarlo para ajustar su posición.`);
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

        // Actualizar el nodo en el estado
        setNodosCuenca(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            posicionx: newPos.lat,
            posiciony: newPos.lng,
          };
          return updated;
        });

        // Si el nodo ya existe en la BD, actualizarlo
        if (nodo.id) {
          const updatedNodo = {
            ...nodo,
            posicionx: newPos.lat,
            posiciony: newPos.lng,
          };
          handleUpdateNodo(updatedNodo);
        }
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

      {alert && (
        <div
          className={`mb-4 rounded-lg p-4 ${
            alert.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {alert.message}
        </div>
      )}

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
                {isEdit && (
                  <button
                    onClick={() => setActiveTab('nodos')}
                    className={`pb-2 px-4 font-medium transition-colors ${
                      activeTab === 'nodos'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-primary'
                    }`}
                  >
                    Nodos ({nodosCuenca.length})
                  </button>
                )}
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
                          color: '#10b981',
                          fillColor: '#10b981',
                          fillOpacity: 0.3,
                          weight: 2,
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
                    disabled={polygonPoints.length < 3}
                    className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isEdit ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            )}

            {/* Contenido de la pestaña Nodos */}
            {activeTab === 'nodos' && isEdit && (
              <div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {isCreatingNode
                    ? '📍 Haz clic en el mapa para colocar el nuevo nodo.'
                    : 'Usa el botón "+ Crear Nodo" para agregar un nuevo nodo en el mapa. Arrastra los marcadores verdes para mover los nodos existentes.'}
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
                              {!nodo.id ? (
                                <button
                                  onClick={() => handleCreateNodo(nodo)}
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                >
                                  Guardar
                                </button>
                              ) : (
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
                    {todosNodos.filter(nodo => !nodo.cuenca_id).length === 0 ? (
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
                            .filter(nodo => !nodo.cuenca_id)
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded bg-gray-200 px-6 py-2 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cerrar
                  </button>
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
