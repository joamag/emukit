import assert from "assert";
import { createRequire } from "module";

import { ReactElement, ReactNode } from "react";

import type {
    ClearHandler,
    DrawHandler
} from "../../react/components/display/display.tsx";
import { PixelFormat } from "../../ts/structs.ts";

const requireModule = createRequire(__filename);
const React = requireModule("react") as Record<string, unknown>;

// ignores the style sheets imported by the React components
// as they are bundler specific and can not be loaded by node
const originalCss = requireModule.extensions[".css"];
requireModule.extensions[".css"] = () => {};
const { Display } = requireModule(
    "../../react/components/display/display.tsx"
) as typeof import("../../react/components/display/display.tsx");
if (originalCss) requireModule.extensions[".css"] = originalCss;
else delete requireModule.extensions[".css"];

/**
 * The original loader of the images, replaced during the tests
 * as the images are required by the display while rendering and
 * they are bundler specific, not possible to be loaded by node.
 */
const originalSvg = requireModule.extensions[".svg"];

/**
 * The shader used in the tests, its sources are never compiled
 * as the WebGL2 context is a stub.
 */
const SHADER = { fragment: "#version 300 es" };

/**
 * The props of the display component.
 */
type DisplayProps = Parameters<typeof Display>[0];

/**
 * A call made to the canvas, 2D context or WebGL2 context stubs,
 * made of the name of the method and its arguments.
 */
type Call = [string, ...unknown[]];

/**
 * An event listener registered against the canvas stub, with
 * the name of its event.
 */
type Listener = [string, (event: object) => void];

/**
 * A context provided by the canvas stub, with the type that
 * has been requested for it.
 */
type Context = Record<string, unknown>;

/**
 * The canvas stub, recording the calls made to it and to its
 * 2D context.
 */
type Canvas = {
    width: number;
    height: number;
    calls: Call[];
    listeners: Listener[];
    context: Context | null;
    getContext: (type: string, options?: object) => Context | null;
    addEventListener: (event: string, callback: Listener[1]) => void;
    removeEventListener: (event: string, callback: Listener[1]) => void;
    focus: () => void;
};

/**
 * The image stub used by the clear operation, loaded by the
 * display through its load handler.
 */
type ImageStub = { crossOrigin?: string; onload: () => void };

/**
 * The original React hooks, replaced during the tests so that
 * the component can be run without a renderer, having its
 * effects executed immediately.
 */
const hooks = {
    useEffect: React.useEffect,
    useMemo: React.useMemo,
    useRef: React.useRef,
    useState: React.useState
};

/**
 * The canvas elements created by the document stub, in the
 * order of their creation.
 */
let created: Canvas[] = [];

/**
 * The refs of the display component, kept across renders as
 * React does, in the order of their creation.
 */
let refs: { current: unknown }[] = [];

/**
 * The index of the next ref to be used by the current render.
 */
let refIndex = 0;

/**
 * The cleanup functions of the effects of the last render, run
 * before the effects of the next render.
 */
let cleanups: (void | (() => void))[] = [];

/**
 * The draw handler provided by the display component.
 */
let draw: DrawHandler | null = null;

/**
 * The clear handler provided by the display component.
 */
let clear: ClearHandler | null = null;

/**
 * Creates a canvas stub that records the calls made to it and
 * to its 2D context, providing a single type of context as the
 * canvas of a browser does.
 *
 * @param width The width of the canvas.
 * @param height The height of the canvas.
 * @param webgl The WebGL2 context provided by the canvas,
 * null in case WebGL2 is not available.
 * @returns The canvas stub.
 */
const createCanvas = (
    width = 0,
    height = 0,
    webgl: Context | null = null
): Canvas => {
    const canvas: Canvas = {
        width: width,
        height: height,
        calls: [],
        listeners: [],
        context: null,
        getContext: (type, options) => {
            canvas.calls.push(
                options ? ["getContext", type, options] : ["getContext", type]
            );
            if (canvas.context) {
                return canvas.context.type === type ? canvas.context : null;
            }
            canvas.context =
                type === "webgl2" ? webgl : createContext2D(canvas);
            if (canvas.context) canvas.context.type = type;
            return canvas.context;
        },
        addEventListener: (event, callback) => {
            canvas.listeners.push([event, callback]);
        },
        removeEventListener: (event, callback) => {
            canvas.listeners = canvas.listeners.filter(
                ([_event, _callback]) =>
                    _event !== event || _callback !== callback
            );
        },
        focus: () => {}
    };
    return canvas;
};

