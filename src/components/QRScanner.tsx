import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: string) => void;
    fps?: number;
    qrbox?: number;
    aspectRatio?: number;
}

export default function QRScanner({
    onScanSuccess,
    onScanFailure,
    fps = 10,
    qrbox = 250,
    aspectRatio = 1.0,
}: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize the scanner
        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            {
                fps,
                qrbox,
                aspectRatio,
                supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            },
      /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error('Failed to clear html5QrcodeScanner', error);
                });
            }
        };
    }, [onScanSuccess, onScanFailure, fps, qrbox, aspectRatio]);

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border bg-card shadow-sm">
            <div id="qr-reader" className="w-full"></div>
        </div>
    );
}
