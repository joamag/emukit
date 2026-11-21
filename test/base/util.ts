import assert from "assert";

import { downloadFromBuffer } from "../../ts/util.ts";

/**
 * The anchor element created by the document stub, with the
 * attributes that have been set on it.
 */
type Link = {
    attributes: Record<string, string>;
    setAttribute: (name: string, value: string) => void;
    click: () => void;
};

/**
 * The set of blob parts that have been provided to the blob stub,
 * used to verify the data that is handed over for download.
 */
let parts: Uint8Array[] = [];

/**
 * The set of anchor elements that have been created by the document
 * stub, used to verify the download attributes.
 */
let links: Link[] = [];

/**
 * The original Blob and URL of the global object, that are going
 * to be restored once each test is over, as they are part of Node.js.
 */
const { Blob, URL } = global;

describe("Util", function () {
    beforeEach(() => {
        parts = [];
        links = [];
        global.Blob = class {
            constructor(blobParts: Uint8Array[]) {
                parts.push(...blobParts);
            }
        } as unknown as typeof Blob;
        global.URL = {
            createObjectURL: () => "blob:url",
            revokeObjectURL: () => undefined
        } as unknown as typeof URL;
        global.document = {
            createElement: () => {
                const link: Link = {
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
        } as unknown as Document;
    });

    afterEach(() => {
        global.Blob = Blob;
        global.URL = URL;
        delete (globalThis as { document?: unknown }).document;
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
