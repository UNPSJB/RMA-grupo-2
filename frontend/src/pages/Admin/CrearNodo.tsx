import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableNodos from '../../components/Tables/TableNodos';
import AdminMaps from '../../pages/Admin/AdminMaps';
import '../../css/AlertPopup.css';
import AlertPopup from '../../components/AlertPopup'
import AlertMensaje from '../../components/Alerts/'
import ToastContainer, { ToastData } from '../../components/Toast/ToastContainer';
import axios from 'axios';
import {useNavigate} from 'react-router-dom'

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

const CrearNodo = () => {
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [cuencas, setCuencas] = useState<Cuenca[]>([]);
  const [cuencasCompletas, setCuencasCompletas] = useState<CuencaCompleta[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [ isViewCreateNodo, setViewCreateNodo ] = useState(false);
  const toggleDropdown = () => { setViewCreateNodo((prev) => !prev) };
  const [alert, setPopUp] = useState<{type: string; message: string; description: string; onConfirm: () => void;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    posicionx: '',
    posiciony: '',
    descripcion: '',
    cuenca_id: '',
    es_movil: false,
  });

  const mostrarToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
    
  {/**
    const showAlert = (type: 'success' | 'error' | 'info' | 'warning', message: string, description = '') => {
        setPopUp({ type, message, description});
    };
    
    const confirmAction = (message: string, description: string, onConfirm: () => void) => {
        setPopUp({ message, description, onConfirm });
    };
*/}

 {/**
    const onEditUptMode = (nodo: Nodo) => {
        setFormData({
            id: nodo.id.toString(),
            nombre: nodo.nombre,
            posicionx: nodo.posicionx.toString(),
            posiciony: nodo.posiciony.toString(),
            descripcion: nodo.descripcion,      
        });
        setIsEdit(true);
    };
    
    const toggleEditMode = () => {
        setIsEdit(false);
        setFormData({
            id: '',
            nombre: '',
            posicionx: '',
            posiciony: '',
            descripcion: '',      
        });
    };
*/}
    
    const handleLocationChange = (lat: number, lng: number) => {
        setLat(lat);
        setLng(lng);
  };

  // Calcular el centroide del polígono de una cuenca
  const calcularCentroideCuenca = (cuencaId: number) => {
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

  // Calcular una posición cercana al centroide para evitar superposición
  const calcularPosicionSinSuperposicion = (centroide: { lat: number; lng: number }, cuencaId: number) => {
    // Obtener todos los nodos de esta cuenca
    const nodosEnCuenca = nodos.filter(n => n.cuenca_id === cuencaId);

    console.log('=== Debug Posicionamiento ===');
    console.log('Cuenca ID:', cuencaId);
    console.log('Total nodos:', nodos.length);
    console.log('Nodos en esta cuenca:', nodosEnCuenca.length);
    console.log('Nodos filtrados:', nodosEnCuenca.map(n => ({ id: n.id, nombre: n.nombre, cuenca_id: n.cuenca_id })));
    console.log('Centroide:', centroide);

    if (nodosEnCuenca.length === 0) {
      // Si no hay nodos en la cuenca, usar el centroide directamente
      console.log('No hay nodos en la cuenca, usando centroide directo');
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

    // Intentar encontrar una posición libre cerca del centroide
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

  // Manejar el cambio de cuenca
  const handleCuencaChange = (cuencaId: string) => {
    setFormData({ ...formData, cuenca_id: cuencaId });

    if (cuencaId) {
      const centroide = calcularCentroideCuenca(parseInt(cuencaId));
      if (centroide) {
        const posicionFinal = calcularPosicionSinSuperposicion(centroide, parseInt(cuencaId));
        setLat(posicionFinal.lat);
        setLng(posicionFinal.lng);
        mostrarToast('info', 'El nodo se ha ubicado en la cuenca seleccionada');
      }
    }
  };

  const obtenerCuencas = async () => {
    try {
      const response = await axios.get('http://localhost:8000/cuencas/select-options');
      setCuencas(response.data);

      // Obtener también las cuencas completas con polígonos
      const responseCuencasCompletas = await axios.get('http://localhost:8000/cuencas');
      setCuencasCompletas(responseCuencasCompletas.data);
    } catch (error) {
      console.error('Error al obtener las cuencas:', error);
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

  useEffect(() => {
    obtenerCuencas();
    obtenerNodos();
  }, []);

  // Refrescar nodos cuando cambia la cuenca seleccionada para tener datos actualizados
  useEffect(() => {
    if (formData.cuenca_id) {
      obtenerNodos();
    }
  }, [formData.cuenca_id]);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        posicionx: lat.toString(),
        posiciony: lng.toString(),
      }));
    }

  }, [lat, lng]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!formData.nombre || !formData.posicionx || !formData.posiciony) {
      mostrarToast('warning', 'Por favor completa todos los campos requeridos');
      return;
    }

    const data = {
      nombre: formData.nombre,
      posicionx: parseFloat(formData.posicionx),
      posiciony: parseFloat(formData.posiciony),
      descripcion: formData.descripcion || '',
      cuenca_id: formData.cuenca_id ? parseInt(formData.cuenca_id) : null,
      es_movil: formData.es_movil,
    };

    console.log('Enviando datos:', data);

    try {
      const response = await fetch('http://localhost:8000/nodo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const nuevoNodo = await response.json();
        console.log('Nodo creado exitosamente:', nuevoNodo);
        console.log('Cuenca asignada:', nuevoNodo.cuenca_id);

        if (nuevoNodo.cuenca_id) {
          mostrarToast('success', `Nodo creado y asignado a la cuenca correctamente`);
        } else {
          mostrarToast('success', 'Nodo creado correctamente');
        }

        // Esperar un momento para que el usuario vea la notificación
        setTimeout(() => {
          navigate('/admin/nodos');
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        mostrarToast('error', `Error al crear el nodo: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarToast('error', 'Error de conexión. No se pudo conectar con el servidor');
    }
  };
  
  {/**
  const obtenerNodos = async () => {
      try {
          const response = await axios.get('http://localhost:8000/nodos/');
          const nodos = response.data;
          setNodos(nodos);
        } catch (error) {
            console.error('Error al obtener los nodos:', error);
            
            setPopUp({
                type: 'error',
                message: 'Error',
                description: 'No se pudieron obtener los nodos, contacte con un administrador.',
            });
            
        }
    };
    */}

    {/**
        useEffect(() => {
            if (lat !== null && lng !== null) {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    posicionx: lat.toString(),
                    posiciony: lng.toString(),
                }));
            }
            //obtenerNodos();
        }, [lat, lng]);
    */}
    
  return (
    <>
        <Breadcrumb pageName="Nodos" />
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

        {/* ALERTA
        <div className="Alerta mb-4">
        {alert?.message && (
            <AlertPopup
            type={alert.type}
            message={alert.message}
            description={alert.description}
            onClose={() => {handleCancel}}
            onConfirm={() => {
                setConfirmAction(true)
            }}
            />
        )}
        </div>
            */}

          
        {/* VISTA CREACION  NODO */}
        
        <div className="flex flex-col gap-10">   
            <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <div className="relative">
                <span className="absolute right-4 top-4">
                    <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    </svg>
                </span>
                </div>
            </div>
            <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                Nombre
                </label>
                <div className="relative">
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    placeholder="Ingrese el nombre del nodo"
                    onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                    }
                    value={formData.nombre}
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />

                <span className="absolute right-4 top-4">
                    <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    </svg>
                </span>
                </div>
            </div>
            <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                Coordenada X
                </label>
                <div className="relative">
                <input
                    type="number"
                    id="posicionx"
                    name="posicionx"
                    placeholder="Ingrese la posición X del nodo"
                    onChange={(e) =>
                    setFormData({ ...formData, posicionx: e.target.value })
                    }
                    value={formData.posicionx}
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />

                <span className="absolute right-4 top-4">
                    <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    </svg>
                </span>
                </div>
            </div>

            <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                Coordenada Y
                </label>
                <div className="relative">
                <input
                    type="number"
                    name="posiciony"
                    id="posiciony"
                    placeholder="Ingrese la posición Y del nodo"
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    onChange={(e) =>
                    setFormData({ ...formData, posiciony: e.target.value })
                    }
                    value={formData.posiciony}
                />

                <span className="absolute right-4 top-4">
                    <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    </svg>
                </span>
                </div>
            </div>
             <AdminMaps
                onLocationChange={handleLocationChange}
                nodos={nodos}
                externalPosition={lat !== null && lng !== null ? { lat, lng } : null}
              />

            <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                Cuenca (opcional)
                </label>
                <div className="relative">
                <select
                    id="cuenca_id"
                    name="cuenca_id"
                    onChange={(e) => handleCuencaChange(e.target.value)}
                    value={formData.cuenca_id}
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                >
                    <option value="">Sin cuenca asignada</option>
                    {cuencas.map((cuenca) => (
                      <option key={cuenca.value} value={cuenca.value}>
                        {cuenca.label}
                      </option>
                    ))}
                </select>

                <span className="absolute right-4 top-4 pointer-events-none">
                    <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11 14.5L6 9.5H16L11 14.5Z" />
                    </svg>
                </span>
                </div>
            </div>

            <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                Descripción (opcional)
                </label>
                <div className="relative">
                <input
                    type="string"
                    id="descripcion"
                    name="descripcion"
                    placeholder="Ingrese una descripción"
                    onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                    }
                    value={formData.descripcion}
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />

                <span className="absolute right-4 top-4">
                    <svg
                    className="fill-current"
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    </svg>
                </span>
                </div>
            </div>

            <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="es_movil"
                    name="es_movil"
                    checked={formData.es_movil}
                    onChange={(e) =>
                      setFormData({ ...formData, es_movil: e.target.checked })
                    }
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


             <div className="md:w-1/2">
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Crear Nodo
            </button>
          </div>       
           
            </form> 
        </div>
    </>
  );
};
export default CrearNodo;
