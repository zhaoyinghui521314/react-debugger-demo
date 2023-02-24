// import React from 'react'
import { createRoot } from 'react-dom/client';
// import App from './App'
// import './index.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

// debugger;
const App = (
  <div key="hello" hello="react debugger demo">
    hello react debugger
  </div>
);
console.log('App:', App);

debugger;
const root = createRoot(document.getElementById('root'));
console.log('root:', root);
