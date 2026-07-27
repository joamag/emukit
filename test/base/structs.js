const assert = require("assert");

const { EmulatorLogic, LoopMode } = require("../../ts/structs.ts");

/**
 * The set of visibility change listeners that have been registered
 * against the document stub, used to verify the release of the
 * listeners on the stop operation.
 */
let listeners = [];

/**
 * Waits the provided amount of milliseconds, allowing the emulator
 * loop to run for a deterministic amount of time.
 *
 * @param {number} timeout The number of milliseconds to wait for.
 * @returns {Promise} The promise to be resolved once the wait is over.
 */
const sleep = (timeout) =>
    new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });

/**
 * Builds a simple emulator implementation that counts the number of
 * tick operations that have been performed, allowing the verification
 * of the main loop execution.
 *
 * @returns {object} The emulator instance to be used in testing.
 */
const buildEmulator = () => {
    class TestEmulator extends EmulatorLogic {
        constructor() {
            super();
            this.tickCount = 0;
        }

        async boot() {}

        async tick() {
            this.tickCount++;
        }
    }
    return new TestEmulator();
};

describe("EmulatorLogic", function () {
    beforeEach(() => {
        listeners = [];
        global.document = {
            visibilityState: "visible",
            addEventListener: (event, callback) => {
                listeners.push([event, callback]);
            },
            removeEventListener: (event, callback) => {
                listeners = listeners.filter(
                    ([_event, _callback]) =>
                        _event !== event || _callback !== callback
                );
            }
        };
    });

    afterEach(() => {
        delete global.document;
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

        it("should be able to stop an emulator that never started", async () => {
            const emulator = buildEmulator();
            await emulator.stop();
            assert.strictEqual(emulator.tickCount, 0);
            assert.strictEqual(listeners.length, 0);
        });
    });
});
