import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
console.log('path:', path.posix.resolve('scr/react/packacges/react-reconciler'));
export default defineConfig({
  define: {
    __DEV__: false, // 设置为false跳过 if(__dev__)的开发逻辑
    __EXPERIMENTAL__: true,
    __PROFILE__: true,
  },
  plugins: [
    react({
      // 运行时无需无需引入import React from 'react'
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      react: path.posix.resolve('src/react/packages/react'),
      'react-dom': path.posix.resolve('src/react/packages/react-dom'),
      'react-dom-bindings': path.posix.resolve('src/react/packages/react-dom-bindings'),
      'react-reconciler': path.posix.resolve('src/react/packages/react-reconciler'),
      scheduler: path.posix.resolve('src/react/packages/scheduler'),
      shared: path.posix.resolve('src/react/packages/shared'),
    },
  },
});
