import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TableUsuarios from '../../components/Tables/TableUsuarios';


interface Usuario {
  id: number; // Asegúrate de que id sea obligatorio
  nombre: string;
  email: string;
  fecha_registro: string;
  rol: string;
}

const PanelUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<string | null>(null);

  const validRoles = ['admin', 'investigador', 'default'];

const handleUpdateRole = async (id: number, newRole: string) => {
  if (!validRoles.includes(newRole.toLowerCase())) {
    return;
  }

  try {
    const url = `http://localhost:8000/usuario/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({id: id, rol: newRole}),
    });

    if (response.ok) {
      obtenerUsuarios(); // Actualizamos la lista de usuarios
    } else {
      const errorData = await response.json();
      console.error('Error del servidor:', errorData);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error en la conexión al servidor');
  }
};


  const obtenerUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:8000/usuarios/');
      let usuarios = response.data;
      usuarios = usuarios.sort((a: Usuario, b: Usuario) => a.id - b.id);
      setUsuarios(usuarios);
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  return (
    <>
      <Breadcrumb pageName="Usuarios" />
      <div className="flex flex-col gap-10">
        <TableUsuarios
          usuarios={usuarios}
          setUsuarios={setUsuarios}
          onUpdateRole={handleUpdateRole}
        />
        {usuarioEditando && (
          <div className="mb-4 text-gray-700">
            Editando usuario: <strong>{usuarioEditando}</strong>
          </div>
        )}
      </div>
    </>
  );
};

export default PanelUsuarios;
