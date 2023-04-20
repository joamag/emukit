import React, { FC, ReactNode, useState } from "react";

import "./panel-tab.css";

type PanelTabProps = {
    tabs: ReactNode[];
    tabNames: string[];
    tabIndex?: number;
    selectors?: boolean;
    flex?: boolean;
    style?: string[];
};

export const PanelTab: FC<PanelTabProps> = ({
    tabs,
    tabNames,
    tabIndex = 0,
    selectors = true,
    flex = false,
    style = []
}) => {
    const classes = () => ["panel-tab", flex ? "flex" : "", ...style].join(" ");
    const [tabIndexState, setTabIndexState] = useState(tabIndex);
    return (
        <div className={classes()}>
            {selectors && (
                <div className="tab-selectors">
                    {tabNames.map((tabName, tabIndex) => {
                        const classes = [
                            "tab-selector",
                            tabIndex === tabIndexState ? "selected" : ""
                        ].join(" ");
                        return (
                            <span
                                key={tabIndex}
                                className={classes}
                                onClick={() => setTabIndexState(tabIndex)}
                            >
                                {tabName}
                            </span>
                        );
                    })}
                </div>
            )}
            <div className="tab-containers">
                {tabs.map((tab, tabIndex) => {
                    const classes = [
                        "tab-container",
                        tabIndex === tabIndexState ? "selected" : ""
                    ].join(" ");
                    return (
                        <div key={tabIndex} className={classes}>
                            {tabs[tabIndex]}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PanelTab;
