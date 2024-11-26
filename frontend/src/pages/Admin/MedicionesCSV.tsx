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
      <h1>Importar archivo CSV</h1>
      <input type="file" accept=".csv" onChange={manejarArchivo} />
      <button onClick={procesarArchivo}>Subir e Importar</button>
    </div>
  );
};

export default MedicionesCSV;