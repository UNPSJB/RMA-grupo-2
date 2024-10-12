import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';


interface Temperatura {
  id: number;
  nodo: number;
  tipo: string;
  dato: number;
  tiempo: string; // Cambia a string si viene como formato ISO
}

const TableTwo: React.FC = () => {
  const [temperatureData, setTemperatureData] = useState<Temperatura[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerTemperaturas = async () => {
      try {
        const response = await axios.get('http://localhost:8000/temperatura/');
        setTemperatureData(response.data);
      } catch (error) {
        console.error('Error al obtener las temperaturas:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerTemperaturas();
  }, []);

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'nodo', headerName: 'Nodo', width: 150 },
    { field: 'tipo', headerName: 'Tipo', width: 150 },
    { field: 'dato', headerName: 'Dato', width: 150 },
    { field: 'tiempo', headerName: 'Tiempo', width: 200 },
  ];

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ height: 500, width: '100%' }}>
      <h1>DATOS MEDICIONES</h1>
      <DataGrid
        rows={temperatureData}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        sx={{
          bgcolor: '#f0f0f0', // Cambia el color de fondo
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: '#1976d2', // Color de fondo de los encabezados
            color: '#000000', // Color de texto de los encabezados
          },
          '& .MuiDataGrid-cell': {
            bgcolor: '#ffffff', // Color de fondo de las celdas
            color: '#000000', // Color de texto de las celdas
          },
          '& .MuiDataGrid-cell:hover': {
            bgcolor: '#e0e0e0', // Color de fondo al pasar el ratón sobre la celda
          },
          '& .MuiDataGrid-footerContainer': {
            bgcolor: '#1976d2', // Color de fondo del pie de página
            color: '#ffffff', // Color de texto del pie de página
          },
        }}
      />
    </div>
  );
}

export default TableTwo;
