import React, { FC } from "react";

import PanelTab from "../panel-tab/panel-tab.tsx";
import { Emulator, rgbToDataUrl, SaveState } from "../../../ts/index.ts";

import "./save-info.css";

type SaveInfoProps = {
    saveState: SaveState;
    emulator: Emulator;
    style?: string[];
};

export const SaveInfo: FC<SaveInfoProps> = ({
    saveState,
    emulator,
    style = []
}) => {
    const classes = () => ["save-info", ...style].join(" ");
    return (
        <div className={classes()}>
            <PanelTab
                tabs={[
                    SaveInfoMain({ saveState, emulator }),
                    SaveInfoThumbnail({ saveState, emulator })
                ]}
                tabNames={["Main", "Thumbnail"]}
                flex={true}
            />
        </div>
    );
};

type SaveInfoTabProps = {
    saveState: SaveState;
    emulator: Emulator;
};

export const SaveInfoMain: FC<SaveInfoTabProps> = ({ saveState }) => (
    <ul className="save-info-main">
        <li>
            <span>Model: </span>
            <span>{saveState.model}</span>
        </li>
        <li>
            <span>Agent: </span>
            <span>{saveState.agent}</span>
        </li>
        <li>
            <span>Size: </span>
            <span>{saveState.size} bytes</span>
        </li>
    </ul>
);

export const SaveInfoThumbnail: FC<SaveInfoTabProps> = ({
    saveState,
    emulator
}) => (
    <div className="save-info-thumbnail">
        {saveState.thumbnail && (
            <img
                className="pair-state-thumbnail"
                src={rgbToDataUrl(
                    saveState.thumbnail,
                    emulator.dimensions.width,
                    emulator.dimensions.height
                )}
            />
        )}
    </div>
);
