import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import axios from 'axios';
import ToastContainer, { ToastData } from '../components/Toast/ToastContainer';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  contrasena: string;
  telefono?: string;
  username?: string;
  bio?: string;
  rol: string;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    username: '',
    bio: '',
    contrasena: '',
  });
  const [originalData, setOriginalData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    username: '',
    bio: '',
  });

  // Función para mostrar toast
  const mostrarToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removerToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('id');
        if (!userId) {
          mostrarToast('error', 'No se pudo obtener el ID del usuario');
          setLoading(false);
          return;
        }

        const response = await axios.get<UserData>(`http://localhost:8000/usuario/${userId}`);
        const userData = response.data;

        const dataToSet = {
          nombre: userData.nombre || '',
          email: userData.email || '',
          telefono: userData.telefono || '',
          username: userData.username || '',
          bio: userData.bio || '',
        };

        setFormData({
          ...dataToSet,
          contrasena: '', // No mostramos la contraseña por seguridad
        });

        setOriginalData(dataToSet);

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
        mostrarToast('error', 'Error al cargar la información del usuario');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        mostrarToast('error', 'No se pudo obtener el ID del usuario');
        setSaving(false);
        return;
      }

      // Verificar si hubo cambios en los datos (sin contar la contraseña vacía)
      const hasDataChanges = 
        formData.nombre !== originalData.nombre ||
        formData.email !== originalData.email ||
        formData.telefono !== originalData.telefono ||
        formData.username !== originalData.username ||
        formData.bio !== originalData.bio;

      const hasPasswordChange = formData.contrasena && formData.contrasena.trim() !== '';

      if (!hasDataChanges && !hasPasswordChange) {
        mostrarToast('info', 'No se realizó ningún cambio');
        setSaving(false);
        return;
      }

      // Si el usuario ingresó una contraseña, validarla
      if (formData.contrasena) {
        // Validar contraseña en el frontend antes de enviar
        if (formData.contrasena.length < 8) {
          mostrarToast('error', 'La contraseña debe tener al menos 8 caracteres');
          setSaving(false);
          return;
        }
        if (!/[A-Z]/.test(formData.contrasena)) {
          mostrarToast('error', 'La contraseña debe contener al menos una mayúscula');
          setSaving(false);
          return;
        }
        if (!/[0-9]/.test(formData.contrasena)) {
          mostrarToast('error', 'La contraseña debe contener al menos un número');
          setSaving(false);
          return;
        }
        if (!/[a-z]/.test(formData.contrasena)) {
          mostrarToast('error', 'La contraseña debe contener al menos una minúscula');
          setSaving(false);
          return;
        }
      }

      // Preparar datos para enviar
      const updateData: any = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        username: formData.username,
        bio: formData.bio,
      };

      // Solo incluir contraseña si el usuario la cambió
      if (formData.contrasena && formData.contrasena.trim() !== '') {
        updateData.contrasena = formData.contrasena;
      }

      await axios.put(`http://localhost:8000/usuario/${userId}`, updateData);

      mostrarToast('success', 'Información guardada correctamente');
      setSaving(false);

      // Actualizar los datos originales con los nuevos valores
      const newOriginalData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        username: formData.username,
        bio: formData.bio,
      };
      setOriginalData(newOriginalData);

      // Limpiar el campo de contraseña después de guardar
      setFormData(prev => ({ ...prev, contrasena: '' }));
    } catch (error: any) {
      console.error('Error al guardar los datos:', error);

      // Mostrar mensaje de error más específico
      if (error.response?.data?.detail) {
        // Si es un array de errores de validación
        if (Array.isArray(error.response.data.detail)) {
          const errorMessages = error.response.data.detail.map((err: any) => err.msg).join(', ');
          mostrarToast('error', errorMessages);
        } else {
          mostrarToast('error', error.response.data.detail);
        }
      } else {
        mostrarToast('error', 'Error al guardar la información. Por favor intenta de nuevo.');
      }

      setSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    // Recargar los datos originales
    window.location.reload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Crear URL de vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      mostrarToast('error', 'Por favor selecciona una foto primero');
      return;
    }

    setSaving(true);

    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        mostrarToast('error', 'No se pudo obtener el ID del usuario');
        setSaving(false);
        return;
      }

      // Crear FormData para enviar el archivo
      const formDataPhoto = new FormData();
      formDataPhoto.append('photo', selectedFile);

      // Enviar la foto al backend
      await axios.post(`http://localhost:8000/usuario/${userId}/photo`, formDataPhoto, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      mostrarToast('success', 'Foto subida correctamente');
      setSaving(false);
    } catch (error: any) {
      console.error('Error al subir la foto:', error);
      mostrarToast('error', error.response?.data?.detail || 'Error al subir la foto');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Configuración" />
        <div className="flex justify-center items-center py-20">
          <div className="text-black dark:text-white">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Configuración" />

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-5 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Información Personal
                </h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label
                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                        htmlFor="nombre"
                      >
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <span className="absolute left-4.5 top-4">
                          <svg
                            className="fill-current"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g opacity="0.8">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M3.72039 12.887C4.50179 12.1056 5.5616 11.6666 6.66667 11.6666H13.3333C14.4384 11.6666 15.4982 12.1056 16.2796 12.887C17.061 13.6684 17.5 14.7282 17.5 15.8333V17.5C17.5 17.9602 17.1269 18.3333 16.6667 18.3333C16.2064 18.3333 15.8333 17.9602 15.8333 17.5V15.8333C15.8333 15.1703 15.5699 14.5344 15.1011 14.0655C14.6323 13.5967 13.9964 13.3333 13.3333 13.3333H6.66667C6.00363 13.3333 5.36774 13.5967 4.8989 14.0655C4.43006 14.5344 4.16667 15.1703 4.16667 15.8333V17.5C4.16667 17.9602 3.79357 18.3333 3.33333 18.3333C2.8731 18.3333 2.5 17.9602 2.5 17.5V15.8333C2.5 14.7282 2.93899 13.6684 3.72039 12.887Z"
                                fill=""
                              />
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M9.99967 3.33329C8.61896 3.33329 7.49967 4.45258 7.49967 5.83329C7.49967 7.214 8.61896 8.33329 9.99967 8.33329C11.3804 8.33329 12.4997 7.214 12.4997 5.83329C12.4997 4.45258 11.3804 3.33329 9.99967 3.33329ZM5.83301 5.83329C5.83301 3.53211 7.69849 1.66663 9.99967 1.66663C12.3009 1.66663 14.1663 3.53211 14.1663 5.83329C14.1663 8.13448 12.3009 9.99996 9.99967 9.99996C7.69849 9.99996 5.83301 8.13448 5.83301 5.83329Z"
                                fill=""
                              />
                            </g>
                          </svg>
                        </span>
                        <input
                          className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                          type="text"
                          name="nombre"
                          id="nombre"
                          placeholder="Ingrese su nombre completo"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label
                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                        htmlFor="telefono"
                      >
                        Teléfono
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="tel"
                        name="telefono"
                        id="telefono"
                        placeholder="Ingrese su teléfono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-4">
                        <svg
                          className="fill-current"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g opacity="0.8">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M3.33301 4.16667C2.87658 4.16667 2.49967 4.54357 2.49967 5V15C2.49967 15.4564 2.87658 15.8333 3.33301 15.8333H16.6663C17.1228 15.8333 17.4997 15.4564 17.4997 15V5C17.4997 4.54357 17.1228 4.16667 16.6663 4.16667H3.33301ZM0.833008 5C0.833008 3.6231 1.9561 2.5 3.33301 2.5H16.6663C18.0432 2.5 19.1663 3.6231 19.1663 5V15C19.1663 16.3769 18.0432 17.5 16.6663 17.5H3.33301C1.9561 17.5 0.833008 16.3769 0.833008 15V5Z"
                              fill=""
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M0.983719 4.52215C1.24765 4.1451 1.76726 4.05341 2.1443 4.31734L9.99975 9.81615L17.8552 4.31734C18.2322 4.05341 18.7518 4.1451 19.0158 4.52215C19.2797 4.89919 19.188 5.4188 18.811 5.68272L10.4776 11.5161C10.1907 11.7169 9.80879 11.7169 9.52186 11.5161L1.18853 5.68272C0.811486 5.4188 0.719791 4.89919 0.983719 4.52215Z"
                              fill=""
                            />
                          </g>
                        </svg>
                      </span>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Ingrese su email"
                        value={formData.email}
                        onChange={handleInputChange}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="username"
                    >
                      Usuario
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="username"
                      id="username"
                      placeholder="Ingrese su nombre de usuario"
                      value={formData.username}
                      onChange={handleInputChange}
                      autoComplete="username"
                    />
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="bio"
                    >
                      Biografía
                    </label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-4">
                        <svg
                          className="fill-current"
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g opacity="0.8" clipPath="url(#clip0_88_10224)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M1.56524 3.23223C2.03408 2.76339 2.66997 2.5 3.33301 2.5H9.16634C9.62658 2.5 9.99967 2.8731 9.99967 3.33333C9.99967 3.79357 9.62658 4.16667 9.16634 4.16667H3.33301C3.11199 4.16667 2.90003 4.25446 2.74375 4.41074C2.58747 4.56702 2.49967 4.77899 2.49967 5V16.6667C2.49967 16.8877 2.58747 17.0996 2.74375 17.2559C2.90003 17.4122 3.11199 17.5 3.33301 17.5H14.9997C15.2207 17.5 15.4326 17.4122 15.5889 17.2559C15.7452 17.0996 15.833 16.8877 15.833 16.6667V10.8333C15.833 10.3731 16.2061 10 16.6663 10C17.1266 10 17.4997 10.3731 17.4997 10.8333V16.6667C17.4997 17.3297 17.2363 17.9656 16.7674 18.4344C16.2986 18.9033 15.6627 19.1667 14.9997 19.1667H3.33301C2.66997 19.1667 2.03408 18.9033 1.56524 18.4344C1.0964 17.9656 0.833008 17.3297 0.833008 16.6667V5C0.833008 4.33696 1.0964 3.70107 1.56524 3.23223Z"
                              fill=""
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M16.6664 2.39884C16.4185 2.39884 16.1809 2.49729 16.0056 2.67253L8.25216 10.426L7.81167 12.188L9.57365 11.7475L17.3271 3.99402C17.5023 3.81878 17.6008 3.5811 17.6008 3.33328C17.6008 3.08545 17.5023 2.84777 17.3271 2.67253C17.1519 2.49729 16.9142 2.39884 16.6664 2.39884ZM14.8271 1.49402C15.3149 1.00622 15.9765 0.732178 16.6664 0.732178C17.3562 0.732178 18.0178 1.00622 18.5056 1.49402C18.9934 1.98182 19.2675 2.64342 19.2675 3.33328C19.2675 4.02313 18.9934 4.68473 18.5056 5.17253L10.5889 13.0892C10.4821 13.196 10.3483 13.2718 10.2018 13.3084L6.86847 14.1417C6.58449 14.2127 6.28409 14.1295 6.0771 13.9225C5.87012 13.7156 5.78691 13.4151 5.85791 13.1312L6.69124 9.79783C6.72787 9.65131 6.80364 9.51749 6.91044 9.41069L14.8271 1.49402Z"
                              fill=""
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_88_10224">
                              <rect width="20" height="20" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </span>

                      <textarea
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        name="bio"
                        id="bio"
                        rows={6}
                        placeholder="Escriba su biografía aquí"
                        value={formData.bio}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="contrasena"
                    >
                      Cambiar Contraseña (opcional)
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="password"
                      name="contrasena"
                      id="contrasena"
                      placeholder="Deja en blanco para mantener la actual"
                      value={formData.contrasena}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                    />
                    {formData.contrasena && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <p>La contraseña debe tener:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li className={formData.contrasena.length >= 8 ? 'text-success' : ''}>
                            Mínimo 8 caracteres
                          </li>
                          <li className={/[A-Z]/.test(formData.contrasena) ? 'text-success' : ''}>
                            Al menos una mayúscula
                          </li>
                          <li className={/[a-z]/.test(formData.contrasena) ? 'text-success' : ''}>
                            Al menos una minúscula
                          </li>
                          <li className={/[0-9]/.test(formData.contrasena) ? 'text-success' : ''}>
                            Al menos un número
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </button>
                    <button
                      className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-span-5 xl:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Tu Foto
                </h3>
              </div>
              <div className="p-7">
                <form onSubmit={handlePhotoSubmit}>
                  {/* Vista previa de la imagen */}
                  {previewUrl && (
                    <div className="mb-4 flex flex-col items-center gap-3">
                      <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-primary">
                        <img
                          src={previewUrl}
                          alt="Vista previa"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDeletePhoto}
                        className="text-sm text-danger hover:underline"
                      >
                        Eliminar foto
                      </button>
                    </div>
                  )}

                  <div
                    id="FileUpload"
                    className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded border border-dashed border-primary bg-gray py-4 px-4 dark:bg-meta-4 sm:py-7.5"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M1.99967 9.33337C2.36786 9.33337 2.66634 9.63185 2.66634 10V12.6667C2.66634 12.8435 2.73658 13.0131 2.8616 13.1381C2.98663 13.2631 3.1562 13.3334 3.33301 13.3334H12.6663C12.8431 13.3334 13.0127 13.2631 13.1377 13.1381C13.2628 13.0131 13.333 12.8435 13.333 12.6667V10C13.333 9.63185 13.6315 9.33337 13.9997 9.33337C14.3679 9.33337 14.6663 9.63185 14.6663 10V12.6667C14.6663 13.1971 14.4556 13.7058 14.0806 14.0809C13.7055 14.456 13.1968 14.6667 12.6663 14.6667H3.33301C2.80257 14.6667 2.29387 14.456 1.91879 14.0809C1.54372 13.7058 1.33301 13.1971 1.33301 12.6667V10C1.33301 9.63185 1.63148 9.33337 1.99967 9.33337Z"
                            fill="#3C50E0"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7.5286 1.52864C7.78894 1.26829 8.21106 1.26829 8.4714 1.52864L11.8047 4.86197C12.0651 5.12232 12.0651 5.54443 11.8047 5.80478C11.5444 6.06513 11.1223 6.06513 10.8619 5.80478L8 2.94285L5.13807 5.80478C4.87772 6.06513 4.45561 6.06513 4.19526 5.80478C3.93491 5.54443 3.93491 5.12232 4.19526 4.86197L7.5286 1.52864Z"
                            fill="#3C50E0"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7.99967 1.33337C8.36786 1.33337 8.66634 1.63185 8.66634 2.00004V10C8.66634 10.3682 8.36786 10.6667 7.99967 10.6667C7.63148 10.6667 7.33301 10.3682 7.33301 10V2.00004C7.33301 1.63185 7.63148 1.33337 7.99967 1.33337Z"
                            fill="#3C50E0"
                          />
                        </svg>
                      </span>
                      <p>
                        <span className="text-primary">Haz clic para subir</span> o
                        arrastra y suelta
                      </p>
                      <p className="mt-1.5">SVG, PNG, JPG o GIF</p>
                      <p>(máx. 800 x 800px)</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="button"
                      onClick={handleDeletePhoto}
                    >
                      Cancelar
                    </button>
                    <button
                      className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
                      type="submit"
                      disabled={!selectedFile || saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenedor de notificaciones toast */}
      <ToastContainer toasts={toasts} onRemoveToast={removerToast} />
    </>
  );
};

export default Settings;
