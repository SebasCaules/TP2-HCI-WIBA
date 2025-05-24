declare module 'qrcode' {
    interface QRCodeOptions {
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
        type?: 'image/png' | 'image/jpeg' | 'image/webp';
        quality?: number;
        margin?: number;
        scale?: number;
        width?: number;
        color?: {
            dark?: string;
            light?: string;
        };
    }

    function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
    function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<void>;
    function toString(text: string, options?: QRCodeOptions): Promise<string>;

    export default {
        toDataURL,
        toCanvas,
        toString
    };
} 