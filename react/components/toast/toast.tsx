import React, { FC } from "react";

import "./toast.css";

export type ToastStyle = "";

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
    const classes = () =>
        [
            "toast",
            error ? "error" : "",
            visible ? "visible" : "",
            ...style
        ].join(" ");
    return (
        <div className={classes()}>
            <div className="toast-text" onClick={onCancel}>
                {text}
            </div>
        </div>
    );
};

export default Toast;
