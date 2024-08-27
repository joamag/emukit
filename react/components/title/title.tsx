import React, { FC, useMemo } from "react";
import { Link } from "../link/link.tsx";

import "./title.css";

type TitleProps = {
    text: string;
    version?: string;
    versionUrl?: string;
    iconSrc?: string;
    style?: string[];
};

export const Title: FC<TitleProps> = ({
    text,
    version,
    versionUrl,
    iconSrc,
    style = []
}) => {
    const classes = useMemo(() => ["title", ...style].join(" "), [style]);
    return (
        <h1 className={classes}>
            {text}
            {version &&
                (versionUrl ? (
                    <Link href={versionUrl} target="_blank">
                        {version}
                    </Link>
                ) : (
                    <span className="label">{version}</span>
                ))}
            {iconSrc && <img className="icon" src={iconSrc} alt="icon" />}
        </h1>
    );
};

export default Title;
