import React, { FC, ReactNode, useMemo } from "react";
import PanelTab from "../panel-tab/panel-tab.tsx";

import "./debug.css";

type DebugProps = {
    panels: ReactNode[];
    names: string[];
    style?: string[];
};

export const Debug: FC<DebugProps> = ({ panels, names, style = [] }) => {
    const classes = useMemo(() => ["debug", ...style].join(" "), [style]);
    return (
        <div className={classes}>
            <PanelTab tabs={panels} tabNames={names} />
        </div>
    );
};

export default Debug;
