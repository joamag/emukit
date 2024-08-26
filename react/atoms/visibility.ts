import { atom } from "recoil";

export const keyboardVisibleState = atom<boolean>({
    key: "keyboardVisible",
    default: false
});

export const infoVisibleState = atom<boolean>({
    key: "infoVisible",
    default: true
});

export const debugVisibleState = atom<boolean>({
    key: "debugVisible",
    default: false
});

export const visibleSectionsState = atom<string[]>({
    key: "visibleSections",
    default: []
});
