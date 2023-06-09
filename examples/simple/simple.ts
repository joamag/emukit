import {
    BenchmarkResult,
    Emulator,
    EmulatorBase,
    Entry,
    RomInfo,
    Size
} from "../../react";

export class SimpleEmulator extends EmulatorBase implements Emulator {
    get name(): string {
        return "Simple Emulator";
    }
    get device(): Entry {
        return { text: "SMAC-H1" };
    }
    get engines(): string[] {
        throw new Error("Method not implemented.");
    }
    get engine(): string | null {
        throw new Error("Method not implemented.");
    }
    get romExts(): string[] {
        throw new Error("Method not implemented.");
    }
    get dimensions(): Size {
        return {
            width: 256,
            height: 256
        };
    }
    get imageBuffer(): Uint8Array {
        throw new Error("Method not implemented.");
    }
    get romInfo(): RomInfo {
        throw new Error("Method not implemented.");
    }
    get frequency(): number {
        throw new Error("Method not implemented.");
    }
    set frequency(value: number) {
        throw new Error("Method not implemented.");
    }
    get framerate(): number {
        throw new Error("Method not implemented.");
    }
    get registers(): Record<string, string | number> {
        throw new Error("Method not implemented.");
    }
    get audioOutput(): Record<string, number> {
        throw new Error("Method not implemented.");
    }
    boot(options: unknown): void {
        throw new Error("Method not implemented.");
    }
    toggleRunning(): void {
        throw new Error("Method not implemented.");
    }
    pause(): void {
        throw new Error("Method not implemented.");
    }
    resume(): void {
        throw new Error("Method not implemented.");
    }
    reset(): void {
        throw new Error("Method not implemented.");
    }
    keyPress(key: string): void {
        throw new Error("Method not implemented.");
    }
    keyLift(key: string): void {
        throw new Error("Method not implemented.");
    }
    getTile?: ((index: number) => Uint8Array) | undefined;
    changePalette?: (() => string) | undefined;
    benchmark?: ((count?: number | undefined) => BenchmarkResult) | undefined;
    onBackground?: ((background: string) => void) | undefined;
}
