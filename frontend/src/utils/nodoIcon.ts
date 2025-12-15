import L from 'leaflet';

// Icono personalizado para nodos (dispositivo de medición)
export const createNodoIcon = (color: string = '#10b981') => {
  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Sombra -->
      <ellipse cx="20" cy="35" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>

      <!-- Cuerpo principal del microcontrolador -->
      <rect x="8" y="12" width="24" height="18" rx="2" fill="${color}" stroke="#1f2937" stroke-width="2"/>

      <!-- Chip central -->
      <rect x="13" y="16" width="14" height="10" rx="1" fill="#1f2937" stroke="#374151" stroke-width="1"/>

      <!-- Detalles del chip -->
      <rect x="15" y="18" width="4" height="2" fill="#4b5563" rx="0.5"/>
      <rect x="21" y="18" width="4" height="2" fill="#4b5563" rx="0.5"/>
      <rect x="15" y="22" width="10" height="2" fill="#4b5563" rx="0.5"/>

      <!-- Pines superiores (4 pines) -->
      <rect x="10" y="8" width="2" height="4" fill="#374151" rx="0.5"/>
      <rect x="15" y="8" width="2" height="4" fill="#374151" rx="0.5"/>
      <rect x="23" y="8" width="2" height="4" fill="#374151" rx="0.5"/>
      <rect x="28" y="8" width="2" height="4" fill="#374151" rx="0.5"/>

      <!-- Pines inferiores (4 pines) -->
      <rect x="10" y="30" width="2" height="4" fill="#374151" rx="0.5"/>
      <rect x="15" y="30" width="2" height="4" fill="#374151" rx="0.5"/>
      <rect x="23" y="30" width="2" height="4" fill="#374151" rx="0.5"/>
      <rect x="28" y="30" width="2" height="4" fill="#374151" rx="0.5"/>

      <!-- LED indicador -->
      <circle cx="27" cy="15" r="2" fill="#ef4444"/>
      <circle cx="27" cy="15" r="2.5" fill="#ef4444" opacity="0.3"/>

      <!-- Etiqueta/texto simulado -->
      <rect x="14" y="27" width="3" height="1" fill="#6b7280" rx="0.3"/>
      <rect x="18" y="27" width="5" height="1" fill="#6b7280" rx="0.3"/>
    </svg>
  `;

  return L.divIcon({
    html: `<div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">${svgIcon}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Iconos predefinidos
export const nodoAvailableIcon = createNodoIcon('#60a5fa'); // Azul - nodo disponible
export const nodoAssignedIcon = createNodoIcon('#10b981'); // Verde - nodo asignado a cuenca
export const nodoDefaultIcon = createNodoIcon('#3b82f6'); // Azul estándar - nodo general
