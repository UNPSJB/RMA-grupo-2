import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Temperatura {
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
        const response = await axios.get('http://localhost:8000/temperatura');

        //const result = await response.json();

        setTemperaturas(response.data);
      } catch (error) {
        console.error('Error al obtener las temperaturas:', error);
      }
    };

    obtenerTemperaturas();
  }, []);

  return (
    <div>
      <h1>Lista de Temperaturas</h1>
      <table>
        <thead>
          <tr>
            <th>Nodo</th>
            <th>Tipo</th>
            <th>Dato</th>
            <th>Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {temperaturas.map((temperatura) => (
            <tr key={temperatura.nodo}>
              <td>{temperatura.nodo}</td>
              <td>{temperatura.tipo}</td>
              <td>{temperatura.dato}</td>
              <td>{new Date(temperatura.tiempo).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Temperaturas;
