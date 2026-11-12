import React from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import './styles.css';
import './theme-light.css';
import './palettes.css';
import { getTheme, applyTheme, getPalette, applyPalette } from './theme.js';
import App from './App.jsx';
applyPalette(getPalette()); applyTheme(getTheme()); // prima del primo disegno, così non lampeggia
createRoot(document.getElementById('root')).render(<App />);
