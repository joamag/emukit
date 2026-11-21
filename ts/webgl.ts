import { logger } from "./logging.ts";
import { PixelFormat } from "./structs.ts";

/**
 * The source code of the vertex shader used by default, that
 * passes through the position of the vertex (at location 0) and
 * its texture coordinates (at location 1).
 */
export const VERTEX_SHADER = `#version 300 es

layout(location = 0) in vec2 position;
layout(location = 1) in vec2 coordinates;

out vec2 texture_coordinates;

void main()
{
    texture_coordinates = coordinates;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * The source code of the fragment shader used by default, that
 * draws the image as it is, without any filtering.
 */
export const FRAGMENT_SHADER = `#version 300 es

precision mediump float;

uniform sampler2D image;

in vec2 texture_coordinates;

out vec4 color;

void main()
{
    color = texture(image, texture_coordinates);
}
`;

/**
 * The source code (in GLSL ES 3.00) of a custom shader used to
 * draw the frames of the emulator.
 *
 * The fragment shader receives the `image` (the frame), the
 * `input_resolution` (the size of the frame), the `output_resolution`
 * (the size of the drawing surface) and the `origin` (the bottom left
 * corner of the drawing surface) uniforms. In case no vertex shader
 * is provided the default one is used.
 */
export type Shader = {
    vertex?: string;
    fragment: string;
};

/**
 * The locations of the uniforms of a shader program, null for
 * the ones not used by the program.
 */
type Locations = {
    image: WebGLUniformLocation | null;
    inputResolution: WebGLUniformLocation | null;
    outputResolution: WebGLUniformLocation | null;
    origin: WebGLUniformLocation | null;
};

/**
 * The WebGL2 state used to draw the frames of the emulator in
 * a canvas, created once and re-used for every frame.
 */
export type Renderer = {
    gl: WebGL2RenderingContext;
    width: number;
    height: number;
    program: WebGLProgram;
    passthrough: WebGLProgram;
    locations: Map<WebGLProgram, Locations>;
    vertexArray: WebGLVertexArrayObject;
    buffer: WebGLBuffer;
    texture: WebGLTexture;
    canvasTexture: WebGLTexture;
    format?: PixelFormat;
    destroyed?: boolean;
};

/**
 * Creates the renderer that draws frames with the provided size
 * in the WebGL2 context, using the provided shader.
 *
 * In case the shader does not compile or link the default (pass
 * through) one is used instead, so that the frames are still drawn.
 *
 * @param gl The WebGL2 context of the canvas to draw into.
 * @param width The width (in pixels) of the frames.
 * @param height The height (in pixels) of the frames.
 * @param shader The custom shader used to draw the frames.
 * @returns The renderer ready to draw the frames.
 */
export const createRenderer = (
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    shader?: Shader
): Renderer => {
    // creates the default (pass through) program, used to draw the
    // contents of a canvas and as the fallback of the custom shader
    const passthrough = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

    // tries to create the program of the custom shader, falling back
    // to the default one in case it can not be used
    let program = passthrough;
    if (shader) {
        try {
            program = createProgram(
                gl,
                shader.vertex ?? VERTEX_SHADER,
                shader.fragment
            );
        } catch (err) {
            logger.warn(
                `Not possible to use the shader, using default: ${err}`
            );
        }
    }

    // creates the vertex array of a quad that covers the complete
    // drawing surface, each vertex made of its position followed by
    // its texture coordinates, top to bottom as the rows of a frame
    const vertexArray = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
        gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(1);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // the rows of the frames are not padded, so the unpacking
    // of their pixels must not expect any alignment
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    return {
        gl: gl,
        width: width,
        height: height,
        program: program,
        passthrough: passthrough,
        locations: new Map([
            [program, locateUniforms(gl, program)],
            [passthrough, locateUniforms(gl, passthrough)]
        ]),
        vertexArray: vertexArray,
        buffer: buffer,
        texture: createTexture(gl),
        canvasTexture: createTexture(gl)
    };
};

/**
 * Draws a frame of the emulator, uploading its pixels as they
 * are, without any conversion.
 *
 * @param renderer The renderer to draw the frame with.
 * @param pixels The pixels of the frame, row by row.
 * @param format The format of the pixels of the frame.
 */
export const drawFrame = (
    renderer: Renderer,
    pixels: Uint8Array,
    format: PixelFormat = PixelFormat.RGB
) => {
    // a destroyed renderer (eg: replaced while an operation was
    // pending) must not draw, as its resources are gone
    if (renderer.destroyed) return;

    const { gl, width, height } = renderer;
    const pixelFormat = format === PixelFormat.RGBA ? gl.RGBA : gl.RGB;

    // allocates the storage of the texture only when the format of
    // the pixels changes, replacing its contents otherwise
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.texture);
    if (renderer.format === format) {
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            width,
            height,
            pixelFormat,
            gl.UNSIGNED_BYTE,
            pixels
        );
    } else {
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            format === PixelFormat.RGBA ? gl.RGBA8 : gl.RGB8,
            width,
            height,
            0,
            pixelFormat,
            gl.UNSIGNED_BYTE,
            pixels
        );
        renderer.format = format;
    }

    render(renderer, renderer.program, renderer.texture, width, height);
};

/**
 * Draws the contents of a canvas, with the size of the drawing
 * surface, using the default (pass through) shader.
 *
 * @param renderer The renderer to draw the canvas with.
 * @param canvas The canvas whose contents are going to be drawn.
 */
export const drawCanvas = (renderer: Renderer, canvas: HTMLCanvasElement) => {
    if (renderer.destroyed) return;

    const { gl } = renderer;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.canvasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    render(
        renderer,
        renderer.passthrough,
        renderer.canvasTexture,
        canvas.width,
        canvas.height
    );
};

/**
 * Releases the WebGL2 resources of the renderer, that no longer
 * draws afterwards.
 *
 * @param renderer The renderer to be destroyed.
 */
export const destroyRenderer = (renderer: Renderer) => {
    if (renderer.destroyed) return;
    renderer.destroyed = true;

    const { gl } = renderer;
    gl.deleteTexture(renderer.texture);
    gl.deleteTexture(renderer.canvasTexture);
    gl.deleteBuffer(renderer.buffer);
    gl.deleteVertexArray(renderer.vertexArray);
    if (renderer.program !== renderer.passthrough) {
        gl.deleteProgram(renderer.program);
    }
    gl.deleteProgram(renderer.passthrough);
};

const render = (
    renderer: Renderer,
    program: WebGLProgram,
    texture: WebGLTexture,
    width: number,
    height: number
) => {
    const { gl } = renderer;
    const locations = renderer.locations.get(program) as Locations;
    const [outputWidth, outputHeight] = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight
    ];
    gl.viewport(0, 0, outputWidth, outputHeight);
    gl.useProgram(program);
    gl.uniform1i(locations.image, 0);
    gl.uniform2f(locations.inputResolution, width, height);
    gl.uniform2f(locations.outputResolution, outputWidth, outputHeight);
    gl.uniform2f(locations.origin, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindVertexArray(renderer.vertexArray);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
};

const createProgram = (
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
): WebGLProgram => {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    let fragment: WebGLShader;
    try {
        fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    } catch (err) {
        gl.deleteShader(vertex);
        throw err;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    // the shaders are no longer needed once the program is
    // linked, so they can be released right away
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Not possible to link program: ${log}`);
    }
    return program;
};

const compileShader = (
    gl: WebGL2RenderingContext,
    type: GLenum,
    source: string
): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Not possible to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Not possible to compile shader: ${log}`);
    }
    return shader;
};

const createTexture = (gl: WebGL2RenderingContext): WebGLTexture => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
};

const locateUniforms = (
    gl: WebGL2RenderingContext,
    program: WebGLProgram
): Locations => {
    return {
        image: gl.getUniformLocation(program, "image"),
        inputResolution: gl.getUniformLocation(program, "input_resolution"),
        outputResolution: gl.getUniformLocation(program, "output_resolution"),
        origin: gl.getUniformLocation(program, "origin")
    };
};
