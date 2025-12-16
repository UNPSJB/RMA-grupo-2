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
  id: number;
  nombre: string;
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

  const initialPosition: [number, number] = [-43.306843, -65.395059];

  useEffect(() => {
    if (nodoInicial) {
      setFormData(nodoInicial);
      setMarkerPosition([nodoInicial.posicionx, nodoInicial.posiciony]);
    }
    obtenerCuencas();
  }, [nodoInicial]);

  // Efecto para manejar ESC y volver
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleVolver();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'cuenca_id') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVolver = () => {
    navigate('/admin/nodos');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      mostrarToast('error', 'El nombre del nodo es requerido');
      return;
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
                <option key={cuenca.id} value={cuenca.id}>
                  {cuenca.nombre}
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
    </>
  );
};

export default EditarNodo;
