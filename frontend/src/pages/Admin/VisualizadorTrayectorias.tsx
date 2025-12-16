import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
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
  es_movil: boolean;
  cuenca_id?: number;
}

interface PosicionHistorial {
  id: number;
  nodo_id: number;
  latitud: number;
  longitud: number;
  timestamp: string;
}

const VisualizadorTrayectorias: React.FC = () => {
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<number | null>(null);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [trayectoria, setTrayectoria] = useState<PosicionHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Cargar nodos móviles al montar el componente
  useEffect(() => {
    cargarNodosMoviles();
  }, []);

  const cargarNodosMoviles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/nodos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar nodos');
      }

      const data = await response.json();
      // Filtrar solo nodos móviles
      const nodosMoviles = data.filter((nodo: Nodo) => nodo.es_movil === true);
      setNodos(nodosMoviles);
    } catch (err) {
      setError('Error al cargar nodos móviles');
      console.error(err);
    }
  };

  const cargarTrayectoria = async () => {
    if (!nodoSeleccionado) {
      setError('Debes seleccionar un nodo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Si no hay fechas, cargar toda la trayectoria del nodo
      if (!fechaDesde && !fechaHasta) {
        const response = await fetch(`http://localhost:8000/historial-posiciones/nodo/${nodoSeleccionado}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar trayectoria');
        }

        const data = await response.json();
        setTrayectoria(data);

        if (data.length === 0) {
          setError('No hay datos de trayectoria para este nodo');
        }
      } else {
        // Si hay fechas, filtrar por rango
        if (!fechaDesde || !fechaHasta) {
          setError('Debes seleccionar ambas fechas o ninguna');
          setLoading(false);
          return;
        }

        // Validar que la fecha desde sea menor o igual a la fecha hasta
        const desde = new Date(fechaDesde);
        const hasta = new Date(fechaHasta);

        if (desde > hasta) {
          setError('La fecha "Desde" debe ser anterior o igual a la fecha "Hasta"');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8000/historial-posiciones/filtrar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nodo_id: nodoSeleccionado,
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
      }
    } catch (err) {
      setError('Error al cargar la trayectoria');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas de la trayectoria
  const calcularEstadisticas = () => {
    if (trayectoria.length < 2) return null;

    // Calcular distancia total usando la fórmula de Haversine
    // Esta fórmula calcula la distancia más corta entre dos puntos en la superficie de una esfera
    // teniendo en cuenta la curvatura de la Tierra
    const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radio de la Tierra en kilómetros

      // Convertir diferencias de latitud y longitud a radianes
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      // Aplicar fórmula de Haversine
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      // Distancia = Radio de la Tierra * ángulo central
      return R * c;
    };

    // Sumar las distancias entre cada par de puntos consecutivos
    let distanciaTotal = 0;
    for (let i = 1; i < trayectoria.length; i++) {
      distanciaTotal += calcularDistancia(
        trayectoria[i - 1].latitud,
        trayectoria[i - 1].longitud,
        trayectoria[i].latitud,
        trayectoria[i].longitud
      );
    }

    return {
      distanciaTotal: distanciaTotal.toFixed(2),
      puntos: trayectoria.length,
    };
  };

  const estadisticas = calcularEstadisticas();

  // Calcular centro del mapa basado en la trayectoria
  const calcularCentroMapa = (): [number, number] => {
    if (trayectoria.length === 0) {
      return [-43.2994, -65.1025]; // Centro de Chubut por defecto
    }

    const latPromedio =
      trayectoria.reduce((sum, pos) => sum + pos.latitud, 0) / trayectoria.length;
    const lonPromedio =
      trayectoria.reduce((sum, pos) => sum + pos.longitud, 0) / trayectoria.length;

    return [latPromedio, lonPromedio];
  };

  return (
    <>
      <Breadcrumb pageName="Visualizador de Trayectorias" />

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Filtros de Búsqueda
          </h3>
        </div>

        <div className="p-6.5">
          {/* Selector de Nodo */}
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Nodo Móvil
            </label>
            <select
              value={nodoSeleccionado || ''}
              onChange={(e) => setNodoSeleccionado(Number(e.target.value))}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">Selecciona un nodo</option>
              {nodos.map((nodo) => (
                <option key={nodo.id} value={nodo.id}>
                  {nodo.nombre} (ID: {nodo.id})
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">
                Fecha Desde <span className="text-sm text-gray-500">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">
                Fecha Hasta <span className="text-sm text-gray-500">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            💡 Deja las fechas vacías para ver toda la trayectoria del nodo
          </p>

          {/* Botón de Búsqueda */}
          <button
            onClick={cargarTrayectoria}
            disabled={loading}
            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
          >
            {loading ? 'Cargando...' : 'Mostrar Trayectoria'}
          </button>

          {/* Mensajes de Error */}
          {error && (
            <div className="mt-4 rounded-sm border border-red-500 bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="text-sm font-medium text-black dark:text-white">
              Distancia Total Recorrida
            </div>
            <div className="mt-2 text-2xl font-bold text-primary">
              {estadisticas.distanciaTotal} km
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Calculada con fórmula de Haversine (distancia sobre la superficie terrestre)
            </p>
          </div>

          <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="text-sm font-medium text-black dark:text-white">
              Puntos Registrados
            </div>
            <div className="mt-2 text-2xl font-bold text-primary">
              {estadisticas.puntos}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Total de posiciones guardadas en el historial
            </p>
          </div>
        </div>
      )}

      {/* Mapa con Trayectoria */}
      {trayectoria.length > 0 && (
        <div className="mt-4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Mapa de Trayectoria
            </h3>
          </div>
          <div className="p-6.5">
            <div style={{ height: '600px', width: '100%' }}>
              <MapContainer
                center={calcularCentroMapa()}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Polyline que conecta todos los puntos */}
                <Polyline
                  positions={trayectoria.map((pos) => [pos.latitud, pos.longitud])}
                  color="#3C50E0"
                  weight={3}
                  opacity={0.7}
                />

                {/* Marcadores en cada posición */}
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
          </div>
        </div>
      )}
    </>
  );
};

export default VisualizadorTrayectorias;
