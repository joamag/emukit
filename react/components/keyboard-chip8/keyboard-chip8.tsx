import React, { FC, useEffect, useRef, useState } from "react";

import "./keyboard-chip8.css";

const KEYS: Record<string, string> = {
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
    const classes = () => ["keyboard", "keyboard-chip8", ...style].join(" ");
    const recordRef =
        useRef<Record<string, React.Dispatch<React.SetStateAction<boolean>>>>();
    useEffect(() => {
        if (!physical) return;
        const _onKeyDown = (event: KeyboardEvent) => {
            const keyCode = KEYS[event.key];
            if (keyCode !== undefined) {
                const records = recordRef.current ?? {};
                const setter = records[keyCode];
                setter(true);
                onKeyDown && onKeyDown(keyCode);
                return;
            }
        };
        const _onKeyUp = (event: KeyboardEvent) => {
            const keyCode = KEYS[event.key];
            if (keyCode !== undefined) {
                const records = recordRef.current ?? {};
                const setter = records[keyCode];
                setter(false);
                onKeyUp && onKeyUp(keyCode);
                return;
            }
        };
        document.addEventListener("keydown", _onKeyDown);
        document.addEventListener("keyup", _onKeyUp);
        return () => {
            document.removeEventListener("keydown", _onKeyDown);
            document.removeEventListener("keyup", _onKeyUp);
        };
    }, []);
    const renderKey = (
        key: string,
        selected = false,
        styles: string[] = []
    ) => {
        const [pressed, setPressed] = useState(selected);
        const classes = ["key", pressed ? "pressed" : "", ...styles].join(" ");
        const records = recordRef.current ?? {};
        records[key ?? "undefined"] = setPressed;
        recordRef.current = records;
        return (
            <span
                className={classes}
                key={key}
                tabIndex={focusable ? 0 : undefined}
                onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    setPressed(true);
                    onKeyDown && onKeyDown(key);
                    event.preventDefault();
                }}
                onKeyUp={(event) => {
                    if (event.key !== "Enter") return;
                    setPressed(false);
                    onKeyUp && onKeyUp(key);
                    event.preventDefault();
                }}
                onBlur={() => {
                    setPressed(false);
                    onKeyUp && onKeyUp(key);
                }}
                onMouseDown={(event) => {
                    setPressed(true);
                    onKeyDown && onKeyDown(key);
                    event.preventDefault();
                }}
                onMouseUp={(event) => {
                    setPressed(false);
                    onKeyUp && onKeyUp(key);
                    event.preventDefault();
                }}
                onMouseLeave={(event) => {
                    if (!pressed) return;
                    setPressed(false);
                    onKeyUp && onKeyUp(key);
                    event.preventDefault();
                }}
                onTouchStart={(event) => {
                    setPressed(true);
                    vibrate && window?.navigator?.vibrate?.(vibrate);
                    onKeyDown && onKeyDown(key);
                    event.preventDefault();
                }}
                onTouchEnd={(event) => {
                    setPressed(false);
                    onKeyUp && onKeyUp(key);
                    event.preventDefault();
                }}
            >
                {key}
            </span>
        );
    };
    return (
        <div className={classes()}>
            <div className="keyboard-line">
                {["1", "2", "3", "4"].map((k) => renderKey(k))}
            </div>
            <div className="keyboard-line">
                {["Q", "W", "E", "R"].map((k) => renderKey(k))}
            </div>
            <div className="keyboard-line">
                {["A", "S", "D", "F"].map((k) => renderKey(k))}
            </div>
            <div className="keyboard-line">
                {["Z", "X", "C", "V"].map((k) => renderKey(k))}
            </div>
        </div>
    );
};

export default KeyboardChip8;
