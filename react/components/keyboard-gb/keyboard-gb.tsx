import React, { FC, useEffect, useMemo, useRef, useState } from "react";

import { isAndroid } from "../../../ts/index.ts";

import "./keyboard-gb.css";

type KeyNames =
    | "ArrowUp"
    | "ArrowDown"
    | "ArrowLeft"
    | "ArrowRight"
    | "Start"
    | "Select"
    | "A"
    | "B"
    | "L"
    | "R";

const KEYS: Record<string, KeyNames> = {
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    Enter: "Start",
    " ": "Select",
    a: "A",
    s: "B",
    A: "A",
    S: "B"
};

/**
 * The keyboard keys of the shoulder buttons, only
 * used when the shoulders are enabled (eg: GBA).
 */
const KEYS_SHOULDERS: Record<string, KeyNames> = {
    q: "L",
    w: "R",
    Q: "L",
    W: "R"
};

const KEYS_STANDARD: Record<number, KeyNames> = {
    12: "ArrowUp",
    102: "ArrowUp",
    13: "ArrowDown",
    103: "ArrowDown",
    14: "ArrowLeft",
    100: "ArrowLeft",
    15: "ArrowRight",
    101: "ArrowRight",
    9: "Start",
    8: "Select",
    1: "A",
    0: "B"
};

/**
 * The standard game pad buttons of the shoulder buttons,
 * only used when the shoulders are enabled (eg: GBA).
 */
const KEYS_STANDARD_SHOULDERS: Record<number, KeyNames> = {
    4: "L",
    5: "R"
};

const PREVENT_KEYS: Record<string, boolean> = {
    ArrowUp: true,
    ArrowDown: true,
    ArrowLeft: true,
    ArrowRight: true,
    " ": true
};

export enum GamepadType {
    Unknown = 1,
    Standard,
    Xbox,
    Playstation,
    Switch
}

export type Gamepad = {
    index: number;
    id: string;
    type: GamepadType;
};

type KeyboardGBProps = {
    focusable?: boolean;
    fullscreen?: boolean;
    physical?: boolean;
    shoulders?: boolean;
    vibrate?: number;
    style?: string[];
    onKeyDown?: (key: string) => void;
    onKeyUp?: (key: string) => void;
    onGamepad?: (
        gamepad: Gamepad,
        isValid: boolean,
        connected?: boolean
    ) => void;
};

/**
 * The sequence of game pads that are considered
 * supported by the current implementation.
 */
const SUPPORTED_PADS = [GamepadType.Standard];

