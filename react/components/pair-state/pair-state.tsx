import React, { FC } from "react";
import Pair, { PairStyle } from "../pair/pair.tsx";
import Link from "../link/link.tsx";
import { rgbToDataUrl, SaveState } from "../../../ts/index.ts";

import "./pair-state.css";

type PairStateProps = {
    index: number;
    thumbnail?: Uint8Array;
    thumbnailSize?: [number, number];
    saveState?: SaveState;
    style?: PairStyle[];
    onLoadClick?: () => void;
    onDownloadClick?: () => void;
    onDeleteClick?: () => void;
};

export const PairState: FC<PairStateProps> = ({
    index,
    thumbnail,
    thumbnailSize,
    saveState,
    style = [],
    onLoadClick,
    onDownloadClick,
    onDeleteClick
}) => {
    const pairStyle = ["pair-state", ...style];
    return (
        <>
            <Pair
                key={`#${index}`}
                name={`Save State #${index}`}
                nameNode={
                    <>
                        <div>Save State #{index}</div>
                        <div className="pair-state-description">
                            {saveState && saveState.timestamp !== undefined
                                ? new Date(
                                      saveState.timestamp * 1000
                                  ).toLocaleString(undefined, {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                  })
                                : ""}
                            {saveState && saveState.error !== undefined
                                ? "Error - " + saveState.error
                                : ""}
                        </div>
                        <div className="pair-state-buttons">
                            {onLoadClick && saveState?.error === undefined && (
                                <>
                                    <span className="link-separator">/</span>
                                    <Link text={"Load"} onClick={onLoadClick} />
                                </>
                            )}
                            {onDownloadClick &&
                                saveState?.error === undefined && (
                                    <>
                                        <span className="link-separator">
                                            /
                                        </span>
                                        <Link
                                            text={"Download"}
                                            onClick={onDownloadClick}
                                        />
                                    </>
                                )}
                            {onDeleteClick && (
                                <>
                                    <span className="link-separator">/</span>
                                    <Link
                                        text={"Delete"}
                                        onClick={onDeleteClick}
                                    />
                                </>
                            )}
                        </div>
                    </>
                }
                valueNode={
                    thumbnail ? (
                        <img
                            className="pair-state-thumbnail"
                            src={rgbToDataUrl(
                                thumbnail,
                                thumbnailSize?.[0] ?? 0,
                                thumbnailSize?.[1] ?? 0
                            )}
                        />
                    ) : (
                        <></>
                    )
                }
                style={pairStyle as PairStyle[]}
                onValueClick={onLoadClick}
            />
        </>
    );
};

export default PairState;
