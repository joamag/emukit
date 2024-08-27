import React, {
    FC,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef
} from "react";
import Button from "../button/button.tsx";

import "./modal.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

type ModalProps = {
    title?: string;
    text?: string;
    contents?: ReactNode;
    visible?: boolean;
    buttons?: boolean;
    overlayClose?: boolean;
    style?: string[];
    onConfirm?: () => void;
    onCancel?: () => void;
};

export const Modal: FC<ModalProps> = ({
    title = "Alert",
    text,
    contents,
    visible = false,
    buttons,
    overlayClose = true,
    style = [],
    onConfirm,
    onCancel
}) => {
    const classes = useMemo(
        () => ["modal", visible ? "visible" : "", ...style].join(" "),
        [visible, style]
    );
    text =
        text ??
        (contents ? undefined : "Do you confirm the following operation?");
    buttons = buttons ?? (contents ? false : true);
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel?.();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [onCancel]);
    useEffect(() => {
        if (visible) {
            modalRef.current?.focus();
        }
    }, [visible]);
    const getTextHtml = (separator = /\n/g) =>
        text
            ? {
                  __html: text.replace(separator, "<br/>")
              }
            : undefined;
    const onWindowClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            if (!overlayClose) return;
            event.stopPropagation();
        },
        [overlayClose]
    );
    return (
        <div className={classes} onClick={onCancel}>
            <div
                ref={modalRef}
                className="modal-window"
                onClick={onWindowClick}
                tabIndex={-1}
            >
                <div className="modal-top-buttons">
                    <Button
                        text={""}
                        size={"medium"}
                        style={["simple", "rounded", "no-text"]}
                        image={require("./close.svg")}
                        imageAlt="close"
                        onClick={onCancel}
                    />
                </div>
                <h2 className="modal-title">{title}</h2>
                {contents ? (
                    <div className="modal-contents">{contents}</div>
                ) : (
                    <p
                        className="modal-text"
                        dangerouslySetInnerHTML={getTextHtml()}
                    ></p>
                )}
                {buttons && (
                    <div className="modal-buttons">
                        <Button
                            text={"Cancel"}
                            size={"medium"}
                            style={["simple", "red", "border", "padded-large"]}
                            onClick={onCancel}
                        />
                        <Button
                            text={"Confirm"}
                            size={"medium"}
                            style={["simple", "border", "padded-large"]}
                            onClick={onConfirm}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
