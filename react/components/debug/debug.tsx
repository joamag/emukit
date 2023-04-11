import React, { FC, ReactNode } from "react";
import PanelTab from "../panel-tab/panel-tab";

import "./debug.css";

type DebugProps = {
    panels: ReactNode[];
    names: string[];
    style?: string[];
};

export const Debug: FC<DebugProps> = ({ panels, names, style = [] }) => {
    const classes = () => ["debug", ...style].join(" ");
    return (
        <div className={classes()}>
            <PanelTab tabs={panels} tabNames={names} />
        </div>
    );
};

export default Debug;
