import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import and expose the Supabase API wrapper to mock Electron's preload behavior
import { supabaseAPI } from './db/supabaseAPI';
window.electronAPI = supabaseAPI;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);