/**
 * Creates the stub of the 2D context of a canvas, recording its
 * drawing calls in the canvas.
 *
 * @param canvas The canvas stub of the context.
 * @returns The 2D context stub.
 */
const createContext2D = (canvas: Canvas): Context => {
    const record =
        (name: string) =>
        (...args: unknown[]) =>
            canvas.calls.push([name, ...args]);
    return {
        set fillStyle(value: string) {
            canvas.calls.push(["fillStyle", value]);
        },
        createImageData: (width: number, height: number) => ({
            data: new Uint8ClampedArray(width * height * 4)
        }),
        setTransform: record("setTransform"),
        scale: record("scale"),
        fillRect: record("fillRect"),
        putImageData: record("putImageData"),
        drawImage: record("drawImage")
    };
};

/**
 * Creates a WebGL2 context stub that records the calls made to
 * it, returning the name of the constants requested and a new
 * object for each of the WebGL objects created.
 *
 * @param calls The list where the calls are recorded.
 * @returns The WebGL2 context stub.
 */
const createWebGL = (calls: Call[]): Context =>
    new Proxy<Record<string | symbol, unknown>>(
        { drawingBufferWidth: 320, drawingBufferHeight: 288 },
        {
            get: (target, name) => {
                if (name in target) return target[name];
                if (typeof name !== "string") return undefined;
                if (/^[A-Z0-9_]+$/.test(name)) return name;
                return (...args: unknown[]) => {
                    calls.push([name, ...args]);
                    if (name.startsWith("create")) return { name };
                    if (name.endsWith("Parameter")) return true;
                    return null;
                };
            },
            set: (target, name, value) => {
                target[name] = value;
                return true;
            }
        }
    );

/**
 * Renders the display component with the provided props, against
 * the provided canvas, running its effects (once the ones of the
 * previous render are cleaned up).
 *
 * @param canvas The canvas stub the display draws into.
 * @param props The props to be used in the display component.
 * @returns The React element tree rendered by the component.
 */
const render = (canvas: Canvas, props: DisplayProps = {}): ReactNode => {
    cleanups.forEach((cleanup) => cleanup?.());
    cleanups = [];
    refIndex = 0;

    // the canvas ref is the first ref created by the component, it
    // is set before the render as the effects run during it
    if (refs.length === 0) refs.push({ current: null });
    refs[0].current = canvas;

    return Display({
        onDrawHandler: (handler) => {
            draw = handler;
        },
        onClearHandler: (handler) => {
            clear = handler;
        },
        ...props
    });
};

/**
 * Dispatches the provided event to the listeners of the canvas
 * registered for the event with the provided name.
 *
 * @param canvas The canvas stub to dispatch the event in.
 * @param name The name of the event to be dispatched.
 * @param event The event to be passed to the listeners.
 */
const dispatch = (canvas: Canvas, name: string, event: object = {}) => {
    canvas.listeners
        .filter(([_name]) => _name === name)
        .forEach(([, callback]) => callback(event));
};

/**
 * Finds the canvas element that is part of the provided React
 * element tree.
 *
 * @param element The React element tree to search.
 * @returns The canvas element found, if any.
 */
const findCanvas = (element: ReactNode): ReactElement | undefined => {
    if (Array.isArray(element)) return element.map(findCanvas).find(Boolean);
    if (!element || typeof element !== "object") return undefined;
    const node = element as ReactElement<{ children?: ReactNode }>;
    if (node.type === "canvas") return node;
    return findCanvas(node.props.children);
};

/**
 * Filters the recorded calls to the ones of the method with
 * the provided name.
 *
 * @param calls The recorded calls.
 * @param name The name of the method.
 * @returns The calls made to the method, in order.
 */
const callsOf = (calls: Call[], name: string) =>
    calls.filter(([_name]) => _name === name);

