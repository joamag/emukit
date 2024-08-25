import { atom } from "recoil";

export const infoVisibleState = atom<boolean>({
    key: "infoVisible",
    default: true
});
