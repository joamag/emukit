import React, { FC, ReactNode, useMemo } from "react";

import "./panel-split.css";

type PanelSplitProps = {
    children?: ReactNode;
    left?: ReactNode;
    right?: ReactNode;
    style?: string[];
};

export const PanelSplit: FC<PanelSplitProps> = ({
    children,
    left,
    right,
    style = []
}) => {
    const classes = useMemo(() => ["panel-split", ...style].join(" "), [style]);
    return (
        <div className={classes}>
            <div className="side-left">{left}</div>
            <div className="side-right">{children ?? right}</div>
        </div>
    );
};

export default PanelSplit;
