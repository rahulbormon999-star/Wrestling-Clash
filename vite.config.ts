import { defineConfig } from 'vite';

// Vercel zero-config-এ Vite প্রজেক্ট automatically ধরে ফেলে —
// শুধু build output "dist" ফোল্ডারে যাবে এটা নিশ্চিত করলেই হলো।
export default defineConfig({
  build: {
    outDir: 'dist',
  },
});
