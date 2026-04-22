import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig
      reducedMotion="user"
      transition={{
        type: 'tween',
        ease: [0.32, 0.72, 0, 1],
        duration: 0.28,
      }}
    >
      <App />
    </MotionConfig>
  </React.StrictMode>
);