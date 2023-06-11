import React, { FC } from "react";

import "./text-input.css";

type TextInputProps = {
    style?: string[];
};

export const TextInput: FC<TextInputProps> = ({ style = [] }) => {
    const classes = () => ["text-input", ...style].join(" ");
    return <input type="text" className={classes()} />;
};

export default TextInput;
