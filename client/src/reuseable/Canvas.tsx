import React, { useState, useRef, useEffect, useImperativeHandle } from "react";

class Point {
  x: number;
  y: number;
  lifetime: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.lifetime = 0;
  }
}
interface Props {
  broadcast: (data: any) => void;
}
function Canvas(props: Props, ref: any) {
  const [{ cHeight, cWidth }, setSize] = useState({ cHeight: 0, cWidth: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const addPointRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    addPointFromMsg: addPointRef.current,
  }));
  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (canvas == null) {
      console.error("Canvas isn't defined?");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      console.error("Context isn't defined?");
      return;
    }

    // canvas.onmousedown = function (event) {
    //   mouseDown = true;
    // };

    // canvas.onmouseup = function (event) {
    //   mouseDown = false;
    //   lastPoint = null;
    // };

    const points: Point[] = [];

    const addPoint = (
      x: number,
      y: number,
      needBroadCast?: boolean = false
    ) => {
      const point = new Point(x, y);
      points.push(point);
      if (needBroadCast) {
        props.broadcast(point);
      }
    };
    addPointRef.current = addPoint;

    canvas.onmousemove = ({ clientX, clientY }) => {
      const mousePosition = [
        clientX - canvas.offsetLeft,
        clientY - canvas.offsetTop,
      ];
      addPoint(mousePosition[0], mousePosition[1], true);
    };

    const animate = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const duration = (0.7 * (2 * 1000)) / 30; // Last 80% of a frame per point

      // Draw each point at its current state
      for (let i = 0; i < points.length; ++i) {
        const point = points[i];
        let lastPoint;

        if (points[i - 1] !== undefined) {
          lastPoint = points[i - 1];
        } else lastPoint = point;

        point.lifetime += 1;

        if (point.lifetime > duration) {
          // If the point dies, remove it.
          points.shift();
        } else {
          // Otherwise animate it:

          // As the lifetime goes on, lifePercent goes from 0 to 1.
          const lifePercent = point.lifetime / duration;
          const spreadRate = 7 * (1 - lifePercent);

          ctx.lineJoin = "round";
          ctx.lineWidth = spreadRate;

          // As time increases decrease r and b, increase g to go from purple to green.
          const red = Math.floor(190 - 190 * lifePercent);
          const green = 0;
          const blue = Math.floor(210 + 210 * lifePercent);
          ctx.strokeStyle = `rgb(${red},${green},${blue})`;

          ctx.beginPath();

          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);

          // Unfortunately there's no way to make smoother angles https://stackoverflow.com/a/40653054/2070793

          ctx.stroke();
          ctx.closePath();
        }
      }

      // If the user's mouse is currently on the canvas then draw the pointer cap
      if (points.length) {
        const { x, y } = points[points.length - 1];
        ctx.beginPath();
        ctx.fillStyle = `rgb(${190},${0},${210})`;
        ctx.arc(x, y, 3, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    // Set height and width on load because if set in state body isn't defined yet.
    setSize({
      cHeight: document.body.clientHeight,
      cWidth: document.body.clientWidth,
    });

    window.addEventListener(
      "resize",
      () => {
        setSize({
          cHeight: document.body.clientHeight,
          cWidth: document.body.clientWidth,
        });
      },
      false
    );

    // If the device supports cursors, start animation.
    if (matchMedia("(pointer:fine)").matches) {
      startAnimation();
    }
  }, []);

  return (
    <div ref={ref}>
      <canvas ref={canvasRef} width={cWidth} height={cHeight} />
    </div>
  );
}

export default React.forwardRef(Canvas);
