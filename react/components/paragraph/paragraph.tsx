import React, { ReactNode, FC } from "react";

import "./paragraph.css";

export type ParagraphStyle = string;

type ParagraphProps = {
    children?: ReactNode;
    text?: string;
    style?: ParagraphStyle[];
};

export const Paragraph: FC<ParagraphProps> = ({
    children,
    text,
    style = []
}) => {
    const classes = () => ["paragraph", ...style].join(" ");
    return <p className={classes()}>{children ?? text}</p>;
};

export default Paragraph;
