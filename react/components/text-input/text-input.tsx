import React, { FC } from "react";

import "./text-input.css";

type TextInputProps = {
    type: "text" | "password" | "email" | "number" | "search" | "tel" | "url";
    style?: string[];
};

export const TextInput: FC<TextInputProps> = ({ type, style = [] }) => {
    const classes = () => ["text-input", ...style].join(" ");
    return <input type={type} className={classes()} />;
};

export default TextInput;
