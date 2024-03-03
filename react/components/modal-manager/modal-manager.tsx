import React, {
    forwardRef,
    ReactNode,
    useImperativeHandle,
    useRef,
    useState
} from "react";
import Modal from "../modal/modal.tsx";

type ModalManagerProps = {
    style?: string[];
};

export type ModalManagerHandle = {
    showModal: (
        title?: string,
        text?: string,
        contents?: ReactNode
    ) => Promise<boolean>;
};

export const ModalManager = forwardRef<ModalManagerHandle, ModalManagerProps>(
    ({ style = [] }, ref) => {
        const [modalTitle, setModalTitle] = useState<string>();
        const [modalText, setModalText] = useState<string>();
        const [modalContents, setModalContents] = useState<ReactNode>();
        const [modalVisible, setModalVisible] = useState(false);

        const modalCallbackRef =
            useRef<(value: boolean | PromiseLike<boolean>) => void>();

        useImperativeHandle(ref, () => ({
            showModal: async (
                title = "Alert",
                text?: string,
                contents?: ReactNode
            ): Promise<boolean> => {
                setModalTitle(title);
                setModalText(text);
                setModalContents(contents);
                setModalVisible(true);
                const result = (await new Promise((resolve) => {
                    modalCallbackRef.current = resolve;
                })) as boolean;
                return result;
            }
        }));

        const onModalConfirm = () => {
            if (modalCallbackRef.current) {
                modalCallbackRef.current(true);
                modalCallbackRef.current = undefined;
            }
            setModalVisible(false);
        };
        const onModalCancel = () => {
            if (modalCallbackRef.current) {
                modalCallbackRef.current(false);
                modalCallbackRef.current = undefined;
            }
            setModalVisible(false);
        };

        return (
            <Modal
                title={modalTitle}
                text={modalText}
                contents={modalContents}
                visible={modalVisible}
                style={style}
                onConfirm={onModalConfirm}
                onCancel={onModalCancel}
            />
        );
    }
);

export default ModalManager;
