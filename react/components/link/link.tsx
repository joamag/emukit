import React, { ReactNode, FC } from "react";

import "./link.css";

type LinkProps = {
    children?: ReactNode;
    text?: string;
    href?: string;
    target?: string;
    style?: string[];
    onClick?: () => void;
};

export const Link: FC<LinkProps> = ({
    children,
    text,
    href,
    target,
    style = [],
    onClick
}) => {
    const classes = () => ["link", onClick ? "click" : "", ...style].join(" ");
    return (
        <a className={classes()} href={href} target={target} onClick={onClick}>
            {children ?? text}
        </a>
    );
};

export default Link;
