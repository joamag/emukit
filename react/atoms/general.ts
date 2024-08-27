import { atom } from "recoil";

export const pausedState = atom<boolean>({
    key: "paused",
    default: false
});

export const mutedState = atom<boolean>({
    key: "muted",
    default: false
});

export const fastState = atom<boolean>({
    key: "fast",
    default: false
});

export const fullscreenState = atom<boolean>({
    key: "fullscreen",
    default: false
});
