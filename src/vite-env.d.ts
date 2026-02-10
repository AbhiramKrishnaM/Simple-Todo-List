/// <reference types="vite/client" />

// Declare module for audio files
declare module "*.mp3" {
  const src: string;
  export default src;
}
