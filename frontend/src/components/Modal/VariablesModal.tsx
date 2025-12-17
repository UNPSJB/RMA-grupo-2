import React, { useState, useEffect } from 'react';

interface VariableNodo {
  id?: number;
  nombre: string;
  unidad_medida: string;
  valor_actual: number | null;
  rango_min: number | null;
  rango_max: number | null;
  activo: boolean;
}

interface VariablesModalProps {
  nodoId?: number; // Opcional: si existe el nodo, si no se está creando
  isOpen: boolean;
  onClose: () => void;
  onVariablesChange?: (variables: VariableNodo[]) => void; // Para modo creación
}

const VariablesModal: React.FC<VariablesModalProps> = ({
  nodoId,
  isOpen,
  onClose,
  onVariablesChange,
}) => {
  const [variables, setVariables] = useState<VariableNodo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingVariable, setEditingVariable] = useState<VariableNodo | null>(null);

  // Formulario
  const [formData, setFormData] = useState<VariableNodo>({
    nombre: '',
    unidad_medida: '',
    valor_actual: null,
    rango_min: null,
    rango_max: null,
    activo: true,
  });

  // Cargar variables si el nodo ya existe
  useEffect(() => {
    if (isOpen && nodoId) {
      cargarVariables();
    } else if (isOpen && !nodoId) {
      // Modo creación: inicializar lista vacía
      setVariables([]);
    }
  }, [isOpen, nodoId]);

  const cargarVariables = async () => {
    if (!nodoId) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/nodos/${nodoId}/variables`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar variables');
      }

      const data = await response.json();
      setVariables(data);
    } catch (err) {
      setError('Error al cargar las variables del nodo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? null
            : parseFloat(value)
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const validarFormulario = (): string | null => {
    if (!formData.nombre.trim()) {
      return 'El nombre de la variable es obligatorio';
    }

    // Verificar nombres duplicados
    const nombreExiste = variables.some(
      (v) =>
        v.nombre.toLowerCase() === formData.nombre.toLowerCase() &&
        v.id !== editingVariable?.id
    );

    if (nombreExiste) {
      return `Ya existe una variable con el nombre "${formData.nombre}"`;
    }

    if (formData.rango_min !== null && formData.rango_max !== null) {
      if (formData.rango_min > formData.rango_max) {
        return 'El rango mínimo no puede ser mayor que el rango máximo';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    if (nodoId) {
      // Modo edición: guardar en servidor
      if (editingVariable?.id) {
        await actualizarVariable();
      } else {
        await crearVariable();
      }
    } else {
      // Modo creación: agregar a lista local
      if (editingVariable) {
        // Editar en lista local
        const updatedVariables = variables.map((v) =>
          v === editingVariable ? { ...formData } : v
        );
        setVariables(updatedVariables);
        onVariablesChange?.(updatedVariables);
      } else {
        // Agregar a lista local
        const newVariables = [...variables, { ...formData }];
        setVariables(newVariables);
        onVariablesChange?.(newVariables);
      }

      resetForm();
    }
  };

  const crearVariable = async () => {
    if (!nodoId) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/nodos/${nodoId}/variables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear variable');
      }

      await cargarVariables();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al crear la variable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarVariable = async () => {
    if (!nodoId || !editingVariable?.id) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/variables/${editingVariable.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar variable');
      }

      await cargarVariables();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la variable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const eliminarVariable = async (variable: VariableNodo) => {
    if (nodoId && variable.id) {
      // Modo edición: eliminar del servidor
      if (!window.confirm(`¿Estás seguro de eliminar la variable "${variable.nombre}"?`)) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/variables/${variable.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al eliminar variable');
        }

        await cargarVariables();
      } catch (err) {
        setError('Error al eliminar la variable');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      // Modo creación: eliminar de lista local
      const newVariables = variables.filter((v) => v !== variable);
      setVariables(newVariables);
      onVariablesChange?.(newVariables);
    }
  };

  const editarVariable = (variable: VariableNodo) => {
    setEditingVariable(variable);
    setFormData({ ...variable });
    setShowForm(true);
    setError('');
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      unidad_medida: '',
      valor_actual: null,
      rango_min: null,
      rango_max: null,
      activo: true,
    });
    setEditingVariable(null);
    setShowForm(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white dark:bg-boxdark rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark px-6 py-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Gestionar Variables del Nodo
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Botón para agregar nueva variable */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-4 flex items-center gap-2 rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar Variable
            </button>
          )}

          {/* Formulario */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 rounded border border-stroke p-4 dark:border-strokedark">
              <h4 className="mb-4 text-lg font-medium text-black dark:text-white">
                {editingVariable ? 'Editar Variable' : 'Nueva Variable'}
              </h4>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Nombre */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Temperatura, pH, Humedad"
                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    required
                  />
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleInputChange}
                    placeholder="Ej: °C, %, mg/L, hPa"
                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                {/* Valor Actual */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Valor Actual
                  </label>
                  <input
                    type="number"
                    name="valor_actual"
                    value={formData.valor_actual ?? ''}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="Ej: 25.5"
                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                {/* Rango Mínimo */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Rango Mínimo
                  </label>
                  <input
                    type="number"
                    name="rango_min"
                    value={formData.rango_min ?? ''}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="Ej: -10"
                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                {/* Rango Máximo */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    Rango Máximo
                  </label>
                  <input
                    type="number"
                    name="rango_max"
                    value={formData.rango_max ?? ''}
                    onChange={handleInputChange}
                    step="0.01"
                    placeholder="Ej: 50"
                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                {/* Activo */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-black dark:text-white">
                      Variable Activa
                    </span>
                  </label>
                </div>
              </div>

              {/* Botones del formulario */}
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
                >
                  {loading ? 'Guardando...' : editingVariable ? 'Actualizar' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded bg-gray-300 py-2 px-4 font-medium text-gray-700 hover:bg-gray-400 dark:bg-meta-4 dark:text-white dark:hover:bg-meta-4/80"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de Variables */}
          <div>
            <h4 className="mb-3 text-lg font-medium text-black dark:text-white">
              Variables Configuradas ({variables.length})
            </h4>

            {loading && variables.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : variables.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No hay variables configuradas. Agrega una nueva variable para comenzar.
              </p>
            ) : (
              <div className="space-y-3">
                {variables.map((variable, index) => (
                  <div
                    key={variable.id || index}
                    className="rounded border border-stroke p-4 dark:border-strokedark"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold text-black dark:text-white">
                            {variable.nombre}
                          </h5>
                          {variable.unidad_medida && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({variable.unidad_medida})
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              variable.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}
                          >
                            {variable.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Valor Actual:</span>
                            <span className="ml-1 font-medium text-black dark:text-white">
                              {variable.valor_actual ?? 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Mín:</span>
                            <span className="ml-1 font-medium text-black dark:text-white">
                              {variable.rango_min ?? 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Máx:</span>
                            <span className="ml-1 font-medium text-black dark:text-white">
                              {variable.rango_max ?? 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => editarVariable(variable)}
                          className="rounded bg-yellow-500 p-2 text-white hover:bg-yellow-600"
                          title="Editar"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => eliminarVariable(variable)}
                          className="rounded bg-red-500 p-2 text-white hover:bg-red-600"
                          title="Eliminar"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stroke dark:border-strokedark px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariablesModal;
