import { ReactNode } from "react";

import { Logger, logger } from "./logging.ts";
import { base64ToBuffer, bufferToBase64 } from "./util.ts";

export const FREQUENCY_DELTA = 100000;

export const DISPLAY_FREQUENCY_DELTA = 1;

/**
 * The frequency at which the emulator emulator should
 * run "normally". This is a simple placeholder and the
 * concrete value should be always overridden.
 */
const LOGIC_HZ = 1000;

/**
 * The frequency at which the the visual loop is going to
 * run, increasing this value will have a consequence in
 * the visual frames per second (FPS) of emulation.
 */
const VISUAL_HZ = 60;

/**
 * The frequency of the pause polling update operation,
 * increasing this value will make resume from emulation
 * paused state fasted.
 */
const IDLE_HZ = 10;

/**
 * The sample rate that is going to be used for FPS calculus,
 * meaning that every N seconds we will calculate the number
 * of frames rendered divided by the N seconds.
 */
const FPS_SAMPLE_RATE = 3;

/**
 * The maximum number of emulation ticks that can be executed
 * for a single animation frame, this value allows an animation
 * frame loop of 30 FPS to run an emulator that requires 90 Hz
 * of visual execution.
 */
const MAX_TICKS_ANIMATION_FRAME = 3;

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

export type SectionInfo = {
    name: string;
    icon?: string;
    node: ReactNode;
};

export type HelpPanel = {
    name: string;
    node: ReactNode;
};

export type DebugPanel = {
    name: string;
    node: ReactNode;
};

export type AudioSpecs = {
    samplingRate: number;
    channels: number;
};

export type FrequencySpecs = {
    unit?: Frequency;
    delta?: number;
    places?: number;
    displayUnit?: Frequency;
    displayDelta?: number;
    displayPlaces?: number;
};

export type Compiler = {
    name?: string;
    version?: string;
};

export type Compilation = {
    date?: string;
    time?: string;
};

export type AudioState = {
    audioContext: AudioContext | null;
    audioChunks: AudioChunk[];
    nextPlayTime: number;
};

export type AudioChunk = {
    source: AudioBufferSourceNode;
    playTime: number;
    duration: number;
};

/**
 * Represents the state of the emulator at a certain
 * point in time, this state should be able to be
 * loaded later.
 */
export type SaveState = {
    index: number;
    timestamp?: number;
    agent?: string;
    model?: string;
    format?: string;
    size?: number;
    thumbnail?: Uint8Array;
    error?: Error;
};

/**
 * Represents the information about the current tick
 * operation, this information may be used for debugging
 * purposes.
 */
export type TickInfo = {
    cycles?: number;
};

/**
 * Enumeration to be used to describe the set of
 * features that a certain emulator supports, this
 * is going to condition its runtime execution.
 */
