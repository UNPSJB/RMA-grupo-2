import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import React, { useEffect, useState } from 'react';
import rmaqr from '../../images/logo/rmaqr.svg';
import Alerts from '../../components/alerts';


const Vinculacion = () => {
    
    const [alertMsg, setAlert] = useState({
        type: '',
        message: '',
        description: '',
      });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!codigo) return;
        try {
            const userid = localStorage.getItem('id');
            const response = await fetch(`http://localhost:8000/verificar_codigo`, {
                method: 'PUT',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token:codigo, usuario_id: userid })
            });

            if (response.ok) {
                setAlert({
                    type: 'success',
                    message: 'Usted ha sido vinculado',
                    description: 'Ahora puede recibir notificaciones personalizadas',
                  });
            } else {
                setAlert({
                    type: 'error',
                    message: 'Error',
                    description: 'Algo ocurrió mal y no pudimos vincularlo',
                  });
            }
            } catch (error) {
            console.error('Error:', error);
        }
    };
    const [codigo, setCodigo] = useState<number>();
    useEffect(() => {
    }, []);
  
    return (
      <>
        <Breadcrumb pageName="Vinculacion" />  
        <div className="flex flex-col gap-10">
            <p>Escanea este QR para vincularte al bot</p>
            <img src={rmaqr} alt="qr" className='w-50 h-50' />
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Ingrese el código de telegram:
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="codigoinput"
                  name="codigoinput"
                  placeholder="token"
                  onChange={(e) => setCodigo(Number(e.target.value))}
                  className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>
            <div className="mb-5">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-700">
                Verificar
              </button>
            </div>           
          </form>
          <div className="Alerta mt-4">
          {alertMsg.message && (
            <Alerts
              type={alertMsg.type}
              message={alertMsg.message}
              description={alertMsg.description}
            />
          )}
        </div>
        </div>
      </>
    );
  };
  export default Vinculacion;