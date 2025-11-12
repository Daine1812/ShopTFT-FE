// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Import CSS thuần
import App from './App.tsx'

// Import Font Poppins từ Google Fonts
const poppinsLink = document.createElement('link');
poppinsLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700&display=swap';
poppinsLink.rel = 'stylesheet';
document.head.appendChild(poppinsLink);

// Import Font Awesome cho icon
const faLink = document.createElement('link');
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
faLink.rel = 'stylesheet';
document.head.appendChild(faLink);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)