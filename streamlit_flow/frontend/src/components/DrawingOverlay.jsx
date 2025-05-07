import React, { 
  useRef, useEffect, useImperativeHandle, 
  forwardRef 
} from 'react';

const DrawingOverlay = forwardRef(({
  children,
  penColor = 'black',
  lineWidth = 2,
}, ref) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const ctxRef       = useRef(null);
  const drawing      = useRef(false);

  // Initialize canvas
  useEffect(() => {
    const resize = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const canvas = canvasRef.current;
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = penColor;
      ctx.lineWidth   = lineWidth;
      ctx.lineCap     = 'round';
      ctxRef.current  = ctx;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [penColor, lineWidth]);

  // Expose getDataURL() to parent via ref
  useImperativeHandle(ref, () => ({
    getDataURL: () => canvasRef.current.toDataURL(),
    clear:     () => {
      const c = canvasRef.current;
      ctxRef.current.clearRect(0, 0, c.width, c.height);
    },
    getDrawingBounds: () => {
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      const w      = canvas.width;
      const h      = canvas.height;
      const data   = ctx.getImageData(0, 0, w, h).data;

      let top    = h, left = w, right = 0, bottom = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const alpha = data[(y * w + x) * 4 + 3];
          if (alpha > 0) {
            if (x < left)   left   = x;
            if (x > right)  right  = x;
            if (y < top)    top    = y;
            if (y > bottom) bottom = y;
          }
        }
      }
      if (right < left || bottom < top) {
        return null; // nothing drawn
      }
      return {
        x:      left,
        y:      top,
        width:  right  - left,
        height: bottom - top,
      };
    }
  }), []);

  // Drawing handlers (pen/touch only)
  const down = e => {
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
      e.preventDefault(); e.stopPropagation();
      const rect = canvasRef.current.getBoundingClientRect();
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      drawing.current = true;
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };
  const move = e => {
    if (drawing.current && (e.pointerType === 'pen' || e.pointerType === 'touch')) {
      e.preventDefault(); e.stopPropagation();
      const rect = canvasRef.current.getBoundingClientRect();
      ctxRef.current.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctxRef.current.stroke();
    }
  };
  const up = e => {
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
      e.preventDefault(); e.stopPropagation();
      drawing.current = false;
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onPointerDownCapture={down}
      onPointerMoveCapture={move}
      onPointerUpCapture={up}
    >
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

export { DrawingOverlay };
