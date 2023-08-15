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
