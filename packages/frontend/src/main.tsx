import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Quitar extensión .tsx
import './index.css'
import { AuthProvider } from './contexts/AuthContext' // Quitar extensión .tsx

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Envolver App con AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)