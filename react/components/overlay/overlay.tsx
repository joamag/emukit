import React, { FC, useEffect, useMemo, useState } from "react";

import "./overlay.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

export type OverlayStyle = string;

type OverlayProps = {
    text?: string;
    style?: OverlayStyle[];
    onFile?: (file: File) => void;
};

export const Overlay: FC<OverlayProps> = ({ text, style = [], onFile }) => {
    const [visible, setVisible] = useState(false);
    const classes = useMemo(
        () => ["overlay", visible ? "visible" : "", ...style].join(" "),
        [visible, style]
    );
    useEffect(() => {
        const isFile = (event: DragEvent) => {
            // run a series of validations to determine if the event
            // refers to a valid data transfer operation
            if (!event.dataTransfer) return false;
            if (!event.dataTransfer.items) return false;
            if (!event.dataTransfer.types) return false;

            // in case the items section of the data transfer
            // is defined and no valid type is found, we assume
            // that the user is dragging a binary file
            if (
                event.dataTransfer.items.length > 0 &&
                !event.dataTransfer.items[0].type
            ) {
                return true;
            }

            // in case the types section of the data transfer
            // is defined and the first type is "Files", we assume
            // that the user is dragging a binary file
            if (
                event.dataTransfer.types.length > 0 &&
                event.dataTransfer.types[0] === "Files"
            ) {
                return true;
            }

            return false;
        };
        const onDrop = async (event: DragEvent) => {
            if (!isFile(event)) return;
            if (!event.dataTransfer) return;

            setVisible(false);

            const file = event.dataTransfer.files[0];
            onFile?.(file);

            event.preventDefault();
            event.stopPropagation();
        };
        const onDragOver = async (event: DragEvent) => {
            if (!isFile(event)) return;
            setVisible(true);
            event.preventDefault();
        };
        const onDragEnter = async (event: DragEvent) => {
            if (!isFile(event)) return;
            setVisible(true);
        };
        const onDragLeave = async (event: DragEvent) => {
            if (!isFile(event)) return;
            setVisible(false);
        };
        document.addEventListener("drop", onDrop);
        document.addEventListener("dragover", onDragOver);
        document.addEventListener("dragenter", onDragEnter);
        document.addEventListener("dragleave", onDragLeave);
        return () => {
            document.removeEventListener("drop", onDrop);
            document.removeEventListener("dragover", onDragOver);
            document.removeEventListener("dragenter", onDragEnter);
            document.removeEventListener("dragleave", onDragLeave);
        };
    }, [onFile]);
    return (
        <div className={classes}>
            <div className="overlay-container">
                {text && <div className="overlay-text">{text}</div>}
                <div className="overlay-image">
                    <img alt="sunglasses" src={require("./sunglasses.png")} />
                </div>
            </div>
        </div>
    );
};

export default Overlay;
