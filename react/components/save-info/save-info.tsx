import React, { FC, useMemo } from "react";

import { Emulator, rgbToDataUrl, SaveState } from "../../../ts/index.ts";
import Info from "../info/info.tsx";
import Pair from "../pair/pair.tsx";
import PanelTab from "../panel-tab/panel-tab.tsx";

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
    const classes = useMemo(() => ["save-info", ...style].join(" "), [style]);
    const tabs = [SaveInfoMain({ saveState, emulator })];
    const tabNames = ["Main"];
    if (saveState.thumbnail !== undefined) {
        tabs.push(SaveInfoThumbnail({ saveState, emulator }));
        tabNames.push("Thumbnail");
    }
    return (
        <div className={classes}>
            <PanelTab tabs={tabs} tabNames={tabNames} flex={true} />
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
            {saveState.model && (
                <Pair key="model" name="Model" value={saveState.model} />
            )}
            {saveState.title && (
                <Pair key="model" name="Title" value={saveState.title} />
            )}
            {saveState.format && (
                <Pair key="format" name="Format" value={saveState.format} />
            )}
            {saveState.agent && (
                <Pair key="agent" name="Agent" value={saveState.agent} />
            )}
            {saveState.size && (
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
            )}
            {saveState.timestamp && (
                <Pair
                    key="date"
                    name="Date"
                    value={new Date(saveState.timestamp * 1000).toLocaleString(
                        undefined,
                        {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )}
                />
            )}
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
