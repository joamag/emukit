import assert from "assert";
import { createRequire } from "module";

import { isValidElement, ReactElement, ReactNode } from "react";

const requireModule = createRequire(__filename);
const React = requireModule("react") as Record<string, unknown>;

// ignores the style sheets imported by the React components
// as they are bundler specific and can not be loaded by node
const originalCss = requireModule.extensions[".css"];
requireModule.extensions[".css"] = () => {};
const { KeyboardGB } = requireModule(
    "../../react/components/keyboard-gb/keyboard-gb.tsx"
) as typeof import("../../react/components/keyboard-gb/keyboard-gb.tsx");
if (originalCss) requireModule.extensions[".css"] = originalCss;
else delete requireModule.extensions[".css"];

/**
 * The props of the keyboard component.
 */
type KeyboardGBProps = Parameters<typeof KeyboardGB>[0];

/**
 * The event passed to the handlers of an on screen key.
 */
type KeyEvent = { preventDefault: () => void };

/**
 * The props of an on screen key, as rendered by the keyboard.
 */
type KeyProps = {
    className: string;
    children: string;
    onMouseDown: (event: KeyEvent) => void;
    onMouseUp: (event: KeyEvent) => void;
    onTouchStart: (event: KeyEvent) => void;
    onTouchEnd: (event: KeyEvent) => void;
};

/**
 * An event listener registered against the document and window
 * stubs, with the name of its event.
 */
type Listener = [string, (event: object) => void];

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
let listeners: Listener[] = [];

/**
 * The set of animation frame callbacks that have been scheduled,
 * used to run the game pad polling loop on demand.
 */
let frames: FrameRequestCallback[] = [];

/**
 * The pressed state of the buttons of the game pad stub, indexed
 * by the button index of the standard mapping.
 */
let buttons: boolean[] = [];

/**
 * The sequence of key down and key up events that have been
 * triggered by the keyboard component.
 */
let events: [string, string][] = [];

/**
 * The refs of the keyboard component, kept across renders as
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
 * Renders the keyboard component with the provided props, running
 * its effects (once the ones of the previous render are cleaned up)
 * and recording the key events that are triggered.
 *
 * @param props The props to be used in the keyboard component.
 * @returns The React element tree rendered by the component.
 */
const render = (props: KeyboardGBProps = {}): ReactNode => {
    cleanups.forEach((cleanup) => cleanup?.());
    cleanups = [];
    refIndex = 0;
    return KeyboardGB({
        onKeyDown: (key) => events.push(["down", key]),
        onKeyUp: (key) => events.push(["up", key]),
        ...props
    });
};

/**
 * Dispatches the provided event to the listeners that have been
 * registered for the event with the provided name.
 *
 * @param name The name of the event to be dispatched.
 * @param event The event to be passed to the listeners.
 */
const dispatch = (name: string, event: object) => {
    listeners
        .filter(([_name]) => _name === name)
        .forEach(([, callback]) => callback(event));
};

/**
 * Runs the next pending animation frame, triggering a polling
 * operation over the game pad stub.
 */
const poll = () => {
    (frames.shift() as FrameRequestCallback)(0);
};

/**
 * Finds the on screen keys that are part of the provided
 * React element tree, in their rendering order.
 *
 * @param element The React element tree to search.
 * @returns The sequence of key elements found.
 */
const findKeys = (element: ReactNode): ReactElement<KeyProps>[] => {
    if (Array.isArray(element)) return element.flatMap(findKeys);
    if (!isValidElement(element)) return [];
    const { className = "", children } = element.props as {
        className?: string;
        children?: ReactNode;
    };
    if (className.split(" ").includes("key")) {
        return [element as ReactElement<KeyProps>];
    }
    return findKeys(children);
};

describe("KeyboardGB", function () {
    beforeEach(() => {
        listeners = [];
        frames = [];
        buttons = new Array(17).fill(false);
        events = [];
        refs = [];
        cleanups = [];
        React.useEffect = (callback: () => void | (() => void)) => {
            cleanups.push(callback());
        };
        React.useMemo = (callback: () => unknown) => callback();
        React.useRef = (initial: unknown) => {
            if (refIndex === refs.length) refs.push({ current: initial });
            return refs[refIndex++];
        };
        React.useState = (initial: unknown) => [initial, () => {}];
        const target = {
            addEventListener: (event: string, callback: Listener[1]) => {
                listeners.push([event, callback]);
            },
            removeEventListener: (event: string, callback: Listener[1]) => {
                listeners = listeners.filter(
                    ([_event, _callback]) =>
                        _event !== event || _callback !== callback
                );
            }
        };
        global.document = target as unknown as Document;
        global.window = target as unknown as Window & typeof globalThis;
        global.requestAnimationFrame = (callback: FrameRequestCallback) => {
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
        delete (globalThis as { document?: unknown }).document;
        delete (globalThis as { window?: unknown }).window;
        delete (globalThis as { requestAnimationFrame?: unknown })
            .requestAnimationFrame;
        if (navigatorDescriptor) {
            Object.defineProperty(global, "navigator", navigatorDescriptor);
        } else {
            delete (globalThis as { navigator?: unknown }).navigator;
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

        it("should release the shoulder keys when the shoulders are disabled", () => {
            render({ shoulders: true });
            dispatch("keydown", { key: "q", preventDefault: () => {} });
            dispatch("keydown", { key: "a", preventDefault: () => {} });
            render();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["down", "A"],
                ["up", "L"]
            ]);
            dispatch("keyup", { key: "q", preventDefault: () => {} });
            dispatch("keyup", { key: "a", preventDefault: () => {} });
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["down", "A"],
                ["up", "L"],
                ["up", "A"]
            ]);
        });

        it("should release the shoulder keys when the physical keys are disabled", () => {
            render({ shoulders: true });
            dispatch("keydown", { key: "q", preventDefault: () => {} });
            render({ physical: false });
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"]
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

        it("should follow the shoulders on an already connected gamepad", () => {
            render();
            dispatch("gamepadconnected", {
                gamepad: { index: 0, id: "Gamepad", mapping: "standard" }
            });
            render({ shoulders: true });
            buttons[4] = true;
            poll();
            buttons[4] = false;
            poll();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"]
            ]);
        });

        it("should release the shoulder buttons of the gamepad when the shoulders are disabled", () => {
            render({ shoulders: true });
            dispatch("gamepadconnected", {
                gamepad: { index: 0, id: "Gamepad", mapping: "standard" }
            });
            buttons[4] = true;
            poll();
            render();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"]
            ]);
            buttons[4] = false;
            poll();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"]
            ]);
        });

        it("should press again the shoulder buttons of the gamepad held while the shoulders are enabled again", () => {
            render({ shoulders: true });
            dispatch("gamepadconnected", {
                gamepad: { index: 0, id: "Gamepad", mapping: "standard" }
            });
            buttons[4] = true;
            poll();
            render();
            poll();
            render({ shoulders: true });
            poll();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"],
                ["down", "L"]
            ]);
        });

        it("should not release again the shoulder buttons of the gamepad released while the shoulders are disabled", () => {
            render({ shoulders: true });
            dispatch("gamepadconnected", {
                gamepad: { index: 0, id: "Gamepad", mapping: "standard" }
            });
            buttons[4] = true;
            poll();
            render();
            buttons[4] = false;
            poll();
            render({ shoulders: true });
            poll();
            assert.deepStrictEqual(events, [
                ["down", "L"],
                ["up", "L"]
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
