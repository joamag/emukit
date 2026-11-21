import assert from "assert";

import { EmulatorLogic, Feature, LoopMode } from "../../ts/structs.ts";

/**
 * The set of visibility change listeners that have been registered
 * against the document stub, used to verify the release of the
 * listeners on the stop operation.
 */
let listeners: [string, () => void][] = [];

/**
 * The set of animation frame callbacks that have been scheduled
 * against the window stub, they are never executed so that a
 * document that suspends the scheduling of frames is simulated.
 */
let frames: FrameRequestCallback[] = [];

/**
 * The set of animation frame identifiers that have been cancelled
 * against the window stub.
 */
let cancelled: number[] = [];

/**
 * Waits the provided amount of milliseconds, allowing the emulator
 * loop to run for a deterministic amount of time.
 *
 * @param timeout The number of milliseconds to wait for.
 * @returns The promise to be resolved once the wait is over.
 */
const sleep = (timeout: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });

/**
 * Builds a simple emulator implementation that counts the number of
 * tick operations that have been performed, allowing the verification
 * of the main loop execution.
 *
 * @param boot The boot operation to be run by the emulator,
 * defaults to an immediately resolved one.
 * @returns The emulator instance to be used in testing.
 */
const buildEmulator = (boot: () => Promise<void> = async () => {}) => {
    class TestEmulator extends EmulatorLogic {
        tickCount = 0;

        async boot() {
            await boot();
        }

        async tick() {
            this.tickCount++;
        }
    }
    return new TestEmulator();
};

describe("Feature", function () {
    it("should keep the values of the existing features", () => {
        assert.strictEqual(Feature.Help, 1);
        assert.strictEqual(Feature.KeyboardGB, 9);
        assert.strictEqual(Feature.DisplayFrequency, 10);
        assert.strictEqual(Feature.SaveState, 18);
        assert.strictEqual(Feature.KeyboardGBA, 19);
    });
});

describe("EmulatorLogic", function () {
    beforeEach(() => {
        listeners = [];
        frames = [];
        cancelled = [];
        global.window = {
            requestAnimationFrame: (callback: FrameRequestCallback) => {
                frames.push(callback);
                return frames.length;
            },
            cancelAnimationFrame: (handle: number) => {
                cancelled.push(handle);
            }
        } as unknown as Window & typeof globalThis;
        global.document = {
            visibilityState: "visible",
            addEventListener: (event: string, callback: () => void) => {
                listeners.push([event, callback]);
            },
            removeEventListener: (event: string, callback: () => void) => {
                listeners = listeners.filter(
                    ([_event, _callback]) =>
                        _event !== event || _callback !== callback
                );
            }
        } as unknown as Document;
    });

    afterEach(() => {
        delete (globalThis as { document?: unknown }).document;
        delete (globalThis as { window?: unknown }).window;
    });

    describe("#start()", function () {
        it("should be able to run the main loop while running", async () => {
            const emulator = buildEmulator();
            const start = emulator.start({ loopMode: LoopMode.SetTimeout });
            await sleep(100);
            assert.ok(emulator.tickCount > 0);
            await emulator.stop();
            await start;
        });

        it("should be able to register the visibility listener", async () => {
            const emulator = buildEmulator();
            const start = emulator.start({ loopMode: LoopMode.SetTimeout });
            await sleep(50);
            assert.strictEqual(listeners.length, 1);
            assert.strictEqual(listeners[0][0], "visibilitychange");
            await emulator.stop();
            await start;
        });

        it("should not register the visibility listener once stopped", async () => {
            let bootResolve = () => {};
            const emulator = buildEmulator(
                () =>
                    new Promise((resolve) => {
                        bootResolve = resolve;
                    })
            );
            const start = emulator.start({ loopMode: LoopMode.SetTimeout });
            await sleep(20);
            assert.strictEqual(listeners.length, 0);
            await emulator.stop();
            bootResolve();
            await start;
            assert.strictEqual(listeners.length, 0);
            assert.strictEqual(emulator.tickCount, 0);
        });

        it("should be able to reset the running state on a boot error", async () => {
            const emulator = buildEmulator(async () => {
                throw new Error("Unable to boot");
            });
            await assert.rejects(
                emulator.start({ loopMode: LoopMode.SetTimeout })
            );
            assert.strictEqual(listeners.length, 0);
            assert.strictEqual(emulator.tickCount, 0);
        });
    });

    describe("#stop()", function () {
        it("should be able to terminate the main loop", async () => {
            const emulator = buildEmulator();
            const start = emulator.start({ loopMode: LoopMode.SetTimeout });
            await sleep(100);
            await emulator.stop();
            await start;
            const tickCount = emulator.tickCount;
            assert.ok(tickCount > 0);
            await sleep(100);
            assert.strictEqual(emulator.tickCount, tickCount);
        });

        it("should be able to release the visibility listener", async () => {
            const emulator = buildEmulator();
            const start = emulator.start({ loopMode: LoopMode.SetTimeout });
            await sleep(50);
            assert.strictEqual(listeners.length, 1);
            await emulator.stop();
            await start;
            assert.strictEqual(listeners.length, 0);
        });

        it("should be able to settle the animation loop without a frame", async () => {
            const emulator = buildEmulator();
            const start = emulator.start({
                loopMode: LoopMode.AnimationFrame
            });
            await sleep(50);
            assert.strictEqual(frames.length, 1);
            await emulator.stop();
            await start;
            assert.strictEqual(frames.length, 1);
        });

        it("should be able to cancel the pending animation frame", async () => {
            const emulator = buildEmulator();
            const start = emulator.start({
                loopMode: LoopMode.AnimationFrame
            });
            await sleep(50);
            await emulator.stop();
            await start;
            assert.strictEqual(cancelled.length, 1);
            assert.strictEqual(cancelled[0], 1);
        });

        it("should be able to stop an emulator that never started", async () => {
            const emulator = buildEmulator();
            await emulator.stop();
            assert.strictEqual(emulator.tickCount, 0);
            assert.strictEqual(listeners.length, 0);
        });
    });
});
