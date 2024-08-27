import React, { FC, useMemo } from "react";

import "./toast.css";

export type ToastStyle = string;

type ToastProps = {
    text?: string;
    error?: boolean;
    visible?: boolean;
    style?: ToastStyle[];
    onCancel?: () => void;
};

export const Toast: FC<ToastProps> = ({
    text = "",
    error = false,
    visible = false,
    style = [],
    onCancel
}) => {
    const classes = useMemo(
        () =>
            [
                "toast",
                error ? "error" : "",
                visible ? "visible" : "",
                ...style
            ].join(" "),
        [error, visible, style]
    );
    return (
        <div className={classes}>
            <div className="toast-text" onClick={onCancel}>
                {text}
            </div>
        </div>
    );
};

export default Toast;
