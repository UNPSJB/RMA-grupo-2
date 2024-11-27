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
    const [codigo, setCodigo] = useState<string>('');
    const [isLinked, setIsLinked] = useState<boolean | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!codigo) {
            setAlert({
                type: 'error',
                message: 'Error',
                description: 'El código de verificación es requerido',
            });
            return;
        }

        const userid = localStorage.getItem('id');
        if (!userid) {
            setAlert({
                type: 'error',
                message: 'Error',
                description: 'No se encontró el ID de usuario',
            });
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/verificar-token?token=${codigo}&user_id=${userid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setAlert({
                    type: 'success',
                    message: 'Usted ha sido vinculado',
                    description: 'Ahora puede recibir notificaciones personalizadas',
                });
                setIsLinked(true);
            } else {
                setAlert({
                    type: 'error',
                    message: 'Error',
                    description: 'Algo ocurrió mal y no pudimos vincularlo',
                });
            }
        } catch (error) {
            console.error('Error:', error);
            setAlert({
                type: 'error',
                message: 'Error',
                description: 'Hubo un problema al intentar vincular al usuario',
            });
        }
    };

    const checkVinculacion = async () => {
        const userid = localStorage.getItem('id');
        console.log("User ID desde localStorage:", userid);
        if (userid) {
            try {
                const response = await fetch(`http://localhost:8000/verificar-vinculacion?user_id=${userid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const isVinculado = await response.json();
                    setIsLinked(isVinculado);
                }
            } catch (error) {
                console.error('Error al verificar la vinculación:', error);
                setAlert({
                    type: 'error',
                    message: 'Error',
                    description: 'Hubo un problema al verificar la vinculación',
                });
            }
        }
    };

    useEffect(() => {
        checkVinculacion();
    }, []);

    return (
        <>
            <Breadcrumb pageName="Vinculacion" />
            <div className="flex flex-col gap-10">
                {isLinked === null ? (
                    <p>Verificando...</p>
                ) : isLinked ? (
                    <div>
                        <p>¡Ya estás vinculado exitosamente!</p>
                        <p>Ahora puedes recibir notificaciones personalizadas.</p>
                    </div>
                ) : (
                    <>
                        <p>Escanea este QR para vincularte al bot</p>
                        <img src={rmaqr} alt="qr" className="w-50 h-50" />
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="mb-2.5 block font-medium text-black dark:text-white">
                                    Ingrese el código de telegram:
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="codigoinput"
                                        name="codigoinput"
                                        placeholder="token"
                                        onChange={(e) => setCodigo(e.target.value)}
                                        value={codigo}
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
                    </>
                )}
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
