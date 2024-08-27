import React, { FC, ReactNode, useMemo } from "react";

import "./footer.css";

type FooterProps = {
    children: ReactNode;
    color?: string;
    style?: string[];
};

export const Footer: FC<FooterProps> = ({
    children,
    color = "ffffff",
    style = []
}) => {
    const classes = useMemo(() => ["footer", ...style].join(" "), [style]);
    return (
        <div className={classes}>
            <div
                className="footer-background"
                style={{ backgroundColor: `#${color}f2` }}
            ></div>
            <div className="footer-contents">{children}</div>
        </div>
    );
};

export default Footer;
