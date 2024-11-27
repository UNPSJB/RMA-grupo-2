import React, { useState } from "react";

const MedicionesCSV: React.FC = () => {
  const [archivo, setArchivo] = useState<File | null>(null);

  // Manejar la selección del archivo
  const manejarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setArchivo(file);
    }
  };

  // Leer y procesar el archivo CSV
  const procesarArchivo = async () => {
    if (!archivo) {
      alert("Por favor, selecciona un archivo CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
    const formData = new FormData();
    formData.append('archivo', archivo);
      // Aquí puedes enviar el contenido al backend
      try {
        const response = await fetch('http://localhost:8000/medicioncsv', {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          alert("Archivo importado exitosamente");
        } else {
          alert("Error al importar el archivo");
        }
      } catch (error) {
        console.error("Error al enviar el archivo:", error);
        alert("Ocurrió un error al importar el archivo");
      }
    };
    reader.readAsText(archivo);
  };

  return (
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        {/* Título opcional */}
        <h2 className="text-center text-lg font-bold mb-4">Cargar mediciones importando CSV</h2>
        
        {/* Contenedor del texto */}
        <div className="text-left">
          <p style={{ fontSize: '16px', color: 'black', lineHeight: '1.5' }}>
            El archivo CSV debe tener las siguientes columnas:
            <br />
            <code>nodo, dato, tiempo, error, tipo</code>
            <br />
            Ejemplo:
            <br />
            <code>1, 25, 17:59:59.999999-03, false, 1</code>
            <br />
            Siendo:
            <ul className="list-disc ml-6 mt-2">
              <li><strong>nodo</strong> y <strong>tipo</strong>: id de nodo y de tipo de dato válidos</li>
              <li><strong>dato</strong>: el valor de la medición (entero o flotante)</li>
              <li><strong>tiempo</strong>: timestamp con zona horaria</li>
              <li><strong>error</strong>: `true` o `false`</li>
            </ul>
          </p>
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <h1>Importar archivo CSV</h1>
        <input type="file" accept=".csv" onChange={manejarArchivo} />
        <button
              onClick={procesarArchivo}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-700"
            >
              Subir e Importar
        </button>
      </div>
    </div>
  </div>
  );
};

export default MedicionesCSV;