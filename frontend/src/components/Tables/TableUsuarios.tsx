import React, { useState } from 'react';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  fecha_registro: string;
  rol: string;
}

interface TableUsuariosProps {
  usuarios: Usuario[];
  setUsuarios: (usuarios: Usuario[]) => void;
  onUpdateRole: (id: number, newRole: string) => void;
}

const TableUsuarios: React.FC<TableUsuariosProps> = ({
  usuarios,
  setUsuarios,
  onUpdateRole,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<{ [key: number]: string }>({});
  const [updateStatus, setUpdateStatus] = useState<{ id: number; message: string | null }>({ id: 0, message: null });

  const handleRoleChange = async (id: number, newRole: string) => {
    setSelectedRoles((prev) => ({ ...prev, [id]: newRole }));
    
    try {
      await onUpdateRole(id, newRole.toLowerCase());
      setUpdateStatus({ id, message: 'Rol actualizado exitosamente.' });
    } catch (error) {
      setUpdateStatus({ id, message: 'Error al actualizar el rol.' });
    }
  };

  if (usuarios.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Usuarios</h4>
      <div className="flex flex-col" style={{ maxHeight: '400px', overflowY: 'scroll' }}>
        <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5 sticky top-0 z-10">
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Nombre</h5></div>
          <div className="p-2.5 xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Email</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Rol</h5></div>
          <div className="p-2.5 text-center xl:p-5"><h5 className="text-sm font-medium uppercase xsm:text-base">Cambiar Rol</h5></div>
        </div>

        {usuarios.map((usuario) => (
          <div className="grid grid-cols-4 sm:grid-cols-5 border-b border-stroke dark:border-strokedark" key={usuario.id}>
            <div className="flex items-center gap-3 p-2.5 xl:p-5"><p className="text-black dark:text-white">{usuario.nombre}</p></div>
            <div className="flex items-center gap-3 p-2.5 xl:p-5"><p className="text-black dark:text-white">{usuario.email}</p></div>
            <div className="flex items-center justify-center p-2.5 xl:p-5"><p className="text-black dark:text-white">{usuario.rol}</p></div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <select
                value={selectedRoles[usuario.id] || usuario.rol}
                onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                className="rounded-lg border border-stroke bg-transparent p-2 text-black outline-none"
              >
                <option value="default">Default</option>
                <option value="investigador">Investigador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {updateStatus.id === usuario.id && updateStatus.message && (
              <div className="text-sm text-green-500">{updateStatus.message}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableUsuarios;
