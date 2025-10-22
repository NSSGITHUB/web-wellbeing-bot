import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    {
      name: 'copy-api-folder',
      closeBundle() {
        const apiSource = path.resolve(__dirname, 'api');
        const apiDest = path.resolve(__dirname, 'dist/api');
        
        // Create api directory in dist
        mkdirSync(apiDest, { recursive: true });
        
        // Copy all files from api to dist/api
        const copyRecursive = (src: string, dest: string) => {
          const entries = readdirSync(src);
          
          for (const entry of entries) {
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);
            
            if (statSync(srcPath).isDirectory()) {
              mkdirSync(destPath, { recursive: true });
              copyRecursive(srcPath, destPath);
            } else {
              copyFileSync(srcPath, destPath);
            }
          }
        };
        
        copyRecursive(apiSource, apiDest);
        console.log('✓ API folder copied to dist/api');
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
