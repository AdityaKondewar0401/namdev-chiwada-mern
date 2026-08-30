import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import './index.css';

// The browser's own scroll-restoration can replay a stale scroll position
// it recorded for a URL earlier in this tab's history, fighting App.jsx's
// ScrollToTop and HomePage's hash-scroll effect (both of which already
// manage scroll explicitly). Since the app owns scroll restoration itself,
// disable the native one.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

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