import React, { FC, ReactNode } from "react";
import Link from "../link/link";

import "./pair.css";

export type PairStyle = "name-click" | "value-click";

type PairProps = {
    name?: string;
    value?: string;
    nameNode?: ReactNode;
    valueNode?: ReactNode;
    nameHref?: string;
    valueHref?: string;
    nameTarget?: string;
    valueTarget?: string;
    style?: PairStyle[];
    onNameClick?: () => void;
    onValueClick?: () => void;
};

export const Pair: FC<PairProps> = ({
    name,
    value,
    nameNode,
    valueNode,
    nameHref,
    valueHref,
    nameTarget,
    valueTarget,
    style = [],
    onNameClick,
    onValueClick
}) => {
    const classes = () =>
        [
            "pair",
            onNameClick ? "name-click" : "",
            onValueClick ? "value-click" : "",
            ...style
        ].join(" ");
    const _onNameClick = () => (onNameClick ? onNameClick() : undefined);
    const _onValueClick = () => (onValueClick ? onValueClick() : undefined);
    return (
        <>
            <dt className={classes()} onClick={_onNameClick}>
                {nameNode ??
                    (nameHref && (
                        <Link href={nameHref} target={nameTarget ?? "_blank"}>
                            {name}
                        </Link>
                    )) ??
                    name ??
                    ""}
            </dt>
            <dd className={classes()} onClick={_onValueClick}>
                {valueNode ??
                    (valueHref && (
                        <Link href={valueHref} target={valueTarget ?? "_blank"}>
                            {value}
                        </Link>
                    )) ??
                    value ??
                    ""}
            </dd>
        </>
    );
};

export default Pair;
