import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Nodo {
  id: number;
  nombre: string;
  descripcion?: string;
  posicionx: number;
  posiciony: number;
  es_movil?: boolean;
  cuenca_id?: number;
}

interface PosicionHistorial {
  id: number;
  nodo_id: number;
  latitud: number;
  longitud: number;
  timestamp: string;
}

interface TrayectoriaModalProps {
  nodo: Nodo;
  isOpen: boolean;
  onClose: () => void;
}

const TrayectoriaModal: React.FC<TrayectoriaModalProps> = ({ nodo, isOpen, onClose }) => {
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [trayectoria, setTrayectoria] = useState<PosicionHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Configurar fechas por defecto (últimos 7 días)
  useEffect(() => {
    if (isOpen) {
      const ahora = new Date();
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

      setFechaHasta(formatDateTimeLocal(ahora));
      setFechaDesde(formatDateTimeLocal(hace7Dias));
      setTrayectoria([]);
      setError('');
    }
  }, [isOpen, nodo]);

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const cargarTrayectoria = async () => {
    if (!fechaDesde || !fechaHasta) {
      setError('Debes seleccionar un rango de fechas');
      return;
    }

    // Validar que la fecha desde sea menor o igual a la fecha hasta
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    if (desde > hasta) {
      setError('La fecha "Desde" debe ser anterior o igual a la fecha "Hasta"');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/historial-posiciones/filtrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nodo_id: nodo.id,
          fecha_desde: new Date(fechaDesde).toISOString(),
          fecha_hasta: new Date(fechaHasta).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cargar trayectoria');
      }

      const data = await response.json();
      setTrayectoria(data);

      if (data.length === 0) {
        setError('No hay datos de trayectoria para el período seleccionado');
      }
    } catch (err) {
      setError('Error al cargar la trayectoria');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcularCentroMapa = (): [number, number] => {
    if (trayectoria.length === 0) {
      return [nodo.posicionx, nodo.posiciony];
    }

    const latPromedio =
      trayectoria.reduce((sum, pos) => sum + pos.latitud, 0) / trayectoria.length;
    const lonPromedio =
      trayectoria.reduce((sum, pos) => sum + pos.longitud, 0) / trayectoria.length;

    return [latPromedio, lonPromedio];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white dark:bg-boxdark rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark px-6 py-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Trayectoria de {nodo.nombre}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Fecha Desde
              </label>
              <input
                type="datetime-local"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Fecha Hasta
              </label>
              <input
                type="datetime-local"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={cargarTrayectoria}
                disabled={loading}
                className="w-full rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
              >
                {loading ? 'Cargando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Mapa */}
          {trayectoria.length > 0 && (
            <div className="mb-4">
              <div style={{ height: '500px', width: '100%' }}>
                <MapContainer
                  center={calcularCentroMapa()}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Polyline */}
                  <Polyline
                    positions={trayectoria.map((pos) => [pos.latitud, pos.longitud])}
                    color="#3C50E0"
                    weight={3}
                    opacity={0.7}
                  />

                  {/* Marcadores */}
                  {trayectoria.map((pos, index) => (
                    <Marker key={pos.id} position={[pos.latitud, pos.longitud]}>
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">
                            Punto {index + 1} de {trayectoria.length}
                          </p>
                          <p className="mt-1">
                            <strong>Fecha:</strong>{' '}
                            {new Date(pos.timestamp).toLocaleString('es-AR')}
                          </p>
                          <p>
                            <strong>Coordenadas:</strong> ({pos.latitud.toFixed(6)},{' '}
                            {pos.longitud.toFixed(6)})
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Información */}
              <div className="mt-4 rounded bg-gray-50 p-4 dark:bg-meta-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Total de puntos:</strong> {trayectoria.length} |{' '}
                  <strong>Primer registro:</strong>{' '}
                  {new Date(trayectoria[0].timestamp).toLocaleString('es-AR')} |{' '}
                  <strong>Último registro:</strong>{' '}
                  {new Date(
                    trayectoria[trayectoria.length - 1].timestamp
                  ).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          )}

          {/* Mensaje inicial */}
          {trayectoria.length === 0 && !error && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Selecciona un rango de fechas y presiona "Buscar" para visualizar la
                trayectoria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrayectoriaModal;
