import React, { FC } from "react";

import "./text-input.css";

type TextInputProps = {
    type?: "text" | "password" | "email" | "number" | "search" | "tel" | "url";
    size?: "small" | "medium" | "large";
    placeholder?: string;
    style?: string[];
};

export const TextInput: FC<TextInputProps> = ({
    type = "text",
    size = "large",
    placeholder,
    style = []
}) => {
    const classes = () => ["text-input", size, ...style].join(" ");
    return (
        <input className={classes()} type={type} placeholder={placeholder} />
    );
};

export default TextInput;
