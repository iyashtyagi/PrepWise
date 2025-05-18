"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

const UserCam = () => {
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

          if (result) {
            const landmarks = result.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const getCenter = (pts: { x: number, y: number }[]) => ({
              x: pts.reduce((sum, p) => sum + p.x, 0) / pts.length,
              y: pts.reduce((sum, p) => sum + p.y, 0) / pts.length,
            });
            const leftEyeCenter = getCenter(leftEye);
            const rightEyeCenter = getCenter(rightEye);

            const scaleX = width / video.videoWidth;
            const scaleY = height / video.videoHeight;

            // Draw red dots on eyes
            ctx!.fillStyle = "red";
            [leftEyeCenter, rightEyeCenter].forEach((pt) => {
              ctx!.beginPath();
              ctx!.arc(pt.x * scaleX, pt.y * scaleY, 5, 0, 2 * Math.PI);
              ctx!.fill();
            });

            // Draw a dense mask over the face using all 68 landmark points
            const faceOutline = landmarks.positions; // Use all points for dense mask

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
              ctx!.fillStyle = "rgba(255,0,0,0.3)"; // semi-transparent red mask
              ctx!.fill();
              ctx!.restore();
            }

            // Draw a semi-transparent blue face mask using all 68 landmark points
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
              ctx!.fillStyle = "rgba(30, 144, 255, 0.18)"; // industry-style blue mask
              ctx!.fill();
              ctx!.restore();
            }

            // Draw a thin, soft green mesh line
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
              ctx!.strokeStyle = "rgba(50, 220, 120, 0.7)"; // soft green
              ctx!.lineWidth = 1.2;
              ctx!.shadowColor = "rgba(0,0,0,0.15)";
              ctx!.shadowBlur = 2;
              ctx!.stroke();
              ctx!.restore();
            }

            // Draw small, semi-transparent green points at each landmark
            if (faceOutline && faceOutline.length > 0) {
              ctx!.save();
              ctx!.fillStyle = "rgba(50, 220, 120, 0.85)";
              faceOutline.forEach((pt) => {
                const x = pt.x * scaleX;
                const y = pt.y * scaleY;
                ctx!.beginPath();
                ctx!.arc(x, y, 1.8, 0, 2 * Math.PI);
                ctx!.fill();
              });
              ctx!.restore();
            }
          }
        }
      }
    };

    interval = setInterval(analyze, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default UserCam;