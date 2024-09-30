import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import './Home.css'; // Ajusta la ruta de tu archivo CSS

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  {
    field: 'type',
    headerName: 'Type',
    width: 150,
  },
  {
    field: 'data',
    headerName: 'Data',
    width: 300,
  },
  {
    field: 'time',
    headerName: 'Time',
    width: 300,
  },
];

const rows = [
  { id: 0, type: 'temp_t', data: '22.276194173312078', time: '2024-09-30 16:39:17.689975' },
  { id: 1, type: 'temp_t', data: '21.65381983751234', time: '2024-09-30 16:40:12.783295' },
  { id: 2, type: 'temp_t', data: '23.87619412783281', time: '2024-09-30 16:41:05.123415' },
  { id: 3, type: 'temp_h', data: '45.32119832745172', time: '2024-09-30 16:42:45.674829' },
  { id: 4, type: 'temp_h', data: '50.98325471682319', time: '2024-09-30 16:43:28.998273' },
];

function Home() {
  return (
    <div style={{ height: 400, width: '100%' }}>
      <h1>DATOS TABULARES</h1>
      <DataGrid rows={rows} columns={columns} pageSize={5} />
    </div>
  );
}

export default Home; // Asegúrate de que esta línea esté presente
