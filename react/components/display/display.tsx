import React, { FC, useEffect, useMemo, useRef, useState } from "react";

import {
    createRenderer,
    destroyRenderer,
    drawCanvas,
    drawFrame,
    PixelFormat,
    Renderer,
    Shader
} from "../../../ts/index.ts";

import "./display.css";

const PIXEL_UNSET_COLOR = 0x1b1a17ff;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

/**
 * Function that handles a draw operation into a
 * certain drawing context.
 */
export type DrawHandler = (pixels: Uint8Array, format: PixelFormat) => void;

export type ClearHandler = (
    color?: number,
    image?: string,
    imageScale?: number
) => Promise<void>;

type DisplayOptions = {
    width: number;
    height: number;
    logicWidth: number;
    logicHeight: number;
    scale?: number;
};

type DisplayProps = {
    options?: DisplayOptions;
    size?: string;
    fullscreen?: boolean;
    nativeFullscreen?: boolean;
    style?: string[];
    shader?: Shader;
    onDrawHandler?: (caller: DrawHandler) => void;
    onClearHandler?: (caller: ClearHandler) => void;
    onMinimize?: () => void;
};

type CanvasContents = {
    canvas: HTMLCanvasElement;
    canvasCtx: CanvasRenderingContext2D;
    canvasBuffer: HTMLCanvasElement;
    canvasBufferCtx: CanvasRenderingContext2D;
    imageData: ImageData;
    videoBuffer: DataView;
    renderer?: Renderer;
    frame?: { pixels: Uint8Array; format: PixelFormat };
};