export enum Feature {
    Help = 1,
    Debug,
    Themes,
    Palettes,
    Benchmark,
    LoopMode,
    Keyboard,
    KeyboardChip8,
    KeyboardGB,
    DisplayFrequency,
    Framerate,
    Cyclerate,
    Animationrate,
    EmulationSpeed,
    BootRomInfo,
    RomTypeInfo,
    SaveState
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

/**
 * Enumeration that describes the multiple loop modes
 * that are available for the emulator game loop.
 */
export enum LoopMode {
    Auto = 1,
    SetTimeout = 2,
    AnimationFrame = 3
}

export const frequencyRatios = {
    Hz: 1,
    KHz: 1000,
    MHz: 1000 * 1000
};

export type Handlers = {
    showModal?: (
        title?: string,
        text?: string,
        contents?: ReactNode
    ) => Promise<boolean>;
    showHelp?: (title?: string) => Promise<void>;
    showToast?: (
        text: string,
        error?: boolean,
        timeout?: number
    ) => Promise<void | undefined>;
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
     * A string reference to a resource that can be used as
     * a safe path to the display of the emulator icon.
     */
    get icon(): string | undefined;

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
     * The multiple optional sections that may be provided
     * by the emulator for domain bound purposes, each of
     * this sections will have an associated button
     */
    get sections(): SectionInfo[];

    /**
     * The multiple panels that are going to be presented to
     * support the end-user as part of the help process.
     */
    get help(): HelpPanel[];

    /**
     * The multiple panels that are going to be presented to
     * support the developer in the debug process.
     */
    get debug(): DebugPanel[];

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
     * Obtains the specification of the audion stream that is
     * provided by the emulator (if any).
     */
    get audioSpecs(): AudioSpecs | null;

    /**
     * An array (for each channel) that contains the multiple
     * float values representing the volume of the channel over
     * a time series. This value should respect the sampling
     * rate defined in the `audioSpecs()`.
     */
    get audioBuffer(): Float32Array[];

    /**
     * Gets information about the ROM that is currently
     * loaded in the emulator, using a structure containing
     * the information about the ROM that is currently
     * loaded in the emulator.
     */
    get romInfo(): RomInfo;

    /**
     * The current CPU frequency (logic) of the emulator,
     * should impact many other elements of the emulator.
     */
    get frequency(): number;
    set frequency(value: number);

    /**
     * The current Display frequency (visual) of the emulator,
     * should impact visual elements of the emulator.
     */
    get displayFrequency(): number;
    set displayFrequency(value: number);

    /**
     * The specification to be used for frequency representation
     * and adjustments, includes unit and other stuff.
     */
    get frequencySpecs(): FrequencySpecs;

    /**
     * The specifications of the compiler used to build the emulator
     * should include both name and version of the compiler.
     */
    get compiler(): Compiler | null;

    /**
     * Compilation specs for the library that contains the emulator
     * including the timestamp of the compilation.
     */
    get compilation(): Compilation | null;

    /**
     * Engine that has been used in the generation of the WebAssembly
     * code of the emulator, assumes WASM based emulator.
     */
    get wasmEngine(): string | null;

    /**
     * The current logic framerate of the running emulator.
     */
    get framerate(): number;

    /**
     * The current logic framerate of the running emulator.
     */
    get cyclerate(): number;

    /**
     * The current animation framerate of the running emulator.
     */
    get animationrate(): number;

    /**
     * The current emulation speed, as in `cyclerate` / `logicFrequency`.
     */
    get emulationSpeed(): number;

    /**
     * Obtains the current loop mode being used for the execution
     * of the emulator's game loop.
     */
    get loopMode(): LoopMode;
    set loopMode(value: LoopMode);

    /**
     * A dictionary that contains the register names associated
     * with their value either as strings or numbers.
     */
    get registers(): Record<string, string | number>;

    /**
     * A dictionary that associates the multiple audio channels
     * with their current volume as a number.
     */
    get audioOutput(): Record<string, number>;

    /**
     * The palette as a string name that is currently
     * set in the emulator for display.
     */
    get palette(): string | undefined;
    set palette(value: string | undefined);

    get compilerString(): string | null;

    get compilationString(): string | null;

    /**
     * Structure containing the top level UI handler functions.
     * These functions may be used to control global wide UI
     * elements such as the emulator's title, toasts, modals, etc.
     */
    get handlers(): Handlers;
    set handlers(value: Handlers);

    /**
     * The logger instance that is going to be used for the
     * logging of the emulator, this is a reference to the
     * main logger of the application.
     */
    get logger(): Logger;

    /**
     * Boot (or reboots) the emulator according to the provided
     * set of options.
     *
     * @param options The options that are going to be used for
     * the booting operation of the emulator.
     */
    boot(options: unknown): Promise<void>;

    /**
     * Toggle the running state of the emulator between paused
     * and running, prevents consumers from the need to access
     * the current running state of the emulator to implement
     * a logic toggle.
     */
    toggleRunning(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;

    /**
     * Resets the emulator machine to the start state and
     * re-loads the ROM that is currently set in the emulator.
     */
    reset(): Promise<void>;

    keyPress(key: string): void;

    keyLift(key: string): void;

    /**
     * Processes the provided file instance as a ROM file and
     * returns the raw data of the ROM file, ready to be fed to
     * the emulator.
     *
     * This method can be used to process the file, handling
     * features like compression (eg: zip files).
     *
     * @param file The file instance to be processed as a ROM.
     * @returns The raw data of the ROM file.
     */
    buildRomData(file: File): Promise<Uint8Array>;

    /**
     * Serializes the current state of the emulator into a
     * data buffer that can be used to store the state in
     * a persistent storage.
     *
     * @returns The serialized state of the emulator.
     */
    serializeState?(): Promise<Uint8Array>;

    /**
     * Deserializes the sate data buffer, loading the contents
     * of it into the current emulator instance.
     *
     * @param data The saved state data buffer, that is going
     * to be loaded into the emulator instance.
     */
    unserializeState?(data: Uint8Array): Promise<void>;

    /**
     * Builds the state of the emulator from the given data
     * and index, this method should be able to build the
     * state from the given data.
     *
     * @param index The saved state index to be built.
     * @param data The saved state data buffer, that is going
     * to be used in the building of the state.
     */
    buildState?(index: number, data: Uint8Array): Promise<SaveState>;

    /**
     * Saves the current state of the emulator in the given
     * index, this state should be able to be loaded later.
     *
     * This method is typically not implemented by the concrete
     * emulator class.
     *
     * @param index The index of the state to be saved.
     */
    saveState?(index: number): Promise<void>;

    /**
     * Loads the state of the emulator from the given index,
     * Should throw an error in case it's not possible to
     * load the state from the given index.
     *
     * This method is typically not implemented by the concrete
     * emulator class.
     *
     * @param index The index of the state to be loaded.
     */
    loadState?(index: number): Promise<void>;

    /**
     * Deletes the state of the emulator for the given index.
     * This operation should release any associated resources.
     *
     * This method is typically not implemented by the concrete
     * emulator class.
     *
     * @param index The index of the state to be delete.
     */
    deleteState?(index: number): Promise<void>;

    /**
     * Obtains the state of the emulator at the given index.
     * This state information should be handled carefully as
     * it may contain a large payload (eg: image buffer).
     *
     * This method is typically not implemented by the concrete
     * emulator class.
     *
     * @param index Index of the state to be obtained.
     * @returns State of the emulator at the given index.
     * @see {@link SaveState}
     */
    getState?(index: number): Promise<SaveState>;

    /**
     * Obtains the raw data of the state at the given index.
     *
     * @param index Index of the state to be obtained.
     * @returns Raw data of the state at the given index.
     */
    getStateData?(index: number): Promise<Uint8Array>;

    /**
     * List the complete set of states available in the
     * emulator, this list should be ordered by the lowest
     * index to the highest one.
     *
     * This method is typically not implemented by the concrete
     * emulator class.
     *
     * @returns The list of states available in the emulator.
     */
    listStates?(): Promise<number[]>;

    pauseVideo?(): void;

    resumeVideo?(): void;

    getVideoState?(): boolean;

    pauseAudio?(): void;

    resumeAudio?(): void;

    getAudioState?(): boolean;

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

    /**
     * Callback method to be called whenever a background/theme
     * is changed by the hosting environment.
     *
     * @param theme The name of the new background to which the
     * current environment has been changed into.
     */
    onBackground?: { (background: string): void };
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
    private _handlers: Handlers = {};

    static now(): number {
        if (performance && performance.now) {
            return performance.now();
        }
        return Date.now();
    }

    get icon(): string | undefined {
        return undefined;
    }

    get version(): Entry | undefined {
        return undefined;
    }

    get repository(): Entry | undefined {
        return undefined;
    }

    get features(): Feature[] {
        return [];
    }

    get sections(): SectionInfo[] {
        return [];
    }

    get help(): HelpPanel[] {
        return [];
    }

    get debug(): DebugPanel[] {
        return [];
    }

    get displayFrequency(): number {
        return 0;
    }

    set displayFrequency(value: number) {}

    get frequencySpecs(): FrequencySpecs {
        return {
            unit: Frequency.MHz,
            delta: FREQUENCY_DELTA,
            places: 2
        };
    }

    get audioSpecs(): AudioSpecs | null {
        return null;
    }

    get audioBuffer(): Float32Array[] {
        return [];
    }

    get romInfo(): RomInfo {
        return {};
    }

    get compiler(): Compiler | null {
        return null;
    }

    get compilation(): Compilation | null {
        return null;
    }

    get wasmEngine(): string | null {
        return null;
    }

    get framerate(): number {
        return 0;
    }

    get cyclerate(): number {
        return 0;
    }

    get animationrate(): number {
        return 0;
    }

    get emulationSpeed(): number {
        return 100.0;
    }

    get audioOutput(): Record<string, number> {
        return {};
    }

    get palette(): string | undefined {
        return undefined;
    }

    set palette(value: string | undefined) {}

    get compilerString(): string | null {
        if (!this.compiler) return null;
        const buffer: string[] = [];
        if (this.compiler.name) {
            buffer.push(this.compiler.name);
        }
        if (this.compiler.version) {
            buffer.push(this.compiler.version);
        }
        return buffer.join("/");
    }

    get compilationString(): string | null {
        if (!this.compilation) return null;
        const buffer: string[] = [];
        if (this.compilation.date) {
            buffer.push(this.compilation.date);
        }
        if (this.compilation.time) {
            buffer.push(this.compilation.time);
        }
        return buffer.join(" ");
    }

    get handlers(): Handlers {
        return this._handlers;
    }

    set handlers(value: Handlers) {
        this._handlers = value;
    }

    get logger(): Logger {
        return logger;
    }

    async buildRomData(file: File): Promise<Uint8Array> {
        const arrayBuffer = await file.arrayBuffer();
        const romData = new Uint8Array(arrayBuffer);
        return romData;
    }

    async serializeState(): Promise<Uint8Array> {
        throw new Error("Unable to serialize state");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async unserializeState(_data: Uint8Array) {
        throw new Error("Unable to unserialize state");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async buildState(_index: number, _data: Uint8Array): Promise<SaveState> {
        throw new Error("Unable to build state");
    }

    async saveState(index: number) {
        if (!window.localStorage) {
            throw new Error("Unable to save state");
        }
        const data = await this.serializeState();
        const dataB64 = bufferToBase64(data);
        localStorage.setItem(`${this.romInfo.name}-s${index}`, dataB64);
    }

    async loadState(index: number) {
        const data = await this.getStateData(index);
        await this.unserializeState(data);
    }

    async deleteState(index: number) {
        if (!window.localStorage) {
            throw new Error("Unable to delete state");
        }
        localStorage.removeItem(`${this.romInfo.name}-s${index}`);
    }

    async getState(index: number): Promise<SaveState> {
        const data = await this.getStateData(index);
        return await this.buildState(index, data);
    }

    async getStateData(index: number): Promise<Uint8Array> {
        if (!window.localStorage) {
            throw new Error("Unable to get state");
        }
        const dataB64 = localStorage.getItem(`${this.romInfo.name}-s${index}`);
        if (!dataB64) throw new Error("Unable to get state");
        const data = base64ToBuffer(dataB64);
        return data;
    }

    async listStates(): Promise<number[]> {
        if (!window.localStorage) {
            throw new Error("Unable to list states");
        }
        const states: number[] = [];
        for (let index = 0; index < 10; index++) {
            const dataB64 = localStorage.getItem(
                `${this.romInfo.name}-s${index}`
            );
            if (dataB64 !== null) states.push(index);
        }
        return states;
    }
}

/**
 * Emulator logic implementation meant to be used as a starting point
 * to have an inversion of control in terms of event loop.
 *
 * Any emulator implementation should be able to extend this class
 * and avoid implementing the main game loop logic.
 */
export class EmulatorLogic extends EmulatorBase {
    protected paused = false;
    protected nextTickTime = 0;
    protected logicFrequency = LOGIC_HZ;
    protected visualFrequency = VISUAL_HZ;
    protected idleFrequency = IDLE_HZ;

    private fps = 0;
    private frameStart: number = EmulatorLogic.now();
    private frameCount = 0;
    private cps = 0;
    private cycleStart: number = EmulatorLogic.now();
    private cycleCount = 0;
    private afps = 0;
    private animationFrameStart: number = EmulatorLogic.now();
    private animationFrameCount = 0;

    private _loopMode = LoopMode.Auto;

    get framerate(): number {
        return this.fps;
    }

    get cyclerate(): number {
        return this.cps;
    }

    get animationrate(): number {
        return this.afps;
    }

    get emulationSpeed(): number {
        if (this.logicFrequency === 0.0) return 0.0;
        return (this.cps / this.logicFrequency) * 100.0;
    }

    get loopMode(): LoopMode {
        return this._loopMode;
    }

    set loopMode(value: LoopMode) {
        // in case the loop mode is set to auto, tries to determine
        // the best loop mode for the current environment
        if (value === LoopMode.Auto) {
            value =
                window.requestAnimationFrame === undefined
                    ? LoopMode.SetTimeout
                    : LoopMode.AnimationFrame;
        }
        this._loopMode = value;
    }

    /**
     * Runs the initialization and main loop execution for the emulator.
     * The main execution of this function should be an infinite
     * loop running machine `tick` operations.
     *
     * Should be called only once per instance and serve as its main entry
     * point of execution.
     *
     * @param options The set of options that are going to be
     * used in he emulator initialization.
     */
    async start({
        romUrl,
        loopMode = LoopMode.Auto
    }: {
        romUrl?: string;
        loopMode?: LoopMode;
    }) {
        this.loopMode = loopMode;

        // boots the emulator subsystem with the initial
        // ROM retrieved from a remote data source
        await this.boot({ loadRom: true, romPath: romUrl ?? undefined });

        // binds the frame event to the current instance of the
        // emulator logic, this event is going to be used to
        // calculate the number of frames per second (FPS)
        this.bind("frame", () => {
            // increments the current frame count (as new frame exists)
            // and in case the target number of frames for FPS control
            // has been reached calculates the number of FPS and
            // flushes the value to the screen
            this.frameCount++;
            if (this.frameCount >= this.visualFrequency * FPS_SAMPLE_RATE) {
                const currentTime = EmulatorLogic.now();
                const deltaFps = (currentTime - this.frameStart) / 1000;
                const deltaCps = (currentTime - this.cycleStart) / 1000;
                const deltaAfps =
                    (currentTime - this.animationFrameStart) / 1000;
                this.fps = Math.round(this.frameCount / deltaFps);
                this.cps = Math.round(this.cycleCount / deltaCps);
                this.afps = Math.round(this.animationFrameCount / deltaAfps);
                this.resetTimeCounters();
            }
        });

        this.bind("tick", (_owner, params: unknown) => {
            const tickInfo = params as TickInfo;
            this.cycleCount += tickInfo.cycles ?? 0;
        });

        this.bind("animation-frame", () => {
            this.animationFrameCount++;
        });

        // registers for the visibility change event so that the
        // whenever we get focus on the emulator tab we reset
        // the counters so that the FPS and CPS are accurate
        this.bind("visible", () => {
            this.resetTimeCounters();
        });

        // pipes some of the native visibility change events
        // into the internal event system
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                this.trigger("visible");
            }
            if (document.visibilityState === "hidden") {
                this.trigger("hidden");
            }
        });

        await this.loop();
    }

    async stop() {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async boot(options: unknown) {
        throw new Error("Not implemented");
    }

    async toggleRunning() {
        if (this.paused) {
            await this.resume();
        } else {
            await this.pause();
        }
    }

    async pause() {
        this.paused = true;
    }

    async resume() {
        this.paused = false;
        this.nextTickTime = EmulatorLogic.now();
        this.resetTimeCounters();
    }

    async reset() {
        await this.boot({ engine: null });
        this.resetTimeCounters();
    }

    async tick() {
        throw new Error("Not implemented");
    }

    async hardReset() {
        // calls the (soft) reset as a fallback default implementation
        // of the hard reset operation, this should be enough for most
        // of the cases, but may be overridden by the concrete emulator
        // implementation if a more specific (hard) behavior is required
        await this.reset();
    }

    async handleError(err: Error) {
        // sets the default error message to be displayed
        // to the user, this value may be overridden in case
        // a better and more explicit message can be determined
        let message = String(err);

        // verifies if the current issue is a panic one
        // and updates the message value if that's the case
        const messageNormalized = (err as Error).message.toLowerCase();
        const isPanic =
            messageNormalized.startsWith("unreachable") ||
            messageNormalized.startsWith("recursive use of an object");
        if (isPanic) {
            message = "Unrecoverable error, restarting emulator";
        }

        // displays the error information to both the end-user
        // and the developer (for diagnostics)
        this.trigger("message", {
            text: message,
            error: true,
            timeout: 5000
        });
        console.error(err);

        // pauses the machine, allowing the end-user to act
        // on the error in a proper fashion
        this.pause();

        // if we're talking about a panic, proper action must be taken
        // which in this case means restarting both the WASM sub
        // system and the machine state (to be able to recover)
        if (isPanic) {
            await this.hardReset();
            this.trigger("error");
        }
    }

    private async loop() {
        while (true) {
            switch (this.loopMode) {
                case LoopMode.SetTimeout:
                    await this.loopSetTimeout();
                    break;
                case LoopMode.AnimationFrame:
                    await this.loopAnimationFrame();
                    break;
                default:
                    throw new Error("Invalid loop mode");
            }
        }
    }

    private async loopSetTimeout() {
        // runs the sequence as an infinite loop, running
        // the associated CPU cycles accordingly
        while (true) {
            // breaks the loop in case the loop mode has changed
            if (this.loopMode !== LoopMode.SetTimeout) {
                break;
            }

            // in case the machine is paused we must delay the execution
            // a little bit until the paused state is recovered
            if (this.paused) {
                this.trigger("animation-frame");
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000 / this.idleFrequency);
                });
                continue;
            }

            // runs the internal tick operation that is going to
            // update the state of the machine and handle possible errors
            await this.internalTick();

            // calculates the amount of time until the next draw operation
            // this is the amount of time that is going to be pending
            const afterTime = EmulatorLogic.now();
            const pendingTime = Math.max(this.nextTickTime - afterTime, 0);

            // triggers the animation frame event so that any listener "knows"
            // that a new frame render loop has been executed
            this.trigger("animation-frame");

            // waits the required time until until the next tick operation
            // should be executed - this should control the flow of render
            await new Promise((resolve) => {
                setTimeout(resolve, pendingTime);
            });
        }
    }

    private async loopAnimationFrame() {
        const step = async (time: DOMHighResTimeStamp) => {
            if (this.loopMode !== LoopMode.AnimationFrame) {
                this.loop();
                return;
            }
            window.requestAnimationFrame(step);
            if (!this.paused) {
                let remainingTicks = MAX_TICKS_ANIMATION_FRAME;
                const now = time;
                while (now >= this.nextTickTime) {
                    if (remainingTicks === 0) {
                        this.nextTickTime = time;
                        break;
                    }
                    await this.internalTick(time);
                    remainingTicks--;
                }
            }
            this.trigger("animation-frame");
        };
        window.requestAnimationFrame(step);
        await new Promise(() => {});
    }

    private async internalTick(time?: DOMHighResTimeStamp) {
        // obtains the current time, this value is going
        // to be used to compute the need for tick computation
        const beforeTime = time ?? EmulatorLogic.now();

        try {
            await this.tick();
        } catch (err) {
            await this.handleError(err);
        }

        // calculates the number of ticks that have elapsed since the
        // last draw operation, this is critical to be able to properly
        // operate the clock of the CPU in frame drop situations, meaning
        // a situation where the system resources are not able to emulate
        // the system on time and frames must be skipped (ticks > 1)
        //
        // NOTE: The ticks operations does not apply to the animation frame
        // loop mode due to the nature of the event loop, which does not
        // allow direct control of the internal tick timing (that's controller
        // by the browser), which means that a certain delay may always occur
        // and multiple emulator tick operations should be performed on a single
        // animate tick to compensate for this fact.
        if (this.nextTickTime === 0) this.nextTickTime = beforeTime;
        let ticks = Math.ceil(
            (beforeTime - this.nextTickTime) / (1000 / this.visualFrequency)
        );
        ticks =
            this.loopMode === LoopMode.AnimationFrame ? 1 : Math.max(ticks, 1);

        // updates the next update time according to the number of ticks
        // that have elapsed since the last operation, this way this value
        // can better be used to control the game loop
        this.nextTickTime += (1000 / this.visualFrequency) * ticks;
    }

    private resetTimeCounters() {
        this.resetFpsCounters();
        this.resetCpsCounters();
        this.resetAfpsCounters();
    }

    private resetFpsCounters() {
        this.frameCount = 0;
        this.frameStart = EmulatorLogic.now();
    }

    private resetCpsCounters() {
        this.cycleCount = 0;
        this.cycleStart = EmulatorLogic.now();
    }

    private resetAfpsCounters() {
        this.animationFrameCount = 0;
        this.animationFrameStart = EmulatorLogic.now();
    }
}

export const LOOP_MODES_M: { [key: string]: LoopMode } = {
    auto: LoopMode.Auto,
    settimeout: LoopMode.SetTimeout,
    animation: LoopMode.AnimationFrame,
    animationframe: LoopMode.AnimationFrame
};

export const LOOP_MODES_S = ["auto", "settimeout", "animation"];

export const loopModes = (): string[] => {
    return LOOP_MODES_S;
};

export const getLoopMode = (value: string): LoopMode => {
    return LOOP_MODES_M[value] ?? LoopMode.Auto;
};

export const hasFeature = (emulator: Emulator, feature: Feature) => {
    return emulator.features.includes(feature);
};
