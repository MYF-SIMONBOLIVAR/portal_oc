import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ESTO DEFINE EL EQUIVALENTE A __DIRNAME EN ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  // ... resto de tu configuración
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
};