export const Display: FC<DisplayProps> = ({
    options = { width: 320, height: 288, logicWidth: 160, logicHeight: 144 },
    size = "small",
    fullscreen = false,
    nativeFullscreen = true,
    style = [],
    shader,
    onDrawHandler,
    onClearHandler,
    onMinimize
}) => {
    options = {
        ...{ width: 320, height: 288, logicWidth: 160, logicHeight: 144 },
        ...options
    };
    if (!options.scale) {
        options.scale = window.devicePixelRatio ? window.devicePixelRatio : 1;
    }

    const classes = useMemo(
        () =>
            ["display", fullscreen ? "fullscreen" : null, size, ...style].join(
                " "
            ),
        [fullscreen, size, style]
    );

    const [width, setWidth] = useState<number>();
    const [height, setHeight] = useState<number>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasContentsRef = useRef<CanvasContents>();
    const resizeRef = useRef(() => {
        const [fullWidth, fullHeight] = crop(options.width / options.height);
        setWidth(fullWidth);
        setHeight(fullHeight);
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvasContentsRef.current = initCanvas(
            options.logicWidth,
            options.logicHeight,
            canvas,
            shader
        );
        if (!canvasContentsRef.current.renderer) return;

        // the WebGL context of the canvas may be lost (eg: GPU reset),
        // preventing the default behaviour makes the browser restore
        // it, at which point only the renderer is created again (the
        // 2D drawing is kept) and the last contents are drawn again
        const onContextLost = (event: Event) => event.preventDefault();
        const onContextRestored = () => {
            const contents = canvasContentsRef.current;
            if (!contents?.renderer) return;
            const { gl, width, height } = contents.renderer;
            destroyRenderer(contents.renderer);
            contents.renderer = createRenderer(gl, width, height, shader);
            redrawCanvas(contents);
        };
        canvas.addEventListener("webglcontextlost", onContextLost);
        canvas.addEventListener("webglcontextrestored", onContextRestored);
        return () => {
            canvas.removeEventListener("webglcontextlost", onContextLost);
            canvas.removeEventListener(
                "webglcontextrestored",
                onContextRestored
            );
            const renderer = canvasContentsRef.current?.renderer;
            if (renderer) destroyRenderer(renderer);
        };
    }, [canvasRef, options.logicWidth, options.logicHeight, shader]);

    useEffect(() => {
        const onResize = resizeRef.current;
        if (fullscreen) {
            canvasRef.current?.focus();
            resizeRef.current();
            document.getElementsByTagName("body")[0].style.overflow = "hidden";
            window.addEventListener("resize", onResize);

            // requests the browser to go fullscreen using the
            // body of the document as the entry HTML element
            if (nativeFullscreen && document.body.requestFullscreen) {
                document.body.requestFullscreen().catch(() => {});
            } else if (
                nativeFullscreen &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (document.body as any).webkitRequestFullscreen
            ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (document.body as any).webkitRequestFullscreen();
            }
        } else {
            setWidth(undefined);
            setHeight(undefined);
            document
                .getElementsByTagName("body")[0]
                .style.removeProperty("overflow");
            window.removeEventListener("resize", onResize);

            // restores the window mode, returning from the
            // fullscreen browser
            if (nativeFullscreen && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (
                nativeFullscreen &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (document as any).webkitExitFullscreen
            ) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (document as any).webkitExitFullscreen();
            }
        }
        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, [fullscreen, nativeFullscreen]);

    useEffect(() => {
        if (onDrawHandler) {
            onDrawHandler((pixels, format) => {
                if (!canvasContentsRef.current) return;
                updateCanvas(canvasContentsRef.current, pixels, format);
            });
        }
    }, [onDrawHandler]);

    useEffect(() => {
        if (onClearHandler) {
            onClearHandler(async (color, image, imageScale) => {
                if (!canvasContentsRef.current) return;
                await clearCanvas(canvasContentsRef.current, color, {
                    image: image,
                    imageScale: imageScale
                });
            });
        }
    }, [onClearHandler]);

    return (
        <div className={classes}>
            <span
                className="magnify-button display-minimize"
                onClick={onMinimize}
            >
                <img
                    className="large"
                    src={require("./minimise.svg")}
                    alt="minimise"
                />
            </span>
            <div className="display-frame">
                <canvas
                    key={shader ? "webgl" : "2d"}
                    ref={canvasRef}
                    tabIndex={-1}
                    className="display-canvas"
                    width={options.width * options.scale}
                    height={options.height * options.scale}
                    style={{ width: width ?? options.width, height: height }}
                ></canvas>
            </div>
        </div>
    );
};

const initCanvas = (
    width: number,
    height: number,
    canvas: HTMLCanvasElement,
    shader?: Shader
): CanvasContents => {
    // in case a shader is requested the frames are drawn with WebGL2,
    // keeping the 2D drawing (used by the clear operation) in an
    // off-screen canvas with the size of the visible one, falling back
    // to the 2D drawing when WebGL2 is not available, the alpha is not
    // premultiplied as in the colors drawn by the shaders
    const gl = shader
        ? canvas.getContext("webgl2", { premultipliedAlpha: false })
        : null;
    if (gl) {
        const canvasScreen = document.createElement("canvas");
        canvasScreen.width = canvas.width;
        canvasScreen.height = canvas.height;
        return {
            ...initCanvas(width, height, canvasScreen),
            renderer: createRenderer(gl, width, height, shader)
        };
    }

    // initializes the off-screen canvas that is going to be
    // used in the drawing process, this is used essentially for
    // performance reasons as it provides a way to draw pixels
    // in the original size instead of the target one
    const canvasBuffer = document.createElement("canvas");
    canvasBuffer.width = width;
    canvasBuffer.height = height;
    const canvasBufferCtx = canvasBuffer.getContext("2d");
    if (!canvasBufferCtx) {
        throw new Error("Not possible to obtain 2D context");
    }
    const imageData = canvasBufferCtx.createImageData(
        canvasBuffer.width,
        canvasBuffer.height
    );
    const videoBuffer = new DataView(imageData.data.buffer);

    // initializes the visual canvas (where data is going to be written)
    // with, resetting the transform vector to the identity and re-calculating
    // the scale of the drawing properly
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
        throw new Error("Not possible to obtain 2D context");
    }
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    canvasCtx.scale(
        canvas.width / canvasBuffer.width,
        canvas.height / canvasBuffer.height
    );
    canvasCtx.imageSmoothingEnabled = false;

    return {
        canvas: canvas,
        canvasCtx: canvasCtx,
        canvasBuffer: canvasBuffer,
        canvasBufferCtx: canvasBufferCtx,
        imageData: imageData,
        videoBuffer: videoBuffer
    };
};

