import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // 👈 Nuevo import

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 Nuevo plugin
  ],
  base: '/movistar-fibra/', // ⚠️ Recuerda que este debe ser el nombre de tu repo
});