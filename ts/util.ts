/**
 * Encodes an array of bytes into a base64 string.
 *
 * @param buffer The array of bytes to encode.
 * @returns The resulting base64 string.
 */
export const bufferToBase64 = (buffer: Uint8Array): string => {
    const data = Array(buffer.length)
        .fill(null)
        .map((_, i) => String.fromCharCode(buffer[i]))
        .join("");
    const base64 = btoa(data);
    return base64;
};

/**
 * Converts a base64 string into an array of bytes.
 *
 * @param base64 The base64 string to decode.
 * @returns The resulting array of bytes.
 */
export const base64ToBuffer = (base64: string): Uint8Array => {
    const data = atob(base64);
    const array = Array(data.length)
        .fill(null)
        .map((_, i) => data.charCodeAt(i));
    const buffer = new Uint8Array(array);
    return buffer;
};

/**
 * Tests if the current browser is running on an Android device.
 *
 * @returns If the current browser is running on an Android device.
 */
export const isAndroid = () => {
    return navigator.userAgent.match(/Android/i);
};

/**
 * Converts the provided RGB array into an image buffer
 * in the data URL format, ready to be used in an `<img>` tag.
 *
 * @param rgb RGB array to be used in the conversion.
 * @param width Width of the image.
 * @param height Height of the image.
 * @param format String with the MIME format of the image for which
 * a URL will be generated. Defaults to `image/png`.
 * @returns The generated data URL.
 */
export const rgbToDataUrl = (
    rgb: Uint8Array,
    width: number,
    height: number,
    format = "image/png"
): string => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not create canvas context");
    }
    const imageData = ctx.createImageData(width, height);
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        rgba[i * 4] = rgb[i * 3];
        rgba[i * 4 + 1] = rgb[i * 3 + 1];
        rgba[i * 4 + 2] = rgb[i * 3 + 2];
        rgba[i * 4 + 3] = 255;
    }
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL(format);
    return dataUrl;
};

/**
 * Downloads a file containing the data in the provided buffer.
 * The file will be downloaded with the provided filename.
 *
 * @param buffer Buffer containing the data to be downloaded.
 * @param filename Name of the file to be downloaded.
 * @param type MIME type of the file to be downloaded.
 * Defaults to `application/octet-stream`.
 */
export const downloadFromBuffer = (
    buffer: Uint8Array,
    filename: string,
    type = "application/octet-stream"
) => {
    const blob = new Blob([buffer], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("download", filename);
    link.setAttribute("href", url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
