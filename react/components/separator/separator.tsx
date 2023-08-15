import React, { FC } from "react";

import "./separator.css";

type SectionProps = {
    marginTop?: string | number;
    marginBottom?: string | number;
    thickness?: string | number;
    color?: string;
    clear?: boolean;
    style?: string[];
};

export const Separator: FC<SectionProps> = ({
    marginTop = 20,
    marginBottom = 20,
    thickness = 1,
    color = "#ffffff",
    clear = true,
    style = []
}) => {
    const classes = () => ["separator", ...style].join(" ");
    return (
        <>
            {clear && <div className="separator-clear"></div>}
            <div
                className={classes()}
                style={{
                    marginTop: marginTop,
                    marginBottom: marginBottom,
                    height: thickness,
                    backgroundColor: color
                }}
            ></div>
        </>
    );
};

export default Separator;
