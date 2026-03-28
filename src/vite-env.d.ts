/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TREASURY_ADDRESS: string
  readonly VITE_TRON_TREASURY_ADDRESS: string
  readonly VITE_ALCHEMY_API_KEY: string
  readonly PLISIO_SECRET_KEY: string
  readonly PLISIO_API_KEY: string
  readonly APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'jsqr' {
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
  ): {
    binaryData: number[];
    data: string;
    chunks: any[];
    location: {
      topLeftCorner: { x: number; y: number };
      topRightCorner: { x: number; y: number };
      bottomRightCorner: { x: number; y: number };
      bottomLeftCorner: { x: number; y: number };
    };
  } | null;
}
