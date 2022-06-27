import React, { useState, useRef, useEffect, useImperativeHandle } from "react";

class Point {
  x: number;
  y: number;
  lifetime: number;
  isMouseDown: boolean;

  constructor(x: number, y: number, isMouseDown: boolean) {
    this.x = x;
    this.y = y;
    this.isMouseDown = isMouseDown;
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
  const mouseDown = useRef(false);

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

    const points: Point[] = [];

    const addPoint = (
      x: number,
      y: number,
      needBroadCast?: boolean = false,
      mouseStatus?: boolean = false
    ) => {
      const point = new Point(
        x,
        y,
        !needBroadCast ? mouseStatus : mouseDown?.current ? true : false
      );
      points.push(point);
      if (needBroadCast) {
        props.broadcast(point);
      }
    };
    addPointRef.current = addPoint;

    canvas.onmousedown = function (event) {
      mouseDown.current = true;
    };

    canvas.onmouseup = function (event) {
      mouseDown.current = false;
    };

    canvas.onmousemove = ({ clientX, clientY }) => {
      const mousePosition = [
        clientX - canvas.offsetLeft,
        clientY - canvas.offsetTop,
      ];
      addPoint(mousePosition[0], mousePosition[1], true, undefined);
    };

    const animate = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const duration = (0.7 * (2 * 1000)) / 30;

      for (let i = 0; i < points.length; ++i) {
        const point = points[i];
        let lastPoint;

        if (points[i - 1] !== undefined && points[i - 1]?.isMouseDown) {
          lastPoint = points[i - 1];
        } else lastPoint = point;

        point.lifetime += 1;

        if (point.lifetime > duration) {
          points.shift();
        } else {
          const lifePercent = point.lifetime / duration;
          const spreadRate = 7 * (1 - lifePercent);
          ctx.lineJoin = "round";
          ctx.lineWidth = spreadRate;
          const red = Math.floor(190 - 190 * lifePercent);
          const green = 0;
          const blue = Math.floor(210 + 210 * lifePercent);
          ctx.strokeStyle = `rgb(${red},${green},${blue})`;
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.closePath();
        }
      }

      // If the user's mouse is currently on the canvas then draw the pointer cap
      // if (points.length) {
      //   const { x, y } = points[points.length - 1];
      //   ctx.beginPath();
      //   ctx.fillStyle = `rgb(${190},${0},${210})`;
      //   ctx.arc(x, y, 3, 0, Math.PI * 2, false);
      //   ctx.closePath();
      //   ctx.fill();
      // }

      requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
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
