const assert = require("assert");

const { downloadFromBuffer } = require("../../ts/util.ts");

/**
 * The set of blob parts that have been provided to the blob stub,
 * used to verify the data that is handed over for download.
 */
let parts = [];

/**
 * The set of anchor elements that have been created by the document
 * stub, used to verify the download attributes.
 */
let links = [];

describe("Util", function () {
    beforeEach(() => {
        parts = [];
        links = [];
        global.Blob = class {
            constructor(blobParts) {
                parts.push(...blobParts);
            }
        };
        global.URL = {
            createObjectURL: () => "blob:url",
            revokeObjectURL: () => undefined
        };
        global.document = {
            createElement: () => {
                const link = {
                    attributes: {},
                    setAttribute: (name, value) => {
                        link.attributes[name] = value;
                    },
                    click: () => undefined
                };
                links.push(link);
                return link;
            },
            body: {
                appendChild: () => undefined,
                removeChild: () => undefined
            }
        };
    });

    afterEach(() => {
        delete global.Blob;
        delete global.URL;
        delete global.document;
    });

    describe("#downloadFromBuffer()", function () {
        it("should be able to download a simple buffer", () => {
            downloadFromBuffer(new Uint8Array([1, 2, 3]), "file.bin");
            assert.strictEqual(parts.length, 1);
            assert.deepStrictEqual(Array.from(parts[0]), [1, 2, 3]);
            assert.strictEqual(links[0].attributes["download"], "file.bin");
        });

        it("should be able to download a shared buffer", () => {
            const shared = new Uint8Array(new SharedArrayBuffer(2));
            shared[0] = 7;
            shared[1] = 9;
            downloadFromBuffer(shared, "shared.bin");
            assert.deepStrictEqual(Array.from(parts[0]), [7, 9]);
        });

        it("should be able to detach the buffer from the source", () => {
            const buffer = new Uint8Array([1, 2, 3]);
            downloadFromBuffer(buffer, "file.bin");
            buffer[0] = 9;
            assert.deepStrictEqual(Array.from(parts[0]), [1, 2, 3]);
        });
    });
});