const updateCanvas = (
    canvasContents: CanvasContents,
    pixels: Uint8Array,
    format: PixelFormat = PixelFormat.RGB
) => {
    // with WebGL the pixels are uploaded as they are, without
    // any conversion, and drawn by the renderer
    if (canvasContents.renderer) {
        drawFrame(canvasContents.renderer, pixels, format);
        canvasContents.frame = { pixels: pixels, format: format };
        return;
    }

    let offset = 0;
    for (let index = 0; index < pixels.length; index += format) {
        const color =
            (pixels[index] << 24) |
            (pixels[index + 1] << 16) |
            (pixels[index + 2] << 8) |
            (format == PixelFormat.RGBA ? pixels[index + 3] : 0xff);
        canvasContents.videoBuffer.setUint32(offset, color);
        offset += PixelFormat.RGBA;
    }
    canvasContents.canvasBufferCtx.putImageData(canvasContents.imageData, 0, 0);
    canvasContents.canvasCtx.drawImage(canvasContents.canvasBuffer, 0, 0);
};

const clearCanvas = async (
    canvasContents: CanvasContents,
    color = PIXEL_UNSET_COLOR,
    {
        image = null,
        imageScale = 1
    }: { image?: string | null; imageScale?: number } = {}
) => {
    // uses the "clear" color to fill a rectangle with the complete
    // size of the canvas contents
    canvasContents.canvasCtx.fillStyle = `#${color.toString(16).toUpperCase()}`;
    canvasContents.canvasCtx.fillRect(
        0,
        0,
        canvasContents.canvas.width,
        canvasContents.canvas.height
    );
    canvasContents.frame = undefined;

    // with WebGL the contents drawn in the off-screen canvas are
    // drawn in the visible one by the renderer, right away as the
    // image may never load and again once it is drawn
    if (canvasContents.renderer) {
        drawCanvas(canvasContents.renderer, canvasContents.canvas);
    }

    // in case an image was requested then uses that to load
    // an image at the center of the screen properly scaled
    if (image) {
        await drawImageCanvas(canvasContents, image, imageScale);
        if (canvasContents.renderer) {
            drawCanvas(canvasContents.renderer, canvasContents.canvas);
        }
    }
};

const redrawCanvas = (canvasContents: CanvasContents) => {
    // draws again the last frame or, in case the display was cleared
    // afterwards, the contents of the off-screen canvas
    if (canvasContents.frame) {
        updateCanvas(
            canvasContents,
            canvasContents.frame.pixels,
            canvasContents.frame.format
        );
    } else if (canvasContents.renderer) {
        drawCanvas(canvasContents.renderer, canvasContents.canvas);
    }
};

const drawImageCanvas = async (
    canvasContents: CanvasContents,
    image: string,
    imageScale = 1.0
) => {
    const img = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };

        // with WebGL the image is requested with CORS permission, as an
        // image of another origin taints the off-screen canvas, which
        // could then no longer be drawn by the renderer
        if (canvasContents.renderer) img.crossOrigin = "anonymous";
        img.src = image;
    });
    const [imgWidth, imgHeight] = [
        img.width * imageScale * window.devicePixelRatio,
        img.height * imageScale * window.devicePixelRatio
    ];
    const [x0, y0] = [
        canvasContents.canvas.width / 2 - imgWidth / 2,
        canvasContents.canvas.height / 2 - imgHeight / 2
    ];
    canvasContents.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    try {
        canvasContents.canvasCtx.drawImage(img, x0, y0, imgWidth, imgHeight);
    } finally {
        canvasContents.canvasCtx.scale(
            canvasContents.canvas.width / canvasContents.canvasBuffer.width,
            canvasContents.canvas.height / canvasContents.canvasBuffer.height
        );
    }
};

const crop = (ratio: number): [number, number] => {
    // calculates the window ratio as this is fundamental to
    // determine the proper way to crop the fullscreen
    const windowRatio = window.innerWidth / window.innerHeight;

    // in case the window is wider (more horizontal than the base ratio)
    // this means that we must crop horizontally
    if (windowRatio > ratio) {
        return [window.innerWidth * (ratio / windowRatio), window.innerHeight];
    } else {
        return [window.innerWidth, window.innerHeight * (windowRatio / ratio)];
    }
};

export default Display;
