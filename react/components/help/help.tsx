import React, { FC, ReactNode, useMemo } from "react";

import PanelTab from "../panel-tab/panel-tab.tsx";

import "./help.css";

type HelpProps = {
    panels: ReactNode[];
    names: string[];
    style?: string[];
};

export const Help: FC<HelpProps> = ({ panels, names, style = [] }) => {
    const classes = useMemo(() => ["help", ...style].join(" "), [style]);
    return (
        <div className={classes}>
            <PanelTab tabs={panels} tabNames={names} flex={true} />
        </div>
    );
};

export default Help;
