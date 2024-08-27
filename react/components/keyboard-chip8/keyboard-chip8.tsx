import React, { FC, useEffect, useMemo, useState } from "react";

import "./keyboard-chip8.css";

type KeyNames =
    | "1"
    | "2"
    | "3"
    | "4"
    | "Q"
    | "W"
    | "E"
    | "R"
    | "A"
    | "S"
    | "D"
    | "F"
    | "Z"
    | "X"
    | "C"
    | "V";

const KEYS: Record<string, KeyNames> = {
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    q: "Q",
    w: "W",
    e: "E",
    r: "R",
    a: "A",
    s: "S",
    d: "D",
    f: "F",
    z: "Z",
    x: "X",
    c: "C",
    v: "V",
    Q: "Q",
    W: "W",
    E: "E",
    R: "R",
    A: "A",
    S: "S",
    D: "D",
    F: "F",
    Z: "Z",
    X: "X",
    C: "C",
    V: "V"
};

type KeyboardChip8Props = {
    focusable?: boolean;
    physical?: boolean;
    vibrate?: number;
    style?: string[];
    onKeyDown?: (key: string) => void;
    onKeyUp?: (key: string) => void;
};

export const KeyboardChip8: FC<KeyboardChip8Props> = ({
    focusable = true,
    physical = true,
    vibrate = 75,
    style = [],
    onKeyDown,
    onKeyUp
}) => {
    const classes = useMemo(
        () => ["keyboard", "keyboard-chip8", ...style].join(" "),
        [style]
    );
    const [pressed, setPressed] = useState({
        "1": false,
        "2": false,
        "3": false,
        "4": false,
        Q: false,
        W: false,
        E: false,
        R: false,
        A: false,
        S: false,
        D: false,
        F: false,
        Z: false,
        X: false,
        C: false,
        V: false
    });
    useEffect(() => {
        if (!physical) return;
        const _onKeyDown = (event: KeyboardEvent) => {
            const keyCode = KEYS[event.key];
            if (keyCode !== undefined) {
                setPressed((prev) => ({ ...prev, [keyCode]: true }));
                onKeyDown?.(keyCode);
                return;
            }
        };
        const _onKeyUp = (event: KeyboardEvent) => {
            const keyCode = KEYS[event.key];
            if (keyCode !== undefined) {
                setPressed((prev) => ({ ...prev, [keyCode]: false }));
                onKeyUp?.(keyCode);
                return;
            }
        };
        document.addEventListener("keydown", _onKeyDown);
        document.addEventListener("keyup", _onKeyUp);
        return () => {
            document.removeEventListener("keydown", _onKeyDown);
            document.removeEventListener("keyup", _onKeyUp);
        };
    }, [onKeyDown, onKeyUp, physical]);
    const renderKey = (key: KeyNames, styles: string[] = []) => {
        const classes = ["key", pressed[key] ? "pressed" : "", ...styles].join(
            " "
        );
        return (
            <span
                className={classes}
                key={key}
                tabIndex={focusable ? 0 : undefined}
                onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    setPressed((prev) => ({ ...prev, [key]: true }));
                    onKeyDown?.(key);
                    event.preventDefault();
                }}
                onKeyUp={(event) => {
                    if (event.key !== "Enter") return;
                    setPressed((prev) => ({ ...prev, [key]: false }));
                    onKeyUp?.(key);
                    event.preventDefault();
                }}
                onBlur={() => {
                    setPressed((prev) => ({ ...prev, [key]: false }));
                    onKeyUp?.(key);
                }}
                onMouseDown={(event) => {
                    setPressed((prev) => ({ ...prev, [key]: true }));
                    onKeyDown?.(key);
                    event.preventDefault();
                }}
                onMouseUp={(event) => {
                    setPressed((prev) => ({ ...prev, [key]: false }));
                    onKeyUp?.(key);
                    event.preventDefault();
                }}
                onMouseLeave={(event) => {
                    if (!pressed[key]) return;
                    setPressed((prev) => ({ ...prev, [key]: false }));
                    onKeyUp?.(key);
                    event.preventDefault();
                }}
                onTouchStart={(event) => {
                    setPressed((prev) => ({ ...prev, [key]: true }));
                    vibrate && window?.navigator?.vibrate?.(vibrate);
                    onKeyDown?.(key);
                    event.preventDefault();
                }}
                onTouchEnd={(event) => {
                    setPressed((prev) => ({ ...prev, [key]: false }));
                    onKeyUp?.(key);
                    event.preventDefault();
                }}
            >
                {key}
            </span>
        );
    };
    return (
        <div className={classes}>
            <div className="keyboard-line">
                {["1", "2", "3", "4"].map((k) => renderKey(k as KeyNames))}
            </div>
            <div className="keyboard-line">
                {["Q", "W", "E", "R"].map((k) => renderKey(k as KeyNames))}
            </div>
            <div className="keyboard-line">
                {["A", "S", "D", "F"].map((k) => renderKey(k as KeyNames))}
            </div>
            <div className="keyboard-line">
                {["Z", "X", "C", "V"].map((k) => renderKey(k as KeyNames))}
            </div>
        </div>
    );
};

export default KeyboardChip8;
