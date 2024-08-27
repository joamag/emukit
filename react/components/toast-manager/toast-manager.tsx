import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useRef,
    useState
} from "react";

import Toast from "../toast/toast.tsx";

type ToastManagerProps = {
    style?: string[];
};

export type ToastManagerHandle = {
    showToast: (
        text: string,
        error?: boolean,
        timeout?: number
    ) => Promise<void>;
};

export const ToastManager = forwardRef<ToastManagerHandle, ToastManagerProps>(
    ({ style = [] }, ref) => {
        const [toastText, setToastText] = useState<string>();
        const [toastError, setToastError] = useState(false);
        const [toastVisible, setToastVisible] = useState(false);

        const toastCounterRef = useRef(0);

        useImperativeHandle(ref, () => ({
            showToast: async (text: string, error = false, timeout = 3500) => {
                setToastText(text);
                setToastError(error);
                setToastVisible(true);
                toastCounterRef.current++;
                const counter = toastCounterRef.current;
                await new Promise((resolve) => {
                    setTimeout(() => {
                        if (counter !== toastCounterRef.current) return;
                        setToastVisible(false);
                        resolve(true);
                    }, timeout);
                });
            }
        }));

        const onToastCancel = useCallback(() => {
            setToastVisible(false);
        }, []);

        return (
            <Toast
                text={toastText}
                error={toastError}
                visible={toastVisible}
                style={style}
                onCancel={onToastCancel}
            />
        );
    }
);

export default ToastManager;
