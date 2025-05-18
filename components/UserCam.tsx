"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

// Delaunay triangulation for 68-point face landmarks
const TRIANGULATION = [
  0,1,36, 1,2,36, 2,3,36, 3,4,48, 4,5,48, 5,6,48, 6,7,48, 7,8,48, 8,9,54, 9,10,54, 10,11,54, 11,12,54, 12,13,54, 13,14,54, 14,15,54, 15,16,54,
  17,18,36, 18,19,36, 19,20,36, 20,21,36, 22,23,45, 23,24,45, 24,25,45, 25,26,45,
  27,28,39, 28,29,39, 29,30,39, 30,31,39, 31,32,39, 32,33,39, 33,34,39, 34,35,39,
  36,37,41, 37,38,41, 38,39,41, 39,40,41, 41,42,47, 42,43,47, 43,44,47, 44,45,47,
  48,49,59, 49,50,59, 50,51,59, 51,52,59, 52,53,59, 53,54,59, 54,55,59, 55,56,59, 56,57,59, 57,58,59, 58,48,59,
  60,61,67, 61,62,67, 62,63,67, 63,64,67, 64,65,67, 65,66,67, 66,60,67
];

interface UserCamProps {
  isMaskEnable?: boolean;
}

const UserCam = ({ isMaskEnable = false }: UserCamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream;

    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`);
      await faceapi.nets.faceExpressionNet.loadFromUri(`${MODEL_URL}/face_expression`);
      await faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`);
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {}
    };

    loadModels().then(startCamera);

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const analyze = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        faceapi.nets.tinyFaceDetector.params
      ) {
        const video = videoRef.current;
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (canvasRef.current && video) {
          const rect = video.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;
          canvasRef.current.width = width;
          canvasRef.current.height = height;

          const ctx = canvasRef.current.getContext("2d");
          ctx?.clearRect(0, 0, width, height);

          if (result && isMaskEnable) {
            const landmarks = result.landmarks;
            const scaleX = width / video.videoWidth;
            const scaleY = height / video.videoHeight;

            // Draw a dense mask over the face using all 68 landmark points
            const faceOutline = landmarks.positions; // Use all points for dense mask

            // Draw a thin, soft green mesh line (optional, keep if you want outline)
            if (faceOutline && faceOutline.length > 0) {
              ctx!.save();
              ctx!.beginPath();
              faceOutline.forEach((pt, idx) => {
                const x = pt.x * scaleX;
                const y = pt.y * scaleY;
                if (idx === 0) ctx!.moveTo(x, y);
                else ctx!.lineTo(x, y);
              });
              ctx!.closePath();
              ctx!.strokeStyle = "rgba(50, 220, 120, 0.7)";
              ctx!.lineWidth = 1.2;
              ctx!.shadowColor = "rgba(0,0,0,0.15)";
              ctx!.shadowBlur = 2;
              ctx!.stroke();
              ctx!.restore();
            }

            // Draw mesh triangles (true mesh)
            ctx!.save();
            ctx!.strokeStyle = "rgba(0,255,128,0.5)";
            ctx!.lineWidth = 1;
            for (let i = 0; i < TRIANGULATION.length; i += 3) {
              const a = faceOutline[TRIANGULATION[i]];
              const b = faceOutline[TRIANGULATION[i + 1]];
              const c = faceOutline[TRIANGULATION[i + 2]];
              ctx!.beginPath();
              ctx!.moveTo(a.x * scaleX, a.y * scaleY);
              ctx!.lineTo(b.x * scaleX, b.y * scaleY);
              ctx!.lineTo(c.x * scaleX, c.y * scaleY);
              ctx!.closePath();
              ctx!.stroke();
            }
            ctx!.restore();

            // Draw mesh vertices (points)
            ctx!.save();
            ctx!.fillStyle = "rgba(0,255,128,0.95)";
            faceOutline.forEach((pt) => {
              ctx!.beginPath();
              ctx!.arc(pt.x * scaleX, pt.y * scaleY, 2, 0, 2 * Math.PI);
              ctx!.fill();
            });
            ctx!.restore();
          }
        }
      }
    };

    interval = setInterval(analyze, 200);
    return () => clearInterval(interval);
  }, [isMaskEnable]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded-lg"
        style={{
          transform: "scaleX(-1)", // Mirror horizontally
          WebkitTransform: "scaleX(-1)",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          transform: "scaleX(-1)", // Mirror mesh too
          WebkitTransform: "scaleX(-1)",
        }}
      />
    </div>
  );
};

export default UserCam;