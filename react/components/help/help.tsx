import React, { FC, ReactNode } from "react";
import PanelTab from "../panel-tab/panel-tab";

import "./help.css";

type HelpProps = {
    panels: ReactNode[];
    names: string[];
    style?: string[];
};

export const Help: FC<HelpProps> = ({ panels, names, style = [] }) => {
    const classes = () => ["help", ...style].join(" ");
    return (
        <div className={classes()}>
            <PanelTab tabs={panels} tabNames={names} flex={true} />
        </div>
    );
};

export default Help;
