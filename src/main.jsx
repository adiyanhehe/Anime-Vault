import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { probeMirrors } from './api/streaming';
import './styles.css';

import { UserProvider } from './api/UserContext';

// Probe streaming API mirrors in the background immediately on startup
// so health data is warm by the time a user opens an anime page.
probeMirrors().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <UserProvider>
          <App />
        </UserProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
