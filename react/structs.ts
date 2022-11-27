import { ReactNode } from "react";

export const FREQUENCY_DELTA = 100000;

export type Callback<T> = (owner: T, params?: unknown) => void;

export type RomInfo = {
    name?: string;
    data?: Uint8Array;
    size?: number;
    extra?: Record<string, string | undefined>;
};

export type BenchmarkResult = {
    delta: number;
    count: number;
    cycles: number;
    frequency_mhz: number;
};

export type Entry = {
    text: string;
    url?: string;
};

export type Size = {
    width: number;
    height: number;
    scale?: number;
};

export type HelpPanel = {
    name: string;
    node: ReactNode;
};

export type FrequencySpecs = {
    unit?: Frequency;
    delta?: number;
    places?: number;
};

/**
 * Enumeration to be used to describe the set of
 * features that a certain emulator supports, this
 * is going to condition its runtime execution.
 */
export enum Feature {
    Help = 1,
    Debug,
    Palettes,
    Benchmark,
    Keyboard,
    KeyboardChip8,
    KeyboardGB,
    RomTypeInfo
}

export enum Frequency {
    Hz = "Hz",
    Khz = "KHz",
    MHz = "MHz"
}

/**
 * Enumeration that describes the multiple pixel
 * formats and the associated size in bytes.
 */
export enum PixelFormat {
    RGB = 3,
    RGBA = 4
}

export const frequencyRatios = {
    Hz: 1,
    KHz: 1000,
    MHz: 1000 * 1000
};

export interface ObservableI {
    bind(event: string, callback: Callback<this>): void;
    unbind(event: string, callback: Callback<this>): void;
    trigger(event: string): void;
}

/**
 * Top level interface that declares the main abstract
 * interface of an emulator structured entity.
 * Should allow typical hardware operations to be performed.
 */
export interface Emulator extends ObservableI {
    /**
     * The descriptive name of the emulator.
     */
    get name(): string;

    /**
     * The information on the hardware that is being emulated
     * by the emulator (eg: Super Nintendo), can contain a URL
     * that describes the device that is being emulated by
     * the emulator (eg: Wikipedia link).
     */
    get device(): Entry;

    /**
     * A semantic version string for the current version
     * of the emulator, can include a URL pointing to a
     * changelog or equivalent document.
     *
     * @see {@link https://semver.org}
     */
    get version(): Entry | undefined;

    /**
     * Information about the source code repository where
     * the emulator source code is being stored.
     */
    get repository(): Entry | undefined;

    /**
     * The features available and compatible with the emulator,
     * these values will influence the associated GUIs.
     */
    get features(): Feature[];

    /**
     * The multiple panels that are going to be presented to
     * support the end-user as part of the help process.
     */
    get help(): HelpPanel[];

    /**
     * The complete set of engine names that can be used
     * in the re-boot operation.
     */
    get engines(): string[];

    /**
     * The name of the current execution engine being used
     * by the emulator.
     */
    get engine(): string | null;

    /**
     * The complete set of file extensions that this emulator
     * supports.
     */
    get romExts(): string[];

    /**
     * The dimensions of the screen for the device that is
     * currently in emulation.
     */
    get dimensions(): Size;

    /**
     * The pixel format of the emulator's display
     * image buffer (eg: RGB).
     */
    get pixelFormat(): PixelFormat;

    /**
     * Gets the complete image buffer as a sequence of
     * bytes that respects the current pixel format from
     * `getPixelFormat()`. This method returns an in memory
     * pointer to the heap and not a copy.
     */
    get imageBuffer(): Uint8Array;

    /**
     * Gets information about the ROM that is currently
     * loaded in the emulator, using a structure containing
     * the information about the ROM that is currently
     * loaded in the emulator.
     */
    get romInfo(): RomInfo;

    /**
     * The current CPU frequency (logic) of the emulator,
     * should impact other elements of the emulator.
     */
    get frequency(): number;
    set frequency(value: number);

    /**
     * The specification to be used for frequency representation
     * and adjustments, includes unit and other stuff.
     */
    get frequencySpecs(): FrequencySpecs;

    /**
     * The current logic framerate of the running emulator.
     */
    get framerate(): number;

    /**
     * A dictionary that contains the register names associated
     * with their value either as strings or numbers.
     */
    get registers(): Record<string, string | number>;

    /**
     * The palette as a string name that is currently
     * set in the emulator for display.
     */
    get palette(): string | undefined;
    set palette(value: string | undefined);

    /**
     * Boot (or reboots) the emulator according to the provided
     * set of options.
     *
     * @param options The options that are going to be used for
     * the booting operation of the emulator.
     */
    boot(options: unknown): void;

    /**
     * Toggle the running state of the emulator between paused
     * and running, prevents consumers from the need to access
     * the current running state of the emulator to implement
     * a logic toggle.
     */
    toggleRunning(): void;
    pause(): void;
    resume(): void;

    /**
     * Resets the emulator machine to the start state and
     * re-loads the ROM that is currently set in the emulator.
     */
    reset(): void;

    keyPress(key: string): void;

    keyLift(key: string): void;

    /**
     * Obtains the pixel buffer for the VRAM tile at the given
     * index.
     *
     * @param index The index of the tile to obtain pixel buffer.
     * @returns The pixel buffer of the tile at the given index.
     */
    getTile?: { (index: number): Uint8Array };

    /**
     * Changes the palette of the emulator to the "next" one,
     * the order in which the palette is chosen is defined by
     * the concrete emulator implementation.
     *
     * @returns The name of the palette that has been selected.
     */
    changePalette?: { (): string };

    /**
     * Runs a benchmark operation in the emulator, effectively
     * measuring the performance of it.
     *
     * @param count The number of benchmark iterations to be
     * run, increasing this value will make the benchmark take
     * more time to be executed.
     * @returns The result metrics from the benchmark run.
     */
    benchmark?: { (count?: number): BenchmarkResult };
}

/**
 * Abstract class that implements the basic functionality
 * part of the definition of the Observer pattern.
 *
 * @see {@link https://en.wikipedia.org/wiki/Observer_pattern}
 */
export class Observable {
    private events: Record<string, [Callback<this>]> = {};

    bind(event: string, callback: Callback<this>) {
        const callbacks = this.events[event] ?? [];
        if (callbacks.includes(callback)) return;
        callbacks.push(callback);
        this.events[event] = callbacks;
    }

    unbind(event: string, callback: Callback<this>) {
        const callbacks = this.events[event] ?? [];
        if (!callbacks.includes(callback)) return;
        const index = callbacks.indexOf(callback);
        callbacks.splice(index, 1);
        this.events[event] = callbacks;
    }

    trigger(event: string, params?: unknown) {
        const callbacks = this.events[event] ?? [];
        callbacks.forEach((c) => c(this, params));
    }
}

export class EmulatorBase extends Observable {
    get version(): Entry | undefined {
        return undefined;
    }

    get repository(): Entry | undefined {
        return undefined;
    }

    get features(): Feature[] {
        return [];
    }

    get help(): HelpPanel[] {
        return [];
    }

    get frequencySpecs(): FrequencySpecs {
        return {
            unit: Frequency.MHz,
            delta: FREQUENCY_DELTA,
            places: 2
        };
    }

    get palette(): string | undefined {
        return undefined;
    }

    set palette(value: string | undefined) {}
}
