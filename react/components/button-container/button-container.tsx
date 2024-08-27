import React, { FC, ReactNode, useMemo } from "react";

import "./button-container.css";

type ButtonContainerProps = {
    children: ReactNode;
    style?: string[];
};

export const ButtonContainer: FC<ButtonContainerProps> = ({
    children,
    style = []
}) => {
    const classes = useMemo(
        () => ["button-container", ...style].join(" "),
        [style]
    );
    return <div className={classes}>{children}</div>;
};

export default ButtonContainer;
