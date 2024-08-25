import { atom } from "recoil";

export const keyboardVisibleState = atom<boolean>({
    key: "keyboardVisible",
    default: false
});
