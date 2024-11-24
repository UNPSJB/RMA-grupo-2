import React from 'react';
import TableSensores from '../../components/Tables/TableSensores';


const AdminParametro: React.FC = () => {
  return (
    <div className="admin-parametro">
      <h2 className="mb-6 text-2xl font-semibold text-black dark:text-white">
        Administrador de Parámetros
      </h2>
      <TableSensores />
    </div>
  );
};

export default AdminParametro;