export const KeyboardGB: FC<KeyboardGBProps> = ({
    focusable = true,
    fullscreen = false,
    physical = true,
    shoulders = false,
    vibrate = 75,
    style = [],
    onKeyDown,
    onKeyUp,
    onGamepad
}) => {
    const containerClasses = useMemo(
        () => ["keyboard-container", fullscreen ? "fullscreen" : ""].join(" "),
        [fullscreen]
    );
    const [pressed, setPressed] = useState({
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Start: false,
        Select: false,
        A: false,
        B: false,
        L: false,
        R: false
    });
    const classes = useMemo(
        () =>
            [
                "keyboard",
                "keyboard-gb",
                fullscreen ? "fullscreen" : "",
                ...style
            ].join(" "),
        [fullscreen, style]
    );
    const shouldersRef = useRef(shoulders);
    const heldRef = useRef<Record<string, boolean>>({});
    useEffect(() => {
        // the polling of the game pads connected before a change of the
        // shoulders follows the latest value, while the shoulder keys
        // held when they get disabled are released, as the mapping that
        // would release them is gone
        shouldersRef.current = shoulders;
        if (!shoulders) {
            ["L", "R"].forEach((keyCode) => {
                if (!heldRef.current[keyCode]) return;
                heldRef.current[keyCode] = false;
                setPressed((prev) => ({ ...prev, [keyCode]: false }));
                onKeyUp?.(keyCode);
            });
        }

        if (!physical) return;
        const keys = shoulders ? { ...KEYS, ...KEYS_SHOULDERS } : KEYS;

        const getGamepadType = (gamepad: globalThis.Gamepad): GamepadType => {
            let gamepadType = GamepadType.Unknown;
            const isStandard = gamepad.mapping === "standard";
            if (isStandard) gamepadType = GamepadType.Standard;
            return gamepadType;
        };
        const _onKeyDown = (event: KeyboardEvent) => {
            const keyCode = keys[event.key];
            const isPrevent = PREVENT_KEYS[event.key] ?? false;
            if (isPrevent) event.preventDefault();
            if (keyCode !== undefined) {
                heldRef.current[keyCode] = true;
                setPressed((prev) => ({ ...prev, [keyCode]: true }));
                onKeyDown?.(keyCode);
                return;
            }
        };
        const _onKeyUp = (event: KeyboardEvent) => {
            const keyCode = keys[event.key];
            const isPrevent = PREVENT_KEYS[event.key] ?? false;
            if (isPrevent) event.preventDefault();
            if (keyCode !== undefined) {
                heldRef.current[keyCode] = false;
                setPressed((prev) => ({ ...prev, [keyCode]: false }));
                onKeyUp?.(keyCode);
                return;
            }
        };
        const onGamepadConnected = (event: GamepadEvent) => {
            const gamepad = event.gamepad;
            const gamepadType = getGamepadType(gamepad);
            const isValid = SUPPORTED_PADS.includes(gamepadType);

            if (onGamepad) {
                onGamepad(
                    {
                        index: gamepad.index,
                        id: gamepad.id,
                        type: gamepadType
                    },
                    isValid
                );
            }

            const getKeySolver = () => {
                let keySolver: Record<number, string> = {};
                switch (gamepadType) {
                    case GamepadType.Standard:
                        keySolver = shouldersRef.current
                            ? { ...KEYS_STANDARD, ...KEYS_STANDARD_SHOULDERS }
                            : KEYS_STANDARD;
                        break;
                }
                return keySolver;
            };
            let keySolver = getKeySolver();
            let keySolverShoulders = shouldersRef.current;

            const buttonStates: Record<number, boolean> = {};

            const updateStatus = () => {
                const _gamepad = navigator.getGamepads()[gamepad.index];
                if (!_gamepad) return;

                // once the shoulders change the mapping is resolved again
                // and the shoulder buttons start over as released, as their
                // keys have been released (or never pressed) meanwhile
                if (keySolverShoulders !== shouldersRef.current) {
                    keySolver = getKeySolver();
                    keySolverShoulders = shouldersRef.current;
                    Object.keys(KEYS_STANDARD_SHOULDERS).forEach((index) => {
                        buttonStates[Number(index)] = false;
                    });
                }

                handleButton(100, _gamepad.axes[0] < -0.5);
                handleButton(101, _gamepad.axes[0] > 0.5);
                handleButton(102, _gamepad.axes[1] < -0.5);
                handleButton(103, _gamepad.axes[1] > 0.5);

                _gamepad.buttons.forEach((button, index) => {
                    const pressed = button.pressed;
                    handleButton(index, pressed);
                });

                requestAnimationFrame(updateStatus);
            };

            const handleButton = (index: number, pressed: boolean) => {
                const keyCode = keySolver[index];
                if (keyCode === undefined) return;
                const state = buttonStates[index] ?? false;
                const keyDown = pressed && !state;
                const keyUp = !pressed && state;

                if (keyDown) {
                    heldRef.current[keyCode] = true;
                    setPressed((prev) => ({ ...prev, [keyCode]: true }));
                    onKeyDown?.(keyCode);
                }

                if (keyUp) {
                    heldRef.current[keyCode] = false;
                    setPressed((prev) => ({ ...prev, [keyCode]: false }));
                    onKeyUp?.(keyCode);
                }

                buttonStates[index] = pressed;
            };

            requestAnimationFrame(updateStatus);
        };
        const onGamepadDisconnected = (event: GamepadEvent) => {
            const gamepad = event.gamepad;
            const gamepadType = getGamepadType(gamepad);
            const isValid = SUPPORTED_PADS.includes(gamepadType);

            if (onGamepad) {
                onGamepad(
                    {
                        index: gamepad.index,
                        id: gamepad.id,
                        type: gamepadType
                    },
                    isValid,
                    false
                );
            }
        };
        document.addEventListener("keydown", _onKeyDown);
        document.addEventListener("keyup", _onKeyUp);
        window.addEventListener("gamepadconnected", onGamepadConnected);
        window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
        return () => {
            document.removeEventListener("keydown", _onKeyDown);
            document.removeEventListener("keyup", _onKeyUp);
            window.removeEventListener("gamepadconnected", onGamepadConnected);
            window.removeEventListener(
                "gamepadconnected",
                onGamepadDisconnected
            );
        };
    }, [onGamepad, onKeyDown, onKeyUp, physical, shoulders]);
    const renderKey = (
        key: string,
        keyName?: KeyNames,
        styles: string[] = []
    ) => {
        const keyCode = KEYS[keyName ?? key] ?? keyName ?? key ?? undefined;
        const classes = [
            "key",
            pressed[keyCode] ? "pressed" : "",
            ...styles
        ].join(" ");
        return (
            <span
                className={classes}
                key={keyName ?? key}
                tabIndex={focusable ? 0 : undefined}
                onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    setPressed((prev) => ({ ...prev, [keyCode]: true }));
                    onKeyDown?.(keyName ?? key);
                    event.preventDefault();
                }}
                onKeyUp={(event) => {
                    if (event.key !== "Enter") return;
                    setPressed((prev) => ({ ...prev, [keyCode]: false }));
                    onKeyUp?.(keyName ?? key);
                    event.preventDefault();
                }}
                onBlur={() => {
                    setPressed((prev) => ({ ...prev, [keyCode]: false }));
                    onKeyUp?.(key);
                }}
                onMouseDown={(event) => {
                    setPressed((prev) => ({ ...prev, [keyCode]: true }));
                    onKeyDown?.(keyName ?? key);
                    event.preventDefault();
                }}
                onMouseUp={(event) => {
                    setPressed((prev) => ({ ...prev, [keyCode]: false }));
                    onKeyUp?.(keyName ?? key);
                    event.preventDefault();
                }}
                onMouseLeave={(event) => {
                    if (!pressed[keyCode]) return;
                    setPressed((prev) => ({ ...prev, [keyCode]: false }));
                    onKeyUp?.(keyName ?? key);
                    event.preventDefault();
                }}
                onTouchStart={(event) => {
                    setPressed((prev) => ({ ...prev, [keyCode]: true }));
                    if (vibrate) {
                        window?.navigator?.vibrate?.(vibrate);
                    }
                    onKeyDown?.(keyName ?? key);
                    event.preventDefault();
                }}
                onTouchEnd={(event) => {
                    setPressed((prev) => ({ ...prev, [keyCode]: false }));
                    onKeyUp?.(keyName ?? key);
                    event.preventDefault();
                }}
            >
                {key}
            </span>
        );
    };
    return (
        <div className={containerClasses}>
            <div
                className={classes}
                onTouchStart={(e) => e.preventDefault()}
                onTouchEnd={(e) => e.preventDefault()}
            >
                {shoulders && (
                    <div className="shoulders">
                        {renderKey("L", "L", ["l"])}
                        {renderKey("R", "R", ["r"])}
                    </div>
                )}
                <div className="dpad">
                    <div className="dpad-top">
                        {renderKey(isAndroid() ? "▲" : "▲", "ArrowUp", ["up"])}
                    </div>
                    <div>
                        {renderKey(isAndroid() ? "◀" : "◄", "ArrowLeft", [
                            "left"
                        ])}
                        {renderKey(isAndroid() ? "▶" : "►", "ArrowRight", [
                            "right"
                        ])}
                    </div>
                    <div className="dpad-bottom">
                        {renderKey(isAndroid() ? "▼" : "▼", "ArrowDown", [
                            "down"
                        ])}
                    </div>
                </div>
                <div className="action">
                    {renderKey("B", "B", ["b"])}
                    {renderKey("A", "A", ["a"])}
                </div>
                <div className="break"></div>
                <div className="options">
                    {renderKey("SELECT", "Select", ["select"])}
                    {renderKey("START", "Start", ["start"])}
                </div>
            </div>
        </div>
    );
};

export default KeyboardGB;
