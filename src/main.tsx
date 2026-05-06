import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { DataProvider } from './context/DataContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { PinGate } from './components/PinGate.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PinGate>
      <ToastProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ToastProvider>
    </PinGate>
  </React.StrictMode>,
)
