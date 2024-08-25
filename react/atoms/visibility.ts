import { atom } from "recoil";

export const infoVisibleState = atom<boolean>({
    key: "infoVisible",
    default: true
});

export const keyboardVisibleState = atom<boolean>({
    key: "keyboardVisible",
    default: false
});