describe("Display", function () {
    beforeEach(() => {
        created = [];
        refs = [];
        cleanups = [];
        draw = null;
        clear = null;
        React.useEffect = (callback: () => void | (() => void)) => {
            cleanups.push(callback());
        };
        React.useMemo = (callback: () => unknown) => callback();
        React.useRef = (initial: unknown) => {
            if (refIndex === refs.length) refs.push({ current: initial });
            return refs[refIndex++];
        };
        React.useState = (initial: unknown) => [initial, () => {}];
        requireModule.extensions[".svg"] = () => {};
        const body = { style: { removeProperty: () => {} } };
        global.document = {
            createElement: () => {
                const canvas = createCanvas();
                created.push(canvas);
                return canvas;
            },
            getElementsByTagName: () => [body]
        } as unknown as Document;
        global.window = {
            devicePixelRatio: 1,
            addEventListener: () => {},
            removeEventListener: () => {}
        } as unknown as Window & typeof globalThis;
    });

    afterEach(() => {
        Object.assign(React, hooks);
        if (originalSvg) requireModule.extensions[".svg"] = originalSvg;
        else delete requireModule.extensions[".svg"];
        delete (globalThis as { document?: unknown }).document;
        delete (globalThis as { window?: unknown }).window;
        delete (globalThis as { Image?: unknown }).Image;
    });

    describe("#Display()", function () {
        it("should use a different canvas for each kind of drawing", () => {
            const canvas = createCanvas(320, 288);
            assert.strictEqual(findCanvas(render(canvas))!.key, "2d");
            assert.strictEqual(
                findCanvas(render(canvas, { shader: SHADER }))!.key,
                "webgl"
            );
        });

        it("should draw the frames in 2D without a shader", () => {
            const canvas = createCanvas(320, 288, createWebGL([]));
            render(canvas);
            assert.deepStrictEqual(callsOf(canvas.calls, "getContext"), [
                ["getContext", "2d"]
            ]);

            // the pixels are converted into the off-screen buffer (with
            // the logic size) that is then drawn in the visible canvas
            const [buffer] = created;
            draw!(new Uint8Array(160 * 144 * 3), PixelFormat.RGB);
            assert.strictEqual(buffer.width, 160);
            assert.strictEqual(buffer.height, 144);
            assert.strictEqual(callsOf(buffer.calls, "putImageData").length, 1);
            assert.deepStrictEqual(callsOf(canvas.calls, "drawImage"), [
                ["drawImage", buffer, 0, 0]
            ]);
        });

        it("should draw the frames with WebGL with a shader", () => {
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });

            // the alpha must not be premultiplied, as the shaders draw
            // colors with straight alpha
            assert.deepStrictEqual(callsOf(canvas.calls, "getContext"), [
                ["getContext", "webgl2", { premultipliedAlpha: false }]
            ]);

            // the 2D drawing is kept in an off-screen canvas with the
            // size of the visible one, used by the clear operation
            const [screen, buffer] = created;
            assert.deepStrictEqual(
                [screen.width, screen.height, buffer.width, buffer.height],
                [320, 288, 160, 144]
            );

            const pixels = new Uint8Array(160 * 144 * 3);
            draw!(pixels, PixelFormat.RGB);
            const [upload] = callsOf(calls, "texImage2D");
            assert.deepStrictEqual(upload.slice(3, 6), ["RGB8", 160, 144]);
            assert.strictEqual(upload[9], pixels);
            assert.strictEqual(callsOf(calls, "drawArrays").length, 1);
            assert.deepStrictEqual(callsOf(buffer.calls, "putImageData"), []);
        });

        it("should draw the frames in 2D when WebGL2 is not available", () => {
            const canvas = createCanvas(320, 288);
            render(canvas, { shader: SHADER });
            assert.deepStrictEqual(callsOf(canvas.calls, "getContext"), [
                ["getContext", "webgl2", { premultipliedAlpha: false }],
                ["getContext", "2d"]
            ]);

            const [buffer] = created;
            draw!(new Uint8Array(160 * 144 * 3), PixelFormat.RGB);
            assert.deepStrictEqual(callsOf(canvas.calls, "drawImage"), [
                ["drawImage", buffer, 0, 0]
            ]);
            assert.deepStrictEqual(canvas.listeners, []);
        });

        it("should not listen to the WebGL context when drawing in 2D", () => {
            const canvas = createCanvas(320, 288);
            render(canvas);
            assert.deepStrictEqual(canvas.listeners, []);
        });

        it("should keep the WebGL context once it is lost", () => {
            const canvas = createCanvas(320, 288, createWebGL([]));
            render(canvas, { shader: SHADER });
            let prevented = false;
            dispatch(canvas, "webglcontextlost", {
                preventDefault: () => {
                    prevented = true;
                }
            });
            assert.strictEqual(prevented, true);
        });

        it("should draw the last frame again once the WebGL context is restored", () => {
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const last = new Uint8Array(160 * 144 * 3);
            draw!(new Uint8Array(160 * 144 * 3), PixelFormat.RGB);
            draw!(last, PixelFormat.RGB);
            assert.strictEqual(callsOf(calls, "texImage2D").length, 1);
            assert.strictEqual(callsOf(calls, "texSubImage2D").length, 1);

            // the resources of the lost context are gone, so the renderer
            // is created again (releasing the previous one) and the last
            // frame drawn again, as no other frame may come (eg: paused)
            const programs = callsOf(calls, "createProgram").length;
            dispatch(canvas, "webglcontextrestored");
            assert.strictEqual(
                callsOf(calls, "createProgram").length,
                programs * 2
            );
            assert.strictEqual(callsOf(calls, "deleteProgram").length, 2);
            const uploads = callsOf(calls, "texImage2D");
            assert.strictEqual(uploads.length, 2);
            assert.strictEqual(uploads[1][9], last);
            assert.strictEqual(callsOf(calls, "drawArrays").length, 3);

            // the next frames are drawn by the new renderer
            draw!(new Uint8Array(160 * 144 * 3), PixelFormat.RGB);
            assert.strictEqual(callsOf(calls, "texSubImage2D").length, 2);
        });

        it("should draw the last clear again once the WebGL context is restored", async () => {
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const [screen] = created;
            draw!(new Uint8Array(160 * 144 * 3), PixelFormat.RGB);
            await clear!(0x112233ff);
            calls.length = 0;

            // the display was cleared after the last frame, so it is the
            // contents of the clear that must be drawn again
            dispatch(canvas, "webglcontextrestored");
            const uploads = callsOf(calls, "texImage2D");
            assert.strictEqual(uploads.length, 1);
            assert.strictEqual(uploads[0][6], screen);
            assert.deepStrictEqual(callsOf(calls, "texSubImage2D"), []);
            assert.strictEqual(callsOf(calls, "drawArrays").length, 1);
        });

        it("should draw the last clear again each time the WebGL context is restored", async () => {
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const [screen] = created;
            await clear!(0x112233ff);
            const canvases = created.length;
            calls.length = 0;

            // the off-screen canvas of the clear is kept across the
            // restorations, so the same contents are drawn every time
            dispatch(canvas, "webglcontextrestored");
            dispatch(canvas, "webglcontextrestored");
            const uploads = callsOf(calls, "texImage2D");
            assert.strictEqual(uploads.length, 2);
            assert.strictEqual(uploads[0][6], screen);
            assert.strictEqual(uploads[1][6], screen);
            assert.strictEqual(created.length, canvases);
        });

        it("should draw a pending clear with the renderer of a restored WebGL context", async () => {
            let load = null as (() => void) | null;
            global.Image = class {
                width = 64;
                height = 32;
                declare onload: () => void;
                set src(value: string) {
                    load = () => this.onload();
                }
            } as unknown as typeof Image;
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const pending = clear!(0x112233ff, "image.png");

            // the context is restored while the image is loading, the
            // clear must then be shown by the new renderer
            dispatch(canvas, "webglcontextrestored");
            const programs = callsOf(calls, "useProgram").length;
            load!();
            await pending;

            // the image is shown with a program of the new renderer, never
            // with one of the destroyed renderer
            const deleted = callsOf(calls, "deleteProgram").map(
                ([, program]) => program
            );
            const [[, program]] = callsOf(calls, "useProgram").slice(-1);
            assert.strictEqual(
                callsOf(calls, "useProgram").length,
                programs + 1
            );
            assert.strictEqual(deleted.length, 2);
            assert.ok(!deleted.includes(program));
        });

        it("should destroy the renderer when the display is drawn again", () => {
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            assert.strictEqual(canvas.listeners.length, 2);

            render(canvas, {
                shader: SHADER,
                options: {
                    width: 480,
                    height: 320,
                    logicWidth: 240,
                    logicHeight: 160
                }
            });
            assert.strictEqual(callsOf(calls, "deleteProgram").length, 2);
            assert.strictEqual(callsOf(calls, "deleteTexture").length, 2);
            assert.strictEqual(canvas.listeners.length, 2);

            // the new renderer uses the logic size of the new options
            draw!(new Uint8Array(240 * 160 * 3), PixelFormat.RGB);
            const [upload] = callsOf(calls, "texImage2D");
            assert.deepStrictEqual(upload.slice(3, 6), ["RGB8", 240, 160]);
        });

        it("should clear the display with WebGL", async () => {
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const [screen] = created;
            await clear!(0x112233ff);

            // the clear color is drawn in the off-screen canvas, which
            // is then drawn in the visible one
            assert.deepStrictEqual(callsOf(screen.calls, "fillStyle"), [
                ["fillStyle", "#112233FF"]
            ]);
            assert.deepStrictEqual(callsOf(screen.calls, "fillRect"), [
                ["fillRect", 0, 0, 320, 288]
            ]);
            const [upload] = callsOf(calls, "texImage2D");
            assert.strictEqual(upload[6], screen);
            assert.strictEqual(callsOf(calls, "drawArrays").length, 1);
            assert.deepStrictEqual(callsOf(canvas.calls, "fillRect"), []);
        });

        it("should draw the image of the clear operation before showing it with WebGL", async () => {
            global.Image = class {
                width = 64;
                height = 32;
                declare onload: () => void;
                set src(value: string) {
                    this.onload();
                }
            } as unknown as typeof Image;
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const [screen] = created;
            const drawn: [string, string][] = [];
            screen.calls.push = (call: Call) => drawn.push(["screen", call[0]]);
            calls.push = (call: Call) => drawn.push(["webgl", call[0]]);
            await clear!(0x112233ff, "image.png", 0.5);

            // the clear color is shown right away and the image (centered
            // and scaled) is then drawn in the off-screen canvas, before its
            // contents are shown again in the visible one
            const image = drawn.findIndex(
                ([target, name]) => target === "screen" && name === "drawImage"
            );
            const uploads = drawn
                .map(([target, name], index) =>
                    target === "webgl" && name === "texImage2D" ? index : -1
                )
                .filter((index) => index >= 0);
            assert.ok(image >= 0);
            assert.strictEqual(uploads.length, 2);
            assert.ok(uploads[0] < image);
            assert.ok(uploads[1] > image);
        });

        it("should load the image of the clear operation with CORS with WebGL", async () => {
            const images: ImageStub[] = [];
            global.Image = class {
                width = 64;
                height = 32;
                declare onload: () => void;
                set src(value: string) {
                    images.push(this);
                    this.onload();
                }
            } as unknown as typeof Image;
            const canvas = createCanvas(320, 288, createWebGL([]));
            render(canvas, { shader: SHADER });
            await clear!(0x112233ff, "https://example.com/image.png");

            // the image must be requested with CORS permission, set before
            // its source, so that it does not taint the off-screen canvas
            assert.strictEqual(images.length, 1);
            assert.strictEqual(images[0].crossOrigin, "anonymous");
        });

        it("should load the image of the clear operation without CORS in 2D", async () => {
            const images: ImageStub[] = [];
            global.Image = class {
                width = 64;
                height = 32;
                declare onload: () => void;
                set src(value: string) {
                    images.push(this);
                    this.onload();
                }
            } as unknown as typeof Image;
            const canvas = createCanvas(320, 288);
            render(canvas);
            await clear!(0x112233ff, "https://example.com/image.png");

            // the 2D drawing keeps supporting the images of other origins
            // that are served without CORS permission
            assert.strictEqual(images.length, 1);
            assert.strictEqual(images[0].crossOrigin, undefined);
            assert.strictEqual(callsOf(canvas.calls, "drawImage").length, 1);
        });

        it("should show the clear color with WebGL before the image loads", () => {
            global.Image = class {
                set src(value: string) {}
            } as unknown as typeof Image;
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const [screen] = created;

            // the image never loads (eg: missing), still the clear color
            // must be shown instead of the last frame
            clear!(0x112233ff, "missing.png");
            const uploads = callsOf(calls, "texImage2D");
            assert.strictEqual(uploads.length, 1);
            assert.strictEqual(uploads[0][6], screen);
            assert.strictEqual(callsOf(calls, "drawArrays").length, 1);
        });

        it("should not draw a pending clear once its renderer is replaced", async () => {
            let load = null as (() => void) | null;
            global.Image = class {
                width = 64;
                height = 32;
                declare onload: () => void;
                set src(value: string) {
                    load = () => this.onload();
                }
            } as unknown as typeof Image;
            const calls: Call[] = [];
            const canvas = createCanvas(320, 288, createWebGL(calls));
            render(canvas, { shader: SHADER });
            const pending = clear!(0x112233ff, "image.png");

            // the display is drawn again with a different size, replacing
            // (and destroying) the renderer while the image is loading
            render(canvas, {
                shader: SHADER,
                options: {
                    width: 480,
                    height: 320,
                    logicWidth: 240,
                    logicHeight: 160
                }
            });
            const draws = callsOf(calls, "drawArrays").length;
            load!();
            await pending;
            assert.strictEqual(callsOf(calls, "drawArrays").length, draws);
        });
    });
});
