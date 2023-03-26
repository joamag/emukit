import React, { FC, useEffect, useRef } from "react";

import "./canvas.css";

export type CanvasStructure = {
    canvas: HTMLCanvasElement;
    canvasOffScreen: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    canvasOffScreenContext: CanvasRenderingContext2D;
    canvasImage: ImageData;
    canvasBuffer: DataView;
};

type CanvasProps = {
    width: number;
    height: number;
    scaledWidth?: number | string;
    pixelRatio?: number;
    scale?: number;
    imageRendering?: "auto" | "crisp-edges" | "pixelated";
    style?: string[];
    onCanvas?: (structure: CanvasStructure) => void;
};

export const Canvas: FC<CanvasProps> = ({
    width,
    height,
    scaledWidth,
    pixelRatio = window.devicePixelRatio,
    scale = 1,
    imageRendering = "pixelated",
    style = [],
    onCanvas
}) => {
    const classes = () => ["canvas", ...style].join(" ");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvasRef.current) {
            const structure = initCanvas(
                width,
                height,
                scale * pixelRatio,
                canvasRef.current
            );
            structure && onCanvas && onCanvas(structure);
        }
    }, [canvasRef]);
    return (
        <canvas
            ref={canvasRef}
            className={classes()}
            style={{
                width: scaledWidth ?? width * scale,
                imageRendering: imageRendering
            }}
            width={width * scale * pixelRatio}
            height={height * scale * pixelRatio}
        />
    );
};

const initCanvas = (
    width: number,
    height: number,
    scale: number,
    canvas: HTMLCanvasElement,
    smoothing = false
): CanvasStructure | undefined => {
    const canvasOffScreen = document.createElement("canvas");
    canvasOffScreen.width = width;
    canvasOffScreen.height = height;
    const canvasOffScreenContext = canvasOffScreen.getContext("2d");
    if (!canvasOffScreenContext) {
        throw new Error("Not possible to obtain 2D context");
    }
    const canvasImage = canvasOffScreenContext.createImageData(width, height);
    const canvasBuffer = new DataView(canvasImage.data.buffer);

    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) {
        throw new Error("Not possible to obtain 2D context");
    }
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.scale(scale, scale);
    canvasContext.imageSmoothingEnabled = smoothing;

    return {
        canvas: canvas,
        canvasOffScreen: canvasOffScreen,
        canvasContext: canvasContext,
        canvasOffScreenContext: canvasOffScreenContext,
        canvasImage: canvasImage,
        canvasBuffer: canvasBuffer
    };
};

export default Canvas;
