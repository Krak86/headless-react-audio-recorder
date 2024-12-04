import path from "node:path";
import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vite.dev/guide/build
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "HeadlessReactAudioRecorder",
      fileName: (format) => `headless-react-audio-recorder.${format}.js`,
      formats: ["es", "umd"],
    },
    // https://rollupjs.org/configuration-options
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
        },
      },
    },
  },
}) satisfies UserConfig;
