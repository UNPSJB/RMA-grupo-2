import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { nodoDefaultIcon } from '../../utils/nodoIcon';
import ToastContainer, { ToastData } from '../../components/Toast/ToastContainer';
import ConfirmDialog, { ConfirmType } from '../../components/Modal/ConfirmDialog';
import VariablesModal from '../../components/Modal/VariablesModal';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
  cuenca_id?: number;
  es_movil?: boolean;
}

interface Cuenca {
  value: number;
  label: string;
}

interface CuencaCompleta {
  id: number;
  nombre: string;
  descripcion: string;
  poligono: {
    type: string;
    coordinates: number[][][];
  };
}

const EditarNodo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nodoInicial = location.state?.nodo as Nodo | undefined;

  const [formData, setFormData] = useState<Nodo>({
    id: 0,
    nombre: '',
    posicionx: 0,
    posiciony: 0,
    descripcion: '',
    cuenca_id: undefined,
    es_movil: false,
  });

  const [markerPosition, setMarkerPosition] = useState<[number, number]>([-43.306843, -65.395059]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [cuencas, setCuencas] = useState<Cuenca[]>([]);
  const [cuencasCompletas, setCuencasCompletas] = useState<CuencaCompleta[]>([]);
  const [nodos, setNodos] = useState<Nodo[]>([]);

  // Guardar la posición original del nodo cuando se carga por primera vez
  // Esto permite restaurar la posición si el usuario deselecciona la cuenca
  const [posicionOriginalNodo, setPosicionOriginalNodo] = useState<[number, number] | null>(null);
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
  const [showVariablesModal, setShowVariablesModal] = useState(false);

  const initialPosition: [number, number] = [-43.306843, -65.395059];

  useEffect(() => {
    if (nodoInicial) {
      setFormData(nodoInicial);
      setMarkerPosition([nodoInicial.posicionx, nodoInicial.posiciony]);

      // Guardar la posición original del nodo para poder restaurarla
      // si el usuario deselecciona la cuenca
      setPosicionOriginalNodo([nodoInicial.posicionx, nodoInicial.posiciony]);
      console.log('💾 Posición original del nodo guardada:', [nodoInicial.posicionx, nodoInicial.posiciony]);
    }
    obtenerCuencas();
    obtenerNodos();
  }, [nodoInicial]);

  // Efecto para manejar ESC (volver) y Ctrl+Z (restaurar posición)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC: Volver a la página anterior
      if (e.key === 'Escape') {
        e.preventDefault();
        handleVolver();
      }

      // Ctrl+Z: Restaurar posición original del nodo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (posicionOriginalNodo) {
          setMarkerPosition(posicionOriginalNodo);
          setFormData(prev => ({
            ...prev,
            posicionx: posicionOriginalNodo[0],
            posiciony: posicionOriginalNodo[1],
            cuenca_id: undefined, // También deseleccionar la cuenca
          }));
          console.log('⏪ Ctrl+Z - Posición restaurada a la original:', posicionOriginalNodo);
          mostrarToast('info', 'Posición restaurada a la original (Ctrl+Z)');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [posicionOriginalNodo]);

  const mostrarToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removerToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const obtenerCuencas = async () => {
    try {
      const response = await axios.get('http://localhost:8000/cuencas/select-options');
      setCuencas(response.data);

      // Obtener también las cuencas completas con polígonos para calcular centroides
      const responseCuencasCompletas = await axios.get('http://localhost:8000/cuencas');
      setCuencasCompletas(responseCuencasCompletas.data);
    } catch (error) {
      console.error('Error al obtener las cuencas:', error);
      mostrarToast('error', 'No se pudieron obtener las cuencas');
    }
  };

  const obtenerNodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/nodos');
      setNodos(response.data);
    } catch (error) {
      console.error('Error al obtener los nodos:', error);
    }
  };

  /**
   * Calcula el centroide (centro geométrico) de una cuenca a partir de su polígono.
   *
   * @param cuencaId - ID de la cuenca
   * @returns Objeto con lat y lng del centroide, o null si no se pudo calcular
   */
  const calcularCentroideCuenca = (cuencaId: number): { lat: number; lng: number } | null => {
    const cuenca = cuencasCompletas.find(c => c.id === cuencaId);
    if (!cuenca || !cuenca.poligono || !cuenca.poligono.coordinates || cuenca.poligono.coordinates.length === 0) {
      return null;
    }

    // Obtener las coordenadas del polígono (primer anillo del polígono)
    const coordenadas = cuenca.poligono.coordinates[0];

    if (coordenadas.length < 3) {
      return null;
    }

    // Calcular el centroide
    let centroLat = 0;
    let centroLng = 0;

    coordenadas.forEach(coord => {
      centroLng += coord[0]; // longitude
      centroLat += coord[1]; // latitude
    });

    centroLat /= coordenadas.length;
    centroLng /= coordenadas.length;

    return { lat: centroLat, lng: centroLng };
  };

  /**
   * Calcula una posición cercana al centroide que no esté superpuesta con otros nodos.
   *
   * Implementa un algoritmo de búsqueda en espiral para encontrar una posición libre
   * alrededor del centroide de la cuenca.
   *
   * @param centroide - Coordenadas del centroide de la cuenca
   * @param cuencaId - ID de la cuenca
   * @returns Objeto con lat y lng de una posición sin superposición
   */
  const calcularPosicionSinSuperposicion = (
    centroide: { lat: number; lng: number },
    cuencaId: number
  ): { lat: number; lng: number } => {
    // Obtener todos los nodos de esta cuenca, excluyendo el nodo actual que se está editando
    const nodosEnCuenca = nodos.filter(n => n.cuenca_id === cuencaId && n.id !== formData.id);

    console.log('=== Debug Posicionamiento (EditarNodo) ===');
    console.log('Cuenca ID:', cuencaId);
    console.log('Nodo actual ID:', formData.id);
    console.log('Total nodos:', nodos.length);
    console.log('Nodos en esta cuenca (excluyendo actual):', nodosEnCuenca.length);
    console.log('Centroide:', centroide);

    if (nodosEnCuenca.length === 0) {
      // Si no hay otros nodos en la cuenca, usar el centroide directamente
      console.log('No hay otros nodos en la cuenca, usando centroide directo');
      return centroide;
    }

    // Radio de búsqueda inicial (en grados, aproximadamente 100 metros)
    const radioBase = 0.001;
    const maxIntentos = 50;
    const distanciaMinima = 0.0005; // Distancia mínima entre nodos

    // Verificar si una posición está muy cerca de otro nodo
    const estaDemasiadoCerca = (lat: number, lng: number) => {
      return nodosEnCuenca.some(nodo => {
        const distancia = Math.sqrt(
          Math.pow(nodo.posicionx - lat, 2) +
          Math.pow(nodo.posiciony - lng, 2)
        );
        const cerca = distancia < distanciaMinima;
        if (cerca) {
          console.log(`Muy cerca del nodo ${nodo.nombre} (distancia: ${distancia})`);
        }
        return cerca;
      });
    };

    // Verificar si el centroide está libre
    if (!estaDemasiadoCerca(centroide.lat, centroide.lng)) {
      console.log('Centroide está libre, usando posición central');
      return centroide;
    }

    console.log('Centroide ocupado, buscando posición alternativa...');

    // Intentar encontrar una posición libre cerca del centroide usando búsqueda en espiral
    for (let i = 0; i < maxIntentos; i++) {
      const angulo = (Math.PI * 2 * i) / 8; // 8 posiciones alrededor del centro
      const radio = radioBase * (1 + Math.floor(i / 8)); // Aumentar el radio en cada vuelta

      const nuevaLat = centroide.lat + Math.cos(angulo) * radio;
      const nuevaLng = centroide.lng + Math.sin(angulo) * radio;

      if (!estaDemasiadoCerca(nuevaLat, nuevaLng)) {
        console.log(`Posición libre encontrada en intento ${i + 1}, radio: ${radio.toFixed(6)}`);
        return { lat: nuevaLat, lng: nuevaLng };
      }
    }

    // Si no encuentra una posición libre, agregar un pequeño offset aleatorio
    const offsetAleatorio = radioBase * (1 + Math.random());
    const anguloAleatorio = Math.random() * Math.PI * 2;

    console.log('No se encontró posición libre, usando offset aleatorio');

    return {
      lat: centroide.lat + Math.cos(anguloAleatorio) * offsetAleatorio,
      lng: centroide.lng + Math.sin(anguloAleatorio) * offsetAleatorio,
    };
  };

  /**
   * Maneja los cambios en los inputs del formulario.
   *
   * Lógica especial para cuenca_id:
   * - Si se deselecciona la cuenca (valor vacío): restaura la posición original del nodo
   * - Si se selecciona una cuenca: calcula el centroide y mueve el nodo automáticamente
   *   a una posición sin superposición dentro de la cuenca
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'cuenca_id') {
      // Manejar el cambio de cuenca

      if (value === '') {
        // El usuario está deseleccionando la cuenca (volviendo a "Sin cuenca asignada")

        if (posicionOriginalNodo) {
          // Restaurar la posición original del nodo
          setMarkerPosition(posicionOriginalNodo);
          setFormData(prev => ({
            ...prev,
            cuenca_id: undefined,
            posicionx: posicionOriginalNodo[0],
            posiciony: posicionOriginalNodo[1],
          }));
          console.log('🔄 Posición del nodo restaurada a la original:', posicionOriginalNodo);
          mostrarToast('info', 'El nodo volvió a su posición original');
        } else {
          // No hay posición original guardada, solo deseleccionar
          setFormData(prev => ({ ...prev, cuenca_id: undefined }));
        }
      } else {
        // El usuario está seleccionando una cuenca
        const cuencaId = parseInt(value);

        // Calcular el centroide de la cuenca
        const centroide = calcularCentroideCuenca(cuencaId);
        if (centroide) {
          // Calcular posición sin superposición
          const posicionFinal = calcularPosicionSinSuperposicion(centroide, cuencaId);

          // Actualizar la posición del marcador y el formData en tiempo real
          setMarkerPosition([posicionFinal.lat, posicionFinal.lng]);
          setFormData(prev => ({
            ...prev,
            cuenca_id: cuencaId,
            posicionx: posicionFinal.lat,
            posiciony: posicionFinal.lng,
          }));

          console.log('📍 Nodo movido automáticamente a cuenca:', { cuencaId, posicion: posicionFinal });
          mostrarToast('info', 'El nodo se ha ubicado en la cuenca seleccionada');
        } else {
          // Si no se pudo calcular el centroide, solo asignar la cuenca sin mover
          console.warn('No se pudo calcular el centroide de la cuenca', cuencaId);
          setFormData(prev => ({ ...prev, cuenca_id: cuencaId }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVolver = () => {
    navigate('/admin/nodos');
  };

  /**
   * Maneja el envío del formulario de edición.
   *
   * Verifica si se realizaron cambios comparando formData con nodoInicial.
   * Si no hay cambios, muestra una notificación y no envía la petición.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      mostrarToast('error', 'El nombre del nodo es requerido');
      return;
    }

    // Verificar si se realizaron cambios
    if (nodoInicial) {
      const sinCambios =
        formData.nombre === nodoInicial.nombre &&
        formData.descripcion === nodoInicial.descripcion &&
        formData.posicionx === nodoInicial.posicionx &&
        formData.posiciony === nodoInicial.posiciony &&
        (formData.cuenca_id || null) === (nodoInicial.cuenca_id || null) &&
        (formData.es_movil || false) === (nodoInicial.es_movil || false);

      if (sinCambios) {
        mostrarToast('info', 'No se realizaron cambios en el nodo');
        return;
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Edición',
      message: `¿Estás seguro de que deseas guardar los cambios en el nodo "${formData.nombre}"?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const nodoData = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            posicionx: formData.posicionx,
            posiciony: formData.posiciony,
            cuenca_id: formData.cuenca_id || null,
            es_movil: formData.es_movil || false,
          };

          await axios.put(`http://localhost:8000/nodo/${formData.id}`, nodoData);
          mostrarToast('success', 'Nodo actualizado exitosamente');

          // Esperar un momento antes de volver para que el usuario vea el mensaje
          setTimeout(() => {
            navigate('/admin/nodos');
          }, 1500);
        } catch (error: any) {
          console.error('Error al actualizar el nodo:', error);
          const errorMsg = error.response?.data?.detail || 'Error al actualizar el nodo';
          mostrarToast('error', errorMsg);
        }
      },
    });
  };

  // Componente para capturar clics en el mapa
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setFormData(prev => ({
          ...prev,
          posicionx: lat,
          posiciony: lng,
        }));
      },
    });
    return null;
  };

  // Marcador arrastrable
  const DraggableMarker = () => {
    const [position, setPosition] = useState<[number, number]>(markerPosition);

    useEffect(() => {
      setPosition(markerPosition);
    }, [markerPosition]);

    const eventHandlers = {
      dragend: (e: L.DragEndEvent) => {
        const marker = e.target;
        const newPos = marker.getLatLng();
        const newPosition: [number, number] = [newPos.lat, newPos.lng];
        setPosition(newPosition);
        setMarkerPosition(newPosition);
        setFormData(prev => ({
          ...prev,
          posicionx: newPos.lat,
          posiciony: newPos.lng,
        }));
      },
    };

    return (
      <Marker
        position={position}
        draggable={true}
        eventHandlers={eventHandlers}
        icon={nodoDefaultIcon}
      />
    );
  };

  return (
    <>
      <Breadcrumb pageName="Editar Nodo" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Editar Nodo: {formData.nombre || 'Cargando...'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6.5">
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Nombre <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              placeholder="Ingrese el nombre del nodo"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              placeholder="Ingrese una descripción (opcional)"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Cuenca
            </label>
            <select
              name="cuenca_id"
              value={formData.cuenca_id || ''}
              onChange={handleInputChange}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">Sin cuenca asignada</option>
              {cuencas.map(cuenca => (
                <option key={cuenca.value} value={cuenca.value}>
                  {cuenca.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="es_movil"
                checked={formData.es_movil || false}
                onChange={handleInputChange}
                className="sr-only"
              />
              <div className="relative">
                <div className={`block w-14 h-8 rounded-full transition ${formData.es_movil ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${formData.es_movil ? 'translate-x-6' : ''}`}></div>
              </div>
              <div className="ml-3">
                <span className="text-base font-medium text-black dark:text-white">
                  Nodo móvil
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activa esta opción si el nodo puede cambiar de posición
                </p>
              </div>
            </label>
          </div>

          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Posición <span className="text-meta-1">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                  Latitud
                </label>
                <input
                  type="number"
                  name="posicionx"
                  value={formData.posicionx}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-600 dark:text-gray-400">
                  Longitud
                </label>
                <input
                  type="number"
                  name="posiciony"
                  value={formData.posiciony}
                  onChange={handleInputChange}
                  step="0.000001"
                  required
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación
            </p>

            <MapContainer
              center={markerPosition}
              zoom={13}
              style={{ height: "500px", width: "100%", borderRadius: "8px" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <MapClickHandler />
              <DraggableMarker />
            </MapContainer>
          </div>

          {/* Botón para gestionar variables */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowVariablesModal(true)}
              className="flex items-center gap-2 rounded bg-blue-500 py-3 px-5 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Gestionar Variables
            </button>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Configura las variables que mide este nodo (temperatura, humedad, pH, etc.)
            </p>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleVolver}
              className="rounded bg-gray-200 px-6 py-3 font-medium text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-6 py-3 font-medium text-white hover:bg-opacity-90"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

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

      {/* Modal de Variables */}
      <VariablesModal
        nodoId={formData.id}
        isOpen={showVariablesModal}
        onClose={() => setShowVariablesModal(false)}
      />
    </>
  );
};

export default EditarNodo;
