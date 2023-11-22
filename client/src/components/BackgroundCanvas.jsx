import React, { useEffect, useRef } from "react";

const BackgroundCanvas = ({ loading }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext("2d");
    let w, h, dw, x0, y0;
    let step = 0;

    const init = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      let offset = h > 380 ? 100 : 65;
      offset = h > 800 ? 116 : offset;
      x0 = w / 2;
      y0 = h - offset;
      dw = Math.max(w, h, 1000) / 13;
      drawCircles();
    };

    const drawCircle = (radius) => {
      ctx.beginPath();
      const color = Math.round(255 * (1 - radius / Math.max(w, h)));
      ctx.strokeStyle = `rgba(${color},${color},${color}, 0.2)`;
      ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.lineWidth = 2;
    };

    const drawCircles = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        drawCircle(dw * i + (step % dw));
      }
      step += 1;
    };

    const animate = () => {
      if (loading || step % dw < dw - 5) {
        requestAnimationFrame(() => {
          drawCircles();
          animate();
        });
      }
    };

    window.addEventListener("resize", init);
    init();
    animate();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("resize", init);
    };
  }, [loading]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        position: "absolute",
        zIndex: -1,
        top: 0,
        left: 0,
        background: "#faf8f8",
      }}
    />
  );
};

export default BackgroundCanvas;
