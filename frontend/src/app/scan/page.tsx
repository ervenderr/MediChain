"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/constants";

export default function QRScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [cameraPermission, setCameraPermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError("");
      setCameraPermission("pending");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setCameraPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setScanning(true);
        scanForQRCode();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraPermission("denied");
      setError(
        "Camera access denied. Please allow camera access or enter the code manually."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const scanForQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.videoWidth === 0) {
      // Video not ready yet, try again
      setTimeout(scanForQRCode, 100);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Try to use a QR code library if available
      // For now, we'll implement manual detection
      // In a real app, you'd use a library like 'qr-scanner' or 'jsqr'

      // Check if we can detect QR patterns (simplified)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // For demo purposes, we'll simulate QR detection
      // In production, use a proper QR code detection library
      setTimeout(() => {
        if (scanning) {
          scanForQRCode();
        }
      }, 500);
    } catch (err) {
      console.error("QR scan error:", err);
      setTimeout(() => {
        if (scanning) {
          scanForQRCode();
        }
      }, 500);
    }
  };

  const processQRCode = (qrText: string) => {
    try {
      // Check if it's a MediChain URL
      const url = new URL(qrText);
      const pathParts = url.pathname.split("/");

      // Expected format: /view/[accessLevel]/[token]
      if (pathParts.length === 4 && pathParts[1] === "view") {
        const accessLevel = pathParts[2];
        const token = pathParts[3];

        if (["emergency", "basic", "full"].includes(accessLevel) && token) {
          stopCamera();
          router.push(`/view/${accessLevel}/${token}`);
          return;
        }
      }

      setError("This QR code is not a valid MediChain health record code.");
    } catch (err) {
      setError(
        "Invalid QR code format. Please scan a MediChain health record QR code."
      );
    }
  };

  const handleManualEntry = () => {
    const token = manualToken.trim();
    if (!token) {
      setError("Please enter a valid token");
      return;
    }

    // Try to determine access level from token context or ask user
    // For now, we'll default to emergency
    router.push(`/view/emergency/${token}`);
  };

  const parseManualUrl = () => {
    try {
      const url = new URL(manualToken.trim());
      const pathParts = url.pathname.split("/");

      if (pathParts.length === 4 && pathParts[1] === "view") {
        const accessLevel = pathParts[2];
        const token = pathParts[3];
        router.push(`/view/${accessLevel}/${token}`);
        return;
      }
    } catch (err) {
      // Not a valid URL, treat as token
      handleManualEntry();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src="/medichain.svg" 
                alt="MediChain" 
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold text-blue-600">
                MediChain QR Scanner
              </h1>
            </div>
            <p className="text-gray-600">
              Scan QR codes to access patient health information
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Camera Scanner */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📷 Camera Scanner
            </h2>

            {!scanning && cameraPermission !== "granted" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to Scan
                </h3>
                <p className="text-gray-600 mb-6">
                  Point your camera at a MediChain QR code to view health
                  information
                </p>
                <button
                  onClick={startCamera}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  📷 Start Camera Scanner
                </button>
              </div>
            )}

            {scanning && (
              <div className="text-center">
                <div className="relative inline-block">
                  <video
                    ref={videoRef}
                    className="w-full max-w-md rounded-lg border"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="absolute inset-4 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                  </div>
                </div>
                <p className="text-gray-600 mt-4 mb-4">
                  Position QR code within the frame
                </p>
                <button
                  onClick={stopCamera}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop Scanner
                </button>
              </div>
            )}

            {cameraPermission === "denied" && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Camera Access Denied
                </h3>
                <p className="text-gray-600 mb-4">
                  To use the camera scanner, please allow camera access in your
                  browser settings and refresh the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⌨️ Manual Entry
            </h2>
            <p className="text-gray-600 mb-4">
              Can&apos;t scan the QR code? Enter the URL or token manually:
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Enter full URL or token code..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={parseManualUrl}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Access
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p className="mb-2">
                <strong>Examples:</strong>
              </p>
              <p>
                • Full URL: http://localhost:3001/view/emergency/abc123token
              </p>
              <p>• Token only: abc123token (will use emergency access)</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            💡 How to Use This Scanner
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <div>
              <p className="font-medium">For Healthcare Providers:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  Click &quot;Start Camera Scanner&quot; to activate your camera
                </li>
                <li>Point camera at the patient&apos;s MediChain QR code</li>
                <li>Health information will load automatically</li>
                <li>Perfect for emergency rooms, clinics, and pharmacies</li>
              </ul>
            </div>
            <div className="mt-4">
              <p className="font-medium">Alternative Options:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  Use your phone&apos;s built-in camera app to scan QR codes
                </li>
                <li>Copy/paste QR code URLs into the manual entry field</li>
                <li>Enter just the token code for emergency access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">🔒</span>
            <div>
              <h3 className="font-medium text-green-900 mb-2">
                Security & Privacy
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>
                  • All QR codes are time-limited and automatically expire
                </li>
                <li>• Access attempts are logged for security purposes</li>
                <li>• Patients control what information is shared</li>
                <li>• No personal data is stored on this device</li>
                <li>• Camera access is used only for QR code scanning</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
