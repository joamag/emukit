import React, { FC, useMemo } from "react";

import "./text-input.css";

type TextInputProps = {
    type?: "text" | "password" | "email" | "number" | "search" | "tel" | "url";
    size?: "small" | "medium" | "large";
    value?: string;
    placeholder?: string;
    style?: string[];
    onChange?: (value: string) => void;
};

export const TextInput: FC<TextInputProps> = ({
    type = "text",
    size = "large",
    value,
    placeholder,
    style = [],
    onChange
}) => {
    const classes = useMemo(
        () => ["text-input", size, ...style].join(" "),
        [size, style]
    );
    return (
        <input
            className={classes}
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
        />
    );
};

export default TextInput;
