import React, { FC, useCallback, useMemo } from "react";
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
    onLoadClick?: (saveState?: SaveState) => void;
    onDownloadClick?: (saveState?: SaveState) => void;
    onInfoClick?: (saveState?: SaveState) => void;
    onDeleteClick?: (saveState?: SaveState) => void;
};

export const PairState: FC<PairStateProps> = ({
    index,
    thumbnail,
    thumbnailSize = [100, 100],
    saveState,
    style = [],
    onLoadClick,
    onDownloadClick,
    onInfoClick,
    onDeleteClick
}) => {
    const pairStyle = useMemo(() => ["pair-state", ...style], [style]);
    const thumbnailUrl = useMemo(
        () =>
            thumbnail &&
            rgbToDataUrl(
                thumbnail,
                thumbnailSize?.[0] ?? 0,
                thumbnailSize?.[1] ?? 0
            ),
        [thumbnail, thumbnailSize]
    );
    const _onLoadClick = useCallback(
        () => onLoadClick?.(saveState),
        [onLoadClick, saveState]
    );
    const _onDownloadClick = useCallback(
        () => onDownloadClick?.(saveState),
        [onDownloadClick, saveState]
    );
    const _onInfoClick = useCallback(
        () => onInfoClick?.(saveState),
        [onInfoClick, saveState]
    );
    const _onDeleteClick = useCallback(
        () => onDeleteClick?.(saveState),
        [onDeleteClick, saveState]
    );
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
                                    <Link
                                        text={"Load"}
                                        onClick={_onLoadClick}
                                    />
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
                                            onClick={_onDownloadClick}
                                        />
                                    </>
                                )}
                            {onInfoClick && (
                                <>
                                    <span className="link-separator">/</span>
                                    <Link
                                        text={"Info"}
                                        onClick={_onInfoClick}
                                    />
                                </>
                            )}
                            {onDeleteClick && (
                                <>
                                    <span className="link-separator">/</span>
                                    <Link
                                        text={"Delete"}
                                        onClick={_onDeleteClick}
                                    />
                                </>
                            )}
                        </div>
                    </>
                }
                valueNode={
                    thumbnailUrl ? (
                        <img
                            className="pair-state-thumbnail"
                            src={thumbnailUrl}
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
