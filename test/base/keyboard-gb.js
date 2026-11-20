const assert = require("assert");
const React = require("react");

// ignores the style sheets imported by the React components
// as they are bundler specific and can not be loaded by node
require.extensions[".css"] = () => {};

const {
    KeyboardGB
} = require("../../react/components/keyboard-gb/keyboard-gb.tsx");

/**
 * The original React hooks, replaced during the tests so that
 * the component can be run without a renderer, having its
 * effects executed immediately.
 */
const hooks = {
    useEffect: React.useEffect,
    useMemo: React.useMemo,
    useState: React.useState
};

/**
 * The original navigator property of the global object, that
 * is going to be restored once each test is over.
 */
const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    global,
    "navigator"
);

/**
 * The set of event listeners that have been registered against
 * the document and window stubs, used to simulate the events of
 * the physical keyboard and of the game pad.
 */
let listeners = [];

/**
 * The set of animation frame callbacks that have been scheduled,
 * used to run the game pad polling loop on demand.
 */
let frames = [];

/**
 * The pressed state of the buttons of the game pad stub, indexed
 * by the button index of the standard mapping.
 */
let buttons = [];

/**
 * The sequence of key down and key up events that have been
 * triggered by the keyboard component.
 */
let events = [];

/**
 * Renders the keyboard component with the provided props, running
 * its effects and recording the key events that are triggered.
 *
 * @param {object} props The props to be used in the keyboard component.
 * @returns {object} The React element tree rendered by the component.
 */
const render = (props = {}) =>
    KeyboardGB({
        onKeyDown: (key) => events.push(["down", key]),
        onKeyUp: (key) => events.push(["up", key]),
        ...props
    });

/**
 * Dispatches the provided event to the listeners that have been
 * registered for the event with the provided name.
 *
 * @param {string} name The name of the event to be dispatched.
 * @param {object} event The event to be passed to the listeners.
 */
const dispatch = (name, event) => {
    listeners
        .filter(([_name]) => _name === name)
        .forEach(([, callback]) => callback(event));
};

/**
 * Runs the next pending animation frame, triggering a polling
 * operation over the game pad stub.
 */
const poll = () => {
    frames.shift()();
};

/**
 * Finds the on screen keys that are part of the provided
 * React element tree, in their rendering order.
 *
 * @param {object} element The React element tree to search.
 * @returns {Array} The sequence of key elements found.
 */
const findKeys = (element) => {
    if (Array.isArray(element)) return element.flatMap(findKeys);
    if (!element || typeof element !== "object") return [];
    const { className = "", children } = element.props;
    if (className.split(" ").includes("key")) return [element];
    return findKeys(children);
};

describe("KeyboardGB", function () {
    beforeEach(() => {
        listeners = [];
        frames = [];
        buttons = new Array(17).fill(false);
        events = [];
        React.useEffect = (callback) => {
            callback();
        };
        React.useMemo = (callback) => callback();
        React.useState = (initial) => [initial, () => {}];
        const target = {
            addEventListener: (event, callback) => {
                listeners.push([event, callback]);
            },
            removeEventListener: () => {}
        };
        global.document = target;
        global.window = target;
        global.requestAnimationFrame = (callback) => {
            frames.push(callback);
            return frames.length;
        };
        Object.defineProperty(global, "navigator", {
            value: {
                userAgent: "Node",
                getGamepads: () => [
                    {
                        axes: [0, 0],
                        buttons: buttons.map((pressed) => ({ pressed }))
                    }
                ]
            },
            configurable: true,
            writable: true
        });
    });

    afterEach(() => {
        Object.assign(React, hooks);
        delete global.document;
        delete global.window;
        delete global.requestAnimationFrame;
        if (navigatorDescriptor) {
            Object.defineProperty(global, "navigator", navigatorDescriptor);
        } else {
            delete global.navigator;
        }
    });

    describe("#KeyboardGB()", function () {
        it("should not map the shoulder keys by default", () => {
            render();
            dispatch("keydown", { key: "q", preventDefault: () => {} });
            dispatch("keydown", { key: "W", preventDefault: () => {} });
            dispatch("keydown", { key: "a", preventDefault: () => {} });
            dispatch("keyup", { key: "q", preventDefault: () => {} });
            assert.deepStrictEqual(events, [["down", "A"]]);
        });

        it("should be able to map the shoulder keys", () => {
            render({ shoulders: true });
            dispatch("keydown", { key: "q", preventDefault: () => {} });
            dispatch("keydown", { key: "W", preventDefault: () => {} });
            dispatch("keydown", { key: "a", preventDefault: () => {} });
            dispatch("keyup", { key: "Q", preventDefault: () => {} });
            dispatch("keyup", { key: "w", preventDefault: () => {} });
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["down", "R"],
                ["down", "A"],
                ["up", "L"],
                ["up", "R"]
            ]);
        });

        it("should not map the shoulder buttons of the gamepad by default", () => {
            render();
            dispatch("gamepadconnected", {
                gamepad: { index: 0, id: "Gamepad", mapping: "standard" }
            });
            buttons[4] = true;
            buttons[5] = true;
            buttons[1] = true;
            poll();
            assert.deepStrictEqual(events, [["down", "A"]]);
        });

        it("should be able to map the shoulder buttons of the gamepad", () => {
            render({ shoulders: true });
            dispatch("gamepadconnected", {
                gamepad: { index: 0, id: "Gamepad", mapping: "standard" }
            });
            buttons[4] = true;
            poll();
            buttons[4] = false;
            buttons[5] = true;
            poll();
            buttons[5] = false;
            poll();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"],
                ["down", "R"],
                ["up", "R"]
            ]);
        });

        it("should not render the shoulder keys by default", () => {
            const keys = findKeys(render());
            assert.deepStrictEqual(
                keys.map((key) => key.props.children),
                ["▲", "◄", "►", "▼", "B", "A", "SELECT", "START"]
            );
        });

        it("should be able to render the shoulder keys", () => {
            const keys = findKeys(render({ shoulders: true }));
            assert.deepStrictEqual(
                keys.map((key) => key.props.children),
                ["L", "R", "▲", "◄", "►", "▼", "B", "A", "SELECT", "START"]
            );
            assert.ok(keys[0].props.className.split(" ").includes("l"));
            assert.ok(keys[1].props.className.split(" ").includes("r"));
        });

        it("should be able to press the shoulder keys on screen", () => {
            const [left, right] = findKeys(render({ shoulders: true }));
            left.props.onMouseDown({ preventDefault: () => {} });
            left.props.onMouseUp({ preventDefault: () => {} });
            right.props.onTouchStart({ preventDefault: () => {} });
            right.props.onTouchEnd({ preventDefault: () => {} });
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"],
                ["down", "R"],
                ["up", "R"]
            ]);
        });
    });
});
