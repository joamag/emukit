import React, { FC } from "react";
import Pair, { PairStyle } from "../pair/pair";
import Link from "../link/link";
import { rgbToDataUrl } from "../../util";

import "./pair-state.css";

type PairStateProps = {
    index: number;
    thumbnail?: Uint8Array;
    thumbnailSize?: [number, number];
    style?: PairStyle[];
    onLoadClick?: () => void;
    onDeleteClick?: () => void;
};

export const PairState: FC<PairStateProps> = ({
    index,
    thumbnail,
    thumbnailSize,
    style = [],
    onLoadClick,
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
                        <div className="pair-state-datetime">
                            12/06/2013 13:23
                        </div>
                        <div className="pair-state-buttons">
                            <Link text={"Load"} onClick={onLoadClick} />
                            <Link text={"Delete"} onClick={onDeleteClick} />
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
