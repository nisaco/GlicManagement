import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Playfair Display for the brand name
const link = document.createElement('link');
link.rel  = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600&display=swap';
document.head.appendChild(link);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
