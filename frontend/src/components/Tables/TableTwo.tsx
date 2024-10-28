import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

interface Medicion {
  id: number;
  nodo: number;
  tipo: string;
  dato: number;
  tiempo: string; // Cambia a string si viene como formato ISO
  bateria: string;
  error: boolean;
}

const TableTwo: React.FC = () => {
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerMediciones = async () => {
      try {
        const response = await axios.get('http://localhost:8000/medicion/');
        const dataWithIds = response.data.map((item: Omit<Medicion, 'id'>, index: number) => ({
          ...item,
          id: index, // or any unique identifier if available
        }));
        setMedicionData(dataWithIds);
      } catch (error) {
        console.error('Error al obtener las mediciones:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerMediciones();
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
        rows={medicionData}
        columns={columns}
        pageSizeOptions={[5, 50, 100]}
        rowsPerPageOptions={[5]}
        checkboxSelection
        sx={{
          bgcolor: '#f0f0f0',
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: '#1976d2',
            color: '#000000',
          },
          '& .MuiDataGrid-cell': {
            bgcolor: '#ffffff',
            color: '#000000',
          },
          '& .MuiDataGrid-cell:hover': {
            bgcolor: '#e0e0e0',
          },
          '& .MuiDataGrid-footerContainer': {
            bgcolor: '#1976d2',
            color: '#ffffff',
          },
        }}
      />
    </div>
  );
}

export default TableTwo;
