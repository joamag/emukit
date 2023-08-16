import React, { FC, useState } from "react";
import Button, { ButtonSize, ButtonStyle } from "../button/button";

type ButtonSwitchProps = {
    options: string[];
    value?: string;
    uppercase?: boolean;
    size?: ButtonSize;
    style?: ButtonStyle[];
    onClick?: () => void;
    onChange?: (value: string, index: number) => void;
};

export const ButtonSwitch: FC<ButtonSwitchProps> = ({
    options,
    value,
    uppercase = false,
    size = "small",
    style = ["simple", "border"],
    onClick,
    onChange
}) => {
    const initial = value === undefined ? 0 : options.indexOf(value);
    const [index, setIndex] = useState(initial);
    const text = () =>
        uppercase ? options[index].toUpperCase() : options[index];
    const _onClick = () => {
        const indexNew = (index + 1) % options.length;
        const option = options[indexNew];
        setIndex(indexNew);
        if (onClick) onClick();
        if (onChange) onChange(option, indexNew);
    };
    return (
        <Button text={text()} size={size} style={style} onClick={_onClick} />
    );
};

export default ButtonSwitch;
