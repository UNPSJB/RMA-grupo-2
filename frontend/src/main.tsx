import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './app';
//import App from './App';
import './css/style.css';
import './css/satoshi.css';
import 'global'
//import 'jsvectmap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
  <Router>
    <App />
  </Router>
  </React.StrictMode>,
);

