import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { DataProvider } from './context/DataContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { UserGate } from './components/UserGate.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <DataProvider>
        <UserProvider>
          <UserGate>
            <App />
          </UserGate>
        </UserProvider>
      </DataProvider>
    </ToastProvider>
  </React.StrictMode>,
)
