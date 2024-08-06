import React, { FC } from "react";

import Pair from "../pair/pair.tsx";
import Info from "../info/info.tsx";
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
    <div className="save-info-main">
        <Info>
            <Pair key="model" name="Model" value={saveState.model} />
            <Pair key="format" name="Format" value={saveState.format} />
            <Pair key="agent" name="Agent" value={saveState.agent} />
            <Pair
                key="size"
                name="Size"
                value={
                    saveState.size
                        ? `${new Intl.NumberFormat().format(
                              saveState.size
                          )} bytes`
                        : "-"
                }
            />
            <Pair
                key="date"
                name="Date"
                value={
                    saveState.timestamp
                        ? new Date(saveState.timestamp * 1000).toLocaleString(
                              undefined,
                              {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                              }
                          )
                        : "-"
                }
            />
        </Info>
    </div>
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

export default SaveInfo;
