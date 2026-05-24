// =====================================================
// PONTO DE ENTRADA DO REACT
// Equivalente ao main.js do Vue ou ao index.ts do Angular.
// O React "monta" a aplicação dentro do <div id="root"> do index.html.
// =====================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Importa o Tailwind CSS

// React.StrictMode ativa avisos extras em desenvolvimento.
// Não tem efeito em produção.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
