import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Temperatura {
    id:number;
    nodo: number;
    tipo: string;
    dato: number;
    tiempo: Date; 
}

const Temperaturas: React.FC = () => {
  const [temperaturas, setTemperaturas] = useState<Temperatura[]>([]);

  useEffect(() => {
    const obtenerTemperaturas = async () => {
      try {
        const response = await axios.get('http://localhost:8000/temperatura/');

        //const result = await response.json();

        setTemperaturas(response.data);
      } catch (error) {
        console.error('Error al obtener las temperaturas:', error);
      }
    };

    obtenerTemperaturas();
  }, []);

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px', border: '1px solid #ddd' }}>
      <h1>Lista de Temperaturas</h1>
      {temperaturas.length === 0 ? (
        <p>No hay datos de temperaturas disponibles.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {temperaturas.map((temperatura) => (
            <li key={temperatura.id} style={{ marginBottom: '15px', padding: '10px', borderBottom: '1px solid #ccc' }}>
              <strong>id:</strong> {temperatura.id}<br />
              <strong>Nodo:</strong> {temperatura.nodo}<br />
              <strong>Tipo:</strong> {temperatura.tipo}<br />
              <strong>Dato:</strong> {temperatura.dato}<br />
              <strong>Tiempo:</strong> {new Date(temperatura.tiempo).toLocaleString()}<br />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Temperaturas;
