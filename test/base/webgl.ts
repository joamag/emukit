import assert from "assert";

import { logger } from "../../ts/logging.ts";
import { PixelFormat } from "../../ts/structs.ts";
import {
    createRenderer,
    destroyRenderer,
    drawCanvas,
    drawFrame,
    FRAGMENT_SHADER,
    VERTEX_SHADER
} from "../../ts/webgl.ts";

/**
 * The fragment shader of the custom shader used in the tests,
 * that inverts the colors of the image.
 */
const CUSTOM_FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D image;
in vec2 texture_coordinates;
out vec4 color;
void main() { color = vec4(1.0) - texture(image, texture_coordinates); }
`;

/**
 * A call made to the WebGL2 context stub, made of the name of
 * the method and its arguments.
 */
type Call = [string, ...unknown[]];

/**
 * A shader created by the WebGL2 context stub, with its source.
 */
type StubShader = { type: unknown; source?: string };

/**
 * A program created by the WebGL2 context stub, with the shaders
 * attached to it.
 */
type StubProgram = { shaders: StubShader[] };

/**
 * The sequence of calls made to the WebGL2 context stub, each
 * of them made of the name of the method and its arguments.
 */
let calls: Call[] = [];

/**
 * The messages logged as warnings during the tests.
 */
let warnings: string[] = [];

/**
 * Creates a WebGL2 context stub that records the calls made to
 * it, with a drawing surface of 640x576 pixels.
 *
 * @param options The failures to be simulated by the
 * stub, `create` to fail the creation of shaders and `compile` and
 * `link` with a text that makes the shaders whose source contains
 * it fail to compile or link.
 * @returns The WebGL2 context stub.
 */
const createContext = ({
    create = false,
    compile,
    link
}: { create?: boolean; compile?: string; link?: string } = {}) => {
    const record =
        <T extends unknown[]>(name: string, result?: (...args: T) => unknown) =>
        (...args: T) => {
            calls.push([name, ...args]);
            return result?.(...args);
        };
    return {
        VERTEX_SHADER: "VERTEX_SHADER",
        FRAGMENT_SHADER: "FRAGMENT_SHADER",
        COMPILE_STATUS: "COMPILE_STATUS",
        LINK_STATUS: "LINK_STATUS",
        ARRAY_BUFFER: "ARRAY_BUFFER",
        STATIC_DRAW: "STATIC_DRAW",
        FLOAT: "FLOAT",
        UNPACK_ALIGNMENT: "UNPACK_ALIGNMENT",
        TEXTURE0: "TEXTURE0",
        TEXTURE_2D: "TEXTURE_2D",
        TEXTURE_MIN_FILTER: "TEXTURE_MIN_FILTER",
        TEXTURE_MAG_FILTER: "TEXTURE_MAG_FILTER",
        TEXTURE_WRAP_S: "TEXTURE_WRAP_S",
        TEXTURE_WRAP_T: "TEXTURE_WRAP_T",
        NEAREST: "NEAREST",
        CLAMP_TO_EDGE: "CLAMP_TO_EDGE",
        RGB: "RGB",
        RGBA: "RGBA",
        RGB8: "RGB8",
        RGBA8: "RGBA8",
        UNSIGNED_BYTE: "UNSIGNED_BYTE",
        TRIANGLE_STRIP: "TRIANGLE_STRIP",
        drawingBufferWidth: 640,
        drawingBufferHeight: 576,
        createShader: record("createShader", (type: unknown) =>
            create ? null : { type: type }
        ),
        shaderSource: record(
            "shaderSource",
            (shader: StubShader, source: string) => {
                shader.source = source;
            }
        ),
        compileShader: record("compileShader"),
        getShaderParameter: (shader: StubShader) =>
            !compile || !(shader.source ?? "").includes(compile),
        getShaderInfoLog: () => "compile error",
        deleteShader: record("deleteShader"),
        createProgram: record("createProgram", (): StubProgram => ({
            shaders: []
        })),
        attachShader: record(
            "attachShader",
            (program: StubProgram, shader: StubShader) => {
                program.shaders.push(shader);
            }
        ),
        linkProgram: record("linkProgram"),
        getProgramParameter: (program: StubProgram) =>
            !link ||
            !program.shaders.some((shader) =>
                (shader.source ?? "").includes(link)
            ),
        getProgramInfoLog: () => "link error",
        deleteProgram: record("deleteProgram"),
        getUniformLocation: (program: StubProgram, name: string) => ({
            program,
            name
        }),
        createVertexArray: record("createVertexArray", () => ({})),
        createBuffer: record("createBuffer", () => ({})),
        createTexture: record("createTexture", () => ({})),
        bindVertexArray: record("bindVertexArray"),
        bindBuffer: record("bindBuffer"),
        bufferData: record("bufferData"),
        vertexAttribPointer: record("vertexAttribPointer"),
        enableVertexAttribArray: record("enableVertexAttribArray"),
        pixelStorei: record("pixelStorei"),
        activeTexture: record("activeTexture"),
        bindTexture: record("bindTexture"),
        texParameteri: record("texParameteri"),
        texImage2D: record("texImage2D"),
        texSubImage2D: record("texSubImage2D"),
        viewport: record("viewport"),
        useProgram: record("useProgram"),
        uniform1i: record("uniform1i"),
        uniform2f: record("uniform2f"),
        drawArrays: record("drawArrays"),
        deleteTexture: record("deleteTexture"),
        deleteBuffer: record("deleteBuffer"),
        deleteVertexArray: record("deleteVertexArray")
    } as unknown as WebGL2RenderingContext;
};

/**
 * Filters the recorded calls to the ones of the method with
 * the provided name.
 *
 * @param name The name of the method.
 * @returns The calls made to the method, in order.
 */
const callsOf = (name: string) => calls.filter(([_name]) => _name === name);

/**
 * Builds the uniform calls expected for a draw operation, for
 * a program and an input with the provided size, into the drawing
 * surface (of 640x576 pixels) of the context stub.
 *
 * @param program The program used in the draw operation.
 * @param width The width of the input of the program.
 * @param height The height of the input of the program.
 * @returns The expected uniform calls, in order.
 */
const uniformsOf = (
    program: WebGLProgram,
    width: number,
    height: number
): Call[] => [
    ["uniform1i", { program, name: "image" }, 0],
    ["uniform2f", { program, name: "input_resolution" }, width, height],
    ["uniform2f", { program, name: "output_resolution" }, 640, 576],
    ["uniform2f", { program, name: "origin" }, 0, 0]
];

/**
 * Reads a program created by the WebGL2 context stub, with the
 * shaders attached to it.
 *
 * @param program The program created by the context stub.
 * @returns The program as created by the context stub.
 */
const programOf = (program: WebGLProgram) => program as unknown as StubProgram;

describe("WebGL", function () {
    beforeEach(() => {
        calls = [];
        warnings = [];
        logger.warn = (message) => warnings.push(message);
    });

    afterEach(() => {
        delete (logger as { warn?: unknown }).warn;
    });

    describe("#createRenderer()", function () {
        it("should use the default shader when none is provided", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            assert.strictEqual(renderer.program, renderer.passthrough);
            assert.deepStrictEqual(
                programOf(renderer.passthrough).shaders.map(
                    (shader) => shader.source
                ),
                [VERTEX_SHADER, FRAGMENT_SHADER]
            );
            assert.strictEqual(renderer.width, 160);
            assert.strictEqual(renderer.height, 144);
            assert.strictEqual(renderer.format, undefined);
            assert.deepStrictEqual(warnings, []);
        });

        it("should use the provided shader", () => {
            const renderer = createRenderer(createContext(), 160, 144, {
                fragment: CUSTOM_FRAGMENT
            });
            assert.notStrictEqual(renderer.program, renderer.passthrough);
            assert.deepStrictEqual(
                programOf(renderer.program).shaders.map(
                    (shader) => shader.source
                ),
                [VERTEX_SHADER, CUSTOM_FRAGMENT]
            );
            assert.deepStrictEqual(
                programOf(renderer.passthrough).shaders.map(
                    (shader) => shader.source
                ),
                [VERTEX_SHADER, FRAGMENT_SHADER]
            );
        });

        it("should use the vertex shader of the provided shader", () => {
            const vertex = VERTEX_SHADER.replace("main", "main ");
            const renderer = createRenderer(createContext(), 160, 144, {
                vertex: vertex,
                fragment: CUSTOM_FRAGMENT
            });
            assert.deepStrictEqual(
                programOf(renderer.program).shaders.map(
                    (shader) => shader.source
                ),
                [vertex, CUSTOM_FRAGMENT]
            );
        });

        it("should release the shaders once the programs are linked", () => {
            const renderer = createRenderer(createContext(), 160, 144, {
                fragment: CUSTOM_FRAGMENT
            });
            const deleted = callsOf("deleteShader").map(([, shader]) => shader);
            assert.deepStrictEqual(deleted, [
                ...programOf(renderer.passthrough).shaders,
                ...programOf(renderer.program).shaders
            ]);
        });

        it("should use the default shader when the provided one does not compile", () => {
            const renderer = createRenderer(
                createContext({ compile: "vec4(1.0) -" }),
                160,
                144,
                { fragment: CUSTOM_FRAGMENT }
            );
            assert.strictEqual(renderer.program, renderer.passthrough);
            assert.deepStrictEqual(warnings, [
                "Not possible to use the shader, using default: Error: Not possible to compile shader: compile error"
            ]);

            // the fragment shader that failed and the vertex shader compiled
            // for the failed program must both be released, with no program
            // created for them
            const deleted = callsOf("deleteShader").map(
                ([, shader]) => (shader as StubShader).source
            );
            assert.deepStrictEqual(deleted, [
                VERTEX_SHADER,
                FRAGMENT_SHADER,
                CUSTOM_FRAGMENT,
                VERTEX_SHADER
            ]);
            assert.strictEqual(callsOf("createProgram").length, 1);
        });

        it("should use the default shader when the provided one does not link", () => {
            const context = createContext({ link: "vec4(1.0) -" });
            const renderer = createRenderer(context, 160, 144, {
                fragment: CUSTOM_FRAGMENT
            });
            assert.strictEqual(renderer.program, renderer.passthrough);
            assert.deepStrictEqual(warnings, [
                "Not possible to use the shader, using default: Error: Not possible to link program: link error"
            ]);

            // the program that failed to link must be released, as
            // well as both of its shaders
            const deleted = callsOf("deleteProgram").map(
                ([, program]) => program
            );
            assert.strictEqual(deleted.length, 1);
            assert.notStrictEqual(deleted[0], renderer.passthrough);
            assert.deepStrictEqual(
                (deleted[0] as StubProgram).shaders.map(
                    (shader) => shader.source
                ),
                [VERTEX_SHADER, CUSTOM_FRAGMENT]
            );
            assert.strictEqual(callsOf("deleteShader").length, 4);
        });

        it("should fail when the default shader does not compile", () => {
            assert.throws(
                () =>
                    createRenderer(
                        createContext({ compile: "#version" }),
                        160,
                        144
                    ),
                { message: "Not possible to compile shader: compile error" }
            );
        });

        it("should fail when the shaders can not be created", () => {
            assert.throws(
                () => createRenderer(createContext({ create: true }), 160, 144),
                { message: "Not possible to create shader" }
            );
        });

        it("should create a quad covering the drawing surface", () => {
            createRenderer(createContext(), 160, 144);
            const [[, target, data, usage]] = callsOf("bufferData");
            assert.strictEqual(target, "ARRAY_BUFFER");
            assert.strictEqual(usage, "STATIC_DRAW");

            // each vertex is made of its position followed by its texture
            // coordinates, the top of the surface (y = 1) must be mapped
            // to the first row of the image (t = 0)
            assert.deepStrictEqual(
                Array.from(data as Float32Array),
                [-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]
            );
            assert.deepStrictEqual(callsOf("vertexAttribPointer"), [
                ["vertexAttribPointer", 0, 2, "FLOAT", false, 16, 0],
                ["vertexAttribPointer", 1, 2, "FLOAT", false, 16, 8]
            ]);
            assert.deepStrictEqual(callsOf("enableVertexAttribArray"), [
                ["enableVertexAttribArray", 0],
                ["enableVertexAttribArray", 1]
            ]);
        });

        it("should unpack the pixels without alignment", () => {
            createRenderer(createContext(), 160, 144);
            assert.deepStrictEqual(callsOf("pixelStorei"), [
                ["pixelStorei", "UNPACK_ALIGNMENT", 1]
            ]);
        });

        it("should create textures with nearest filtering", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            assert.notStrictEqual(renderer.texture, renderer.canvasTexture);
            assert.deepStrictEqual(callsOf("texParameteri").slice(0, 4), [
                [
                    "texParameteri",
                    "TEXTURE_2D",
                    "TEXTURE_MIN_FILTER",
                    "NEAREST"
                ],
                [
                    "texParameteri",
                    "TEXTURE_2D",
                    "TEXTURE_MAG_FILTER",
                    "NEAREST"
                ],
                [
                    "texParameteri",
                    "TEXTURE_2D",
                    "TEXTURE_WRAP_S",
                    "CLAMP_TO_EDGE"
                ],
                [
                    "texParameteri",
                    "TEXTURE_2D",
                    "TEXTURE_WRAP_T",
                    "CLAMP_TO_EDGE"
                ]
            ]);
            assert.strictEqual(callsOf("texParameteri").length, 8);
        });
    });

    describe("#drawFrame()", function () {
        it("should allocate the texture with the first frame", () => {
            const renderer = createRenderer(createContext(), 160, 144, {
                fragment: CUSTOM_FRAGMENT
            });
            const pixels = new Uint8Array(160 * 144 * 3);
            calls = [];
            drawFrame(renderer, pixels, PixelFormat.RGB);
            assert.deepStrictEqual(calls, [
                ["activeTexture", "TEXTURE0"],
                ["bindTexture", "TEXTURE_2D", renderer.texture],
                [
                    "texImage2D",
                    "TEXTURE_2D",
                    0,
                    "RGB8",
                    160,
                    144,
                    0,
                    "RGB",
                    "UNSIGNED_BYTE",
                    pixels
                ],
                ["viewport", 0, 0, 640, 576],
                ["useProgram", renderer.program],
                ...uniformsOf(renderer.program, 160, 144),
                ["activeTexture", "TEXTURE0"],
                ["bindTexture", "TEXTURE_2D", renderer.texture],
                ["bindVertexArray", renderer.vertexArray],
                ["drawArrays", "TRIANGLE_STRIP", 0, 4],
                ["bindVertexArray", null]
            ]);
            assert.strictEqual(renderer.format, PixelFormat.RGB);
        });

        it("should replace the contents of the texture with the next frames", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            const pixels = new Uint8Array(160 * 144 * 3);
            drawFrame(renderer, pixels, PixelFormat.RGB);
            calls = [];
            drawFrame(renderer, pixels, PixelFormat.RGB);
            assert.deepStrictEqual(callsOf("texImage2D"), []);
            assert.deepStrictEqual(callsOf("texSubImage2D"), [
                [
                    "texSubImage2D",
                    "TEXTURE_2D",
                    0,
                    0,
                    0,
                    160,
                    144,
                    "RGB",
                    "UNSIGNED_BYTE",
                    pixels
                ]
            ]);
            assert.deepStrictEqual(callsOf("drawArrays"), [
                ["drawArrays", "TRIANGLE_STRIP", 0, 4]
            ]);
        });

        it("should allocate the texture again when the format changes", () => {
            const renderer = createRenderer(createContext(), 240, 160);
            drawFrame(renderer, new Uint8Array(240 * 160 * 3));
            const pixels = new Uint8Array(240 * 160 * 4);
            calls = [];
            drawFrame(renderer, pixels, PixelFormat.RGBA);
            assert.deepStrictEqual(callsOf("texSubImage2D"), []);
            assert.deepStrictEqual(callsOf("texImage2D"), [
                [
                    "texImage2D",
                    "TEXTURE_2D",
                    0,
                    "RGBA8",
                    240,
                    160,
                    0,
                    "RGBA",
                    "UNSIGNED_BYTE",
                    pixels
                ]
            ]);
            assert.strictEqual(renderer.format, PixelFormat.RGBA);
        });

        it("should use the RGB format by default", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            drawFrame(renderer, new Uint8Array(160 * 144 * 3));
            assert.strictEqual(renderer.format, PixelFormat.RGB);
            assert.strictEqual(callsOf("texImage2D")[0][3], "RGB8");
        });

        it("should not draw with a destroyed renderer", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            destroyRenderer(renderer);
            calls = [];
            drawFrame(renderer, new Uint8Array(160 * 144 * 3));
            assert.deepStrictEqual(calls, []);
            assert.strictEqual(renderer.format, undefined);
        });
    });

    describe("#drawCanvas()", function () {
        it("should draw the canvas with the default shader", () => {
            const renderer = createRenderer(createContext(), 160, 144, {
                fragment: CUSTOM_FRAGMENT
            });
            const canvas = { width: 320, height: 288 } as HTMLCanvasElement;
            calls = [];
            drawCanvas(renderer, canvas);
            assert.deepStrictEqual(calls, [
                ["activeTexture", "TEXTURE0"],
                ["bindTexture", "TEXTURE_2D", renderer.canvasTexture],
                [
                    "texImage2D",
                    "TEXTURE_2D",
                    0,
                    "RGBA",
                    "RGBA",
                    "UNSIGNED_BYTE",
                    canvas
                ],
                ["viewport", 0, 0, 640, 576],
                ["useProgram", renderer.passthrough],
                ...uniformsOf(renderer.passthrough, 320, 288),
                ["activeTexture", "TEXTURE0"],
                ["bindTexture", "TEXTURE_2D", renderer.canvasTexture],
                ["bindVertexArray", renderer.vertexArray],
                ["drawArrays", "TRIANGLE_STRIP", 0, 4],
                ["bindVertexArray", null]
            ]);
        });

        it("should keep the texture of the frames", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            drawFrame(renderer, new Uint8Array(160 * 144 * 3));
            drawCanvas(renderer, {
                width: 320,
                height: 288
            } as HTMLCanvasElement);
            calls = [];
            drawFrame(renderer, new Uint8Array(160 * 144 * 3));
            assert.strictEqual(callsOf("texSubImage2D").length, 1);
            assert.deepStrictEqual(callsOf("texImage2D"), []);
        });

        it("should not draw with a destroyed renderer", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            destroyRenderer(renderer);
            calls = [];
            drawCanvas(renderer, {
                width: 320,
                height: 288
            } as HTMLCanvasElement);
            assert.deepStrictEqual(calls, []);
        });
    });

    describe("#destroyRenderer()", function () {
        it("should release the resources of the renderer", () => {
            const renderer = createRenderer(createContext(), 160, 144, {
                fragment: CUSTOM_FRAGMENT
            });
            calls = [];
            destroyRenderer(renderer);
            assert.deepStrictEqual(calls, [
                ["deleteTexture", renderer.texture],
                ["deleteTexture", renderer.canvasTexture],
                ["deleteBuffer", renderer.buffer],
                ["deleteVertexArray", renderer.vertexArray],
                ["deleteProgram", renderer.program],
                ["deleteProgram", renderer.passthrough]
            ]);
        });

        it("should release the default program only once", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            calls = [];
            destroyRenderer(renderer);
            assert.deepStrictEqual(callsOf("deleteProgram"), [
                ["deleteProgram", renderer.passthrough]
            ]);
        });

        it("should release the resources only once", () => {
            const renderer = createRenderer(createContext(), 160, 144);
            destroyRenderer(renderer);
            assert.strictEqual(renderer.destroyed, true);
            calls = [];
            destroyRenderer(renderer);
            assert.deepStrictEqual(calls, []);
        });
    });
});
