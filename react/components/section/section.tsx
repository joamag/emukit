import React, { FC, ReactNode, useMemo } from "react";

import "./section.css";

type SectionProps = {
    children: ReactNode;
    visible?: boolean;
    separator?: boolean;
    separatorBottom?: boolean;
    style?: string[];
};

export const Section: FC<SectionProps> = ({
    children,
    visible = true,
    separator = true,
    separatorBottom = false,
    style = []
}) => {
    const classes = useMemo(
        () => ["section", visible ? "visible" : "", ...style].join(" "),
        [visible, style]
    );
    return (
        <div className={classes}>
            {separator && <div className="separator"></div>}
            <div className="section-contents">{children}</div>
            {separatorBottom && <div className="separator"></div>}
        </div>
    );
};

export default Section;
