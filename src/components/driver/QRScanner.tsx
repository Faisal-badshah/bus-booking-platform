import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, SwitchCamera } from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<string[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices.map(d => d.id));
      }
    }).catch(err => {
      console.error("Error getting cameras:", err);
    });
  }, []);

  useEffect(() => {
    if (isScanning && cameras.length > 0) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScanning, cameras, currentCameraIndex]);

  const startScanner = async () => {
    if (scannerRef.current) {
      await stopScanner();
    }

    try {
      hasScannedRef.current = false;
      scannerRef.current = new Html5Qrcode("qr-reader");
      
      const cameraId = cameras[currentCameraIndex];
      
      await scannerRef.current.start(
        cameraId,
        {
          fps: 20,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: currentCameraIndex === 0 ? "environment" : "user"
          }
        },
        (decodedText) => {
          // Only process first successful scan
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            onScanSuccess(decodedText);
            handleStopScanning();
            toast.success("QR Code detected!");
          }
        },
        (error) => {
          // Silently ignore NotFoundException (no QR in frame)
          if (onScanError && !error.includes("NotFoundException")) {
            console.warn("QR scan error:", error);
          }
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start camera");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleStartScanning = () => {
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
  };

  const handleSwitchCamera = async () => {
    if (cameras.length > 1) {
      setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
      toast.info(`Switched to ${currentCameraIndex === 0 ? "front" : "back"} camera`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Scanner</CardTitle>
        <CardDescription>
          Scan passenger tickets to verify and mark as boarded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning ? (
          <Button onClick={handleStartScanning} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Start Scanning
          </Button>
        ) : (
          <>
            <div className="relative">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
              
              {/* Camera Switch Button */}
              {cameras.length > 1 && (
                <Button
                  onClick={handleSwitchCamera}
                  size="icon"
                  className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <SwitchCamera className="h-6 w-6" />
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleStopScanning} 
              variant="destructive" 
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
