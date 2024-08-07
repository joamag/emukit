import React, {
    FC,
    Fragment,
    ReactNode,
    useEffect,
    useRef,
    useState
} from "react";
import ReactDOM from "react-dom/client";

import {
    Button,
    ButtonContainer,
    ButtonIncrement,
    ButtonSwitch,
    ClearHandler,
    Debug,
    Display,
    DrawHandler,
    Footer,
    Gamepad,
    Help,
    Info,
    KeyboardChip8,
    KeyboardGB,
    Link,
    ModalManager,
    ModalManagerHandle,
    Overlay,
    Pair,
    PairState,
    PanelSplit,
    PanelTab,
    Paragraph,
    SaveInfo,
    Section,
    Separator,
    Title,
    ToastManager,
    ToastManagerHandle
} from "./components/index.ts";
import {
    downloadFromBuffer,
    AudioChunk,
    AudioState,
    Emulator,
    Feature,
    Frequency,
    FREQUENCY_DELTA,
    frequencyRatios,
    PixelFormat,
    RomInfo,
    SaveState,
    getLoopMode,
    loopModes,
    DISPLAY_FREQUENCY_DELTA
} from "../ts/index.ts";

import "./app.css";

import info from "../package.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

type EmulatorAppProps = {
    emulator: Emulator;
    fullscreen?: boolean;
    debug?: boolean;
    keyboard?: boolean;
    palette?: string;
    nativeFullscreen?: boolean;
    background?: string;
    backgrounds?: string[];
    onBackground?: (background: string) => void;
};

const isTouchDevice = () => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

export const EmulatorApp: FC<EmulatorAppProps> = ({
    emulator,
    fullscreen = false,
    debug = false,
    keyboard = false,
    palette,
    nativeFullscreen = true,
    background,
    backgrounds = ["264653"],
    onBackground
}) => {
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [fast, setFast] = useState(false);
    const [fullscreenState, setFullscreenState] = useState(fullscreen);
    const [backgroundIndex, setBackgroundIndex] = useState(
        background ? Math.max(backgrounds.indexOf(background), 0) : 0
    );
    const [romInfo, setRomInfo] = useState<RomInfo>({});
    const [framerate, setFramerate] = useState(0);
    const [cyclerate, setCyclerate] = useState(0);
    const [animationrate, setAnimationrate] = useState(0);
    const [emulationSpeed, setEmulationSpeed] = useState(0);
    const [paletteName, setPaletteName] = useState(palette ?? emulator.palette);
    const [saveStates, setSaveStates] = useState<Record<number, SaveState>>({});
    const [gamepads, setGamepads] = useState<Record<number, Gamepad>>({});
    const [keyaction, setKeyaction] = useState<string>();
    const [keyboardVisible, setKeyboardVisible] = useState(
        isTouchDevice() || keyboard
    );
    const [infoVisible, setInfoVisible] = useState(true);
    const [debugVisible, setDebugVisible] = useState(debug);
    const [visibleSections, setVisibleSections] = useState<string[]>([]);

    const audioStateRef = useRef<AudioState>({
        audioContext: null,
        audioChunks: [],
        nextPlayTime: 0.0
    });
    const modalManagerRef = useRef<ModalManagerHandle>(null);
    const toastManagerRef = useRef<ToastManagerHandle>(null);
    const frameRef = useRef<boolean>(false);
    const errorRef = useRef<boolean>(false);
    const titleRef = useRef<string>(document.title);

    const frequencyRatio =
        frequencyRatios[emulator.frequencySpecs.unit ?? Frequency.Hz];
    const displayFrequencyRatio =
        frequencyRatios[emulator.frequencySpecs.displayUnit ?? Frequency.Hz];

    useEffect(() => {
        const background = getBackground();
        document.body.style.backgroundColor = `#${background}`;
        onBackground && onBackground(background);
        emulator.onBackground && emulator.onBackground(background);
    }, [backgroundIndex]);
    useEffect(() => {
        if (romInfo.name) {
            document.title = `${titleRef.current} - ${romInfo.name}`;
        } else {
            document.title = titleRef.current;
        }
    }, [romInfo]);
    useEffect(() => {
        switch (keyaction) {
            case "Plus":
                emulator.frequency +=
                    emulator.frequencySpecs.delta ?? FREQUENCY_DELTA;
                setKeyaction(undefined);
                break;
            case "Minus":
                emulator.frequency -=
                    emulator.frequencySpecs.delta ?? FREQUENCY_DELTA;
                setKeyaction(undefined);
                break;
            case "Escape":
                setFullscreenState(false);
                setKeyaction(undefined);
                break;
            case "Fullscreen":
                setFullscreenState(!fullscreenState);
                setKeyaction(undefined);
                break;
            case "Keyboard":
                setKeyboardVisible(!keyboardVisible);
                setKeyaction(undefined);
                break;
            case "Palette":
                if (emulator.changePalette) {
                    setPaletteName(emulator.changePalette());
                }
                setKeyaction(undefined);
                break;
            case "Accelerate":
                if (!fast) {
                    emulator.frequency *= 8;
                    setFast(true);
                }
                break;
            case "Slowdown":
                if (fast) {
                    emulator.frequency /= 8;
                    setFast(false);
                }
                break;
        }
    }, [keyaction]);
    useEffect(() => {
        if (palette) {
            emulator.palette = palette;
        }
        const onFullChange = () => {
            if (
                !document.fullscreenElement &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                !(document as any).webkitFullscreenElement
            ) {
                setFullscreenState(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case "+":
                    setKeyaction("Plus");
                    event.stopPropagation();
                    event.preventDefault();
                    break;
                case "-":
                    setKeyaction("Minus");
                    event.stopPropagation();
                    event.preventDefault();
                    break;
                case "Escape":
                    setKeyaction("Escape");
                    event.stopPropagation();
                    event.preventDefault();
                    break;
            }
            if (event.ctrlKey === true) {
                switch (event.key) {
                    case "f":
                        setKeyaction("Fullscreen");
                        event.stopPropagation();
                        event.preventDefault();
                        break;
                    case "k":
                        setKeyaction("Keyboard");
                        event.stopPropagation();
                        event.preventDefault();
                        break;
                    case "d":
                        setKeyaction("Accelerate");
                        event.stopPropagation();
                        event.preventDefault();
                        break;
                    case "p":
                        setKeyaction("Palette");
                        event.stopPropagation();
                        event.preventDefault();
                        break;
                }
            }
        };
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.ctrlKey === true) {
                switch (event.key) {
                    case "d":
                        setKeyaction("Slowdown");
                        event.stopPropagation();
                        event.preventDefault();
                        break;
                }
            } else {
                switch (event.key) {
                    case "Control":
                        setKeyaction("Slowdown");
                        break;
                }
            }
        };
        const onBooted = () => {
            refreshRom();
            setPaused(false);
        };
        const onMessage = (emulator: Emulator, _params: unknown = {}) => {
            const params = _params as Record<string, unknown>;
            showToast(
                params.text as string,
                params.error as boolean,
                params.timeout as number
            );
        };
        document.addEventListener("fullscreenchange", onFullChange);
        document.addEventListener("webkitfullscreenchange", onFullChange);
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        emulator.bind("booted", onBooted);
        emulator.bind("message", onMessage);

        // updates the emulator with the handles that can be used to control
        // some of the UI functionality directly from the emulator instance
        emulator.handlers = {
            showModal: showModal,
            showHelp: showHelp,
            showToast: showToast
        };

        return () => {
            document.removeEventListener("fullscreenchange", onFullChange);
            document.removeEventListener(
                "webkitfullscreenchange",
                onFullChange
            );
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
            emulator.unbind("booted", onBooted);
            emulator.unbind("message", onMessage);
        };
    }, []);

    /**
     * Refreshes the current ROM information by querying the emulator
     * about the multiple changes resulting from a new ROM loading.
     */
    const refreshRom = () => {
        setRomInfo(emulator.romInfo);
        refreshSaveStates();
    };

    /**
     * Refreshes the current save states information by querying the emulator
     * for the current list of save states and then updating the state with
     * the new information.
     * It should trigger a visual refresh on React state change, that will
     * update the UI with the new save states.
     * This operation is considered expensive and should used with care.
     */
    const refreshSaveStates = () => {
        const saveStates = Object.fromEntries(
            emulator
                .listStates?.()
                .map((index) => [index, emulator.getState!(index)]) ?? []
        );
        setSaveStates(saveStates);
    };

    const getPauseText = () => (paused ? "Resume" : "Pause");
    const getPauseIcon = () =>
        paused ? require("../res/play.svg") : require("../res/pause.svg");
    const getSoundText = () => (muted ? "Unmute Sound" : "Mute Sound");
    const getSoundIcon = () =>
        muted
            ? require("../res/sound_off.svg")
            : require("../res/sound_on.svg");
    const getBackground = () => backgrounds[backgroundIndex];
    const renderGeneralTab = () => (
        <Info>
            <Pair
                key="button-engine"
                name={"Engine"}
                valueNode={
                    <ButtonSwitch
                        options={emulator.engines}
                        value={emulator.engine || emulator.engines[0]}
                        uppercase={true}
                        size={"large"}
                        style={["simple"]}
                        onChange={onEngineChange}
                    />
                }
            />
            <Pair key="rom" name={"ROM"} value={romInfo.name ?? "-"} />
            <Pair
                key="rom-size"
                name={"ROM Size"}
                value={
                    romInfo.size
                        ? `${new Intl.NumberFormat().format(
                              romInfo.size
                          )} bytes`
                        : "-"
                }
            />
            <Pair
                key="button-frequency"
                name={"CPU Frequency"}
                valueNode={
                    <ButtonIncrement
                        value={emulator.frequency / frequencyRatio}
                        delta={
                            (emulator.frequencySpecs.delta ?? FREQUENCY_DELTA) /
                            frequencyRatio
                        }
                        min={0}
                        suffix={emulator.frequencySpecs.unit ?? "Hz"}
                        decimalPlaces={emulator.frequencySpecs.places ?? 0}
                        onChange={onFrequencyChange}
                        onReady={onFrequencyReady}
                    />
                }
            />
            {hasFeature(Feature.DisplayFrequency) && (
                <Pair
                    key="button-display-frequency"
                    name={"Display Frequency"}
                    valueNode={
                        <ButtonIncrement
                            value={
                                emulator.displayFrequency /
                                displayFrequencyRatio
                            }
                            delta={
                                (emulator.frequencySpecs.displayDelta ??
                                    DISPLAY_FREQUENCY_DELTA) /
                                displayFrequencyRatio
                            }
                            min={0}
                            suffix={emulator.frequencySpecs.displayUnit ?? "Hz"}
                            decimalPlaces={
                                emulator.frequencySpecs.displayPlaces ?? 0
                            }
                            onChange={onDisplayFrequencyChange}
                        />
                    }
                />
            )}
            {hasFeature(Feature.LoopMode) && (
                <Pair
                    key="button-loop-mode"
                    name={"Loop Mode"}
                    valueNode={
                        <ButtonSwitch
                            options={loopModes()}
                            value={"auto"}
                            uppercase={true}
                            size={"large"}
                            style={["simple"]}
                            onChange={onLoopChange}
                        />
                    }
                />
            )}
            {hasFeature(Feature.BootRomInfo) && (
                <Pair
                    key="boot-rom"
                    name={"Boot ROM"}
                    value={
                        romInfo.extra?.bootRom
                            ? `${romInfo.extra?.bootRom}`
                            : "-"
                    }
                />
            )}
            {hasFeature(Feature.RomTypeInfo) && (
                <Pair
                    key="rom-type"
                    name={"ROM Type"}
                    value={
                        romInfo.extra?.romType
                            ? `${romInfo.extra?.romType}`
                            : "-"
                    }
                />
            )}
            {hasFeature(Feature.Framerate) && (
                <Pair
                    key="framerate"
                    name={"Framerate"}
                    value={`${framerate} FPS`}
                />
            )}
            {hasFeature(Feature.Cyclerate) && (
                <Pair
                    key="cyclerate"
                    name={"Cyclerate"}
                    value={`${Intl.NumberFormat().format(cyclerate)} Hz`}
                />
            )}
            {hasFeature(Feature.Animationrate) && (
                <Pair
                    key="animationrate"
                    name={"Animationrate"}
                    value={`${Intl.NumberFormat().format(animationrate)} Hz`}
                />
            )}
            {hasFeature(Feature.EmulationSpeed) && (
                <Pair
                    key="emulation-speed"
                    name={"Emulation Speed"}
                    value={`${Math.round(emulationSpeed)} %`}
                />
            )}
        </Info>
    );
    const renderDetailsTab = () => (
        <Info>
            <Pair
                key="emukit"
                name={"EmuKit"}
                value={info.version}
                valueHref={
                    "https://github.com/joamag/emukit/blob/master/CHANGELOG.md"
                }
            />
            {hasFeature(Feature.Themes) && (
                <Pair
                    key="theme"
                    name={"Theme"}
                    value={`#${getBackground()}`}
                />
            )}
            {hasFeature(Feature.Palettes) && (
                <Pair key="palette" name={"Palette"} value={paletteName} />
            )}
            {emulator.compilerString && (
                <Pair
                    key="compiler"
                    name={"Compiler"}
                    value={emulator.compilerString}
                />
            )}
            {emulator.compilationString && (
                <Pair
                    key="compilation"
                    name={"Compilation"}
                    value={emulator.compilationString}
                />
            )}
            {emulator.wasmEngine && (
                <Pair
                    key="wasm-engine"
                    name={"WASM Engine"}
                    value={emulator.wasmEngine}
                />
            )}
        </Info>
    );
    const renderSaveStatesTab = () =>
        hasSaveStatesTab() ? (
            <>
                <Info style={["large"]}>
                    {Object.keys(saveStates).length > 0 ? (
                        Object.entries(saveStates).map(([index, saveSate]) => (
                            <Fragment key={`#${index}`}>
                                <PairState
                                    index={saveSate.index}
                                    thumbnail={saveSate.thumbnail}
                                    thumbnailSize={[
                                        emulator.dimensions.width,
                                        emulator.dimensions.height
                                    ]}
                                    saveState={saveSate}
                                    onLoadClick={() =>
                                        onLoadStateClick(saveSate.index)
                                    }
                                    onDeleteClick={() =>
                                        onDeleteStateClick(saveSate.index)
                                    }
                                    onInfoClick={() =>
                                        onInfoStateClick(saveSate.index)
                                    }
                                    onDownloadClick={() =>
                                        onDownloadStateClick(saveSate.index)
                                    }
                                />
                                <Separator
                                    marginTop={12}
                                    marginBottom={12}
                                    thickness={1}
                                    color="transparent"
                                />
                            </Fragment>
                        ))
                    ) : (
                        <Paragraph style={["no-margin-top"]}>
                            There're currently no save states for this ROM!
                            <br />
                            Press Save State to capture the current machine
                            state into local storage.
                        </Paragraph>
                    )}
                </Info>
                <div>
                    <Button text={"Save State"} onClick={onSaveStateClick} />
                </div>
            </>
        ) : null;
    const renderControllersTab = () =>
        hasControllersTab() ? (
            <Info style={["small"]}>
                {Object.entries(gamepads).map(([index, gamepad]) => (
                    <Pair
                        key={`#${index}`}
                        name={`#${index}`}
                        value={gamepad.id}
                    />
                ))}
            </Info>
        ) : null;
    const hasSaveStatesTab = () => hasFeature(Feature.SaveState);
    const hasControllersTab = () => Object.keys(gamepads).length > 0;
    const getTabs = () => {
        const tabs = [];
        tabs.push(renderGeneralTab());
        tabs.push(renderDetailsTab());
        hasSaveStatesTab() && tabs.push(renderSaveStatesTab());
        hasControllersTab() && tabs.push(renderControllersTab());
        return tabs;
    };
    const getTabNames = () => {
        const tabNames = [];
        tabNames.push("General");
        tabNames.push("Details");
        hasSaveStatesTab() && tabNames.push("Save States");
        hasControllersTab() && tabNames.push("Controllers");
        return tabNames;
    };

    const showModal = async (
        title = "Alert",
        text?: string,
        contents?: ReactNode
    ): Promise<boolean> => {
        return (
            (await modalManagerRef.current?.showModal(title, text, contents)) ??
            true
        );
    };
    const showHelp = async (title = "Help") => {
        await showModal(
            title,
            undefined,
            <Help
                panels={emulator.help.map((h) => h.node)}
                names={emulator.help.map((h) => h.name)}
            />
        );
    };
    const showSaveInfo = async (saveState: SaveState) => {
        await showModal(
            `Save State #${saveState.index}`,
            undefined,
            <SaveInfo saveState={saveState} emulator={emulator} />
        );
    };
    const showToast = async (text: string, error = false, timeout = 3500) => {
        return await toastManagerRef.current?.showToast(text, error, timeout);
    };
    const hasFeature = (feature: Feature) => {
        return emulator.features.includes(feature);
    };

    const onFile = async (file: File) => {
        const fileExtension = file.name.split(".").pop() ?? "";
        if (!emulator.romExts.includes(fileExtension)) {
            showToast(
                `This is probably not a ${emulator.device.text} ROM file!`,
                true
            );
            return;
        }

        const romData = await emulator.buildRomData(file);
        try {
            await emulator.boot({
                engine: null,
                romName: file.name,
                romData: romData
            });
            showToast(`Loaded ${file.name} ROM successfully!`);
            emulator.logger.info(`Loaded ${file.name} ROM successfully`);
        } catch (err) {
            showToast(`Failed to load ${file.name} ROM!`, true);
            emulator.logger.error(`Failed to load ${file.name} ROM (${err})`);
        }
    };
    const onPauseClick = () => {
        emulator.toggleRunning();
        setPaused(!paused);
    };
    const onResetClick = () => {
        emulator.reset();
        emulator.logger.info(`Finished reset operation`);
    };
    const onSoundClick = () => {
        if (!audioStateRef.current.audioContext) {
            return;
        }
        const audioContext = audioStateRef.current.audioContext;
        if (muted) {
            audioContext.resume();
            emulator.resumeAudio?.();
            setMuted(false);
        } else {
            audioContext.suspend();
            emulator.pauseAudio?.();
            setMuted(true);
        }
    };
    const onBenchmarkClick = async () => {
        if (!emulator.benchmark) return;
        const result = await showModal(
            "Confirm",
            "Are you sure you want to start a benchmark?\nThe benchmark is considered an expensive operation!"
        );
        if (!result) return;
        const { delta, count, frequency_mhz } = emulator.benchmark();
        await showToast(
            `Took ${delta.toFixed(
                2
            )} seconds to run ${count} ticks (${frequency_mhz.toFixed(
                2
            )} Mhz)!`,
            undefined,
            7500
        );
    };
    const onFullscreenClick = () => {
        setFullscreenState(!fullscreenState);
    };
    const onKeyboardClick = () => {
        setKeyboardVisible(!keyboardVisible);
    };
    const onInformationClick = () => {
        setInfoVisible(!infoVisible);
    };
    const onHelpClick = () => {
        showHelp();
    };
    const onDebugClick = () => {
        setDebugVisible(!debugVisible);
    };
    const onThemeClick = () => {
        setBackgroundIndex((backgroundIndex + 1) % backgrounds.length);
    };
    const onPaletteClick = () => {
        if (!emulator.changePalette) return;
        const palette = emulator.changePalette();
        setPaletteName(palette);
    };
    const onSectionClick = (name: string) => {
        const isVisible = visibleSections.includes(name);
        if (isVisible) {
            setVisibleSections(visibleSections.filter((s) => s !== name));
        } else {
            setVisibleSections([...visibleSections, name]);
        }
    };
    const onSaveStateClick = () => {
        for (let index = 0; index < 10; index++) {
            if (saveStates[index] === undefined) {
                emulator.saveState?.(index);
                refreshSaveStates();
                break;
            }
        }
    };
    const onLoadStateClick = (index: number) => {
        emulator.loadState?.(index);
        showToast(`Loaded save state #${index} successfully!`);
    };
    const onDownloadStateClick = async (index: number) => {
        const data = emulator.getStateData!(index);
        downloadFromBuffer(data, `${emulator.romInfo.name}.s${index}`);
    };
    const onInfoStateClick = async (index: number) => {
        const saveState = emulator.getState!(index);
        showSaveInfo(saveState);
    };
    const onDeleteStateClick = async (index: number) => {
        const result = await showModal(
            "Confirm",
            `Are you sure you want to delete save state #${index}?\nThis operation is not reversible!`
        );
        if (!result) return;
        emulator.deleteState?.(index);
        refreshSaveStates();
        showToast(`Deleted save state #${index} successfully!`);
    };
    const onUploadFile = async (file: File) => {
        const romData = await emulator.buildRomData(file);
        try {
            await emulator.boot({
                engine: null,
                romName: file.name,
                romData: romData
            });
            showToast(`Loaded ${file.name} ROM successfully!`);
            emulator.logger.info(`Loaded ${file.name} ROM successfully`);
        } catch (err) {
            showToast(`Failed to load ${file.name} ROM!`, true);
            emulator.logger.error(`Failed to load ${file.name} ROM (${err})`);
        }
    };
    const onEngineChange = async (engine: string) => {
        await emulator.boot({ engine: engine });
        showToast(
            `${emulator.device.text} running on engine "${engine}" from now on!`
        );
    };
    const onLoopChange = async (loopMode: string) => {
        emulator.loopMode = getLoopMode(loopMode);
        showToast(
            `${emulator.device.text} running on loop mode "${loopMode}" from now on!`
        );
    };
    const onFrequencyChange = (value: number) => {
        emulator.frequency = value * frequencyRatio;
    };
    const onFrequencyReady = (handler: (value: number) => void) => {
        emulator.bind("frequency", (emulator: Emulator, frequency: unknown) => {
            handler((frequency as number) / frequencyRatio);
        });
    };
    const onDisplayFrequencyChange = (value: number) => {
        emulator.displayFrequency = value * displayFrequencyRatio;
    };
    const onMinimize = () => {
        setFullscreenState(!fullscreenState);
    };
    const onKeyDown = (key: string) => {
        emulator.keyPress(key);
    };
    const onKeyUp = (key: string) => {
        emulator.keyLift(key);
    };
    const onGamepad = (
        gamepad: Gamepad,
        isValid: boolean,
        connected = true
    ) => {
        const { index, id } = gamepad;
        if (connected) {
            if (isValid) {
                gamepads[gamepad.index] = gamepad;
                setGamepads({ ...gamepads });
                showToast(`🕹️ Gamepad #${index} connect ${id}`);
            } else {
                showToast(`😥 Unsupported gamepad connect ${id}`, true);
            }
        } else if (isValid) {
            delete gamepads[index];
            setGamepads({ ...gamepads });
            showToast(`🕹️ Gamepad #${index} disconnected ${id}`, true);
        }
    };
    const onDrawHandler = (handler: DrawHandler) => {
        if (frameRef.current) return;
        frameRef.current = true;
        emulator.bind("frame", () => {
            handler(emulator.imageBuffer, PixelFormat.RGB);
            setFramerate(emulator.framerate);
            setCyclerate(emulator.cyclerate);
            setAnimationrate(emulator.animationrate);
            setEmulationSpeed(emulator.emulationSpeed);
        });
    };
    const onClearHandler = (handler: ClearHandler) => {
        if (errorRef.current) return;
        errorRef.current = true;
        emulator.bind("error", async () => {
            await handler(undefined, require("../res/storm.png"), 0.2);
        });
    };
    const onAudioReady = () => {
        // in case the emulator does not provide proper audio specs
        // then the audio should not be enabled for it
        if (emulator.audioSpecs === null) {
            return;
        }

        // in case the audio context has already been build then
        // there's nothing pending to be done
        if (audioStateRef.current.audioContext !== null) {
            return;
        }

        // creates the audio context (should be created on a click
        // event for user interaction) and then immediately resumes
        // the audio for it so that it play the sound in buffer
        const audioContext = new AudioContext({
            sampleRate: emulator.audioSpecs.samplingRate
        });
        audioContext.resume();
        audioStateRef.current.audioContext = audioContext;

        emulator.bind("audio", () => {
            if (emulator.audioSpecs === null) {
                return;
            }

            const audioState = audioStateRef.current;
            if (audioState.audioContext === null) {
                return;
            }

            const internalAudioBuffer = emulator.audioBuffer;
            const { samplingRate, channels } = emulator.audioSpecs;

            const bufferLength = internalAudioBuffer[0].length;
            if (bufferLength === 0) {
                return;
            }

            const audioBuffer = audioState.audioContext.createBuffer(
                channels,
                bufferLength,
                samplingRate
            );

            // for each of the channels copies the float 32 array from the
            // internal (emulator specific) buffers into the audio buffer
            // channel data buffers
            for (let channel = 0; channel < channels; channel++) {
                const channelBuffer = audioBuffer.getChannelData(channel);
                const internalChannelBuffer = internalAudioBuffer[channel];
                channelBuffer.set(internalChannelBuffer);
            }

            const source = audioState.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioState.audioContext.destination);

            // makes sure that we're not too far away from the audio
            // and if that's the case drops some of the audio to regain
            // some sync, this is required because of time hogging
            const audioCurrentTime = audioState.audioContext.currentTime;
            if (
                audioState.nextPlayTime > audioCurrentTime + 0.25 ||
                audioState.nextPlayTime < audioCurrentTime
            ) {
                audioState.audioChunks.forEach((chunk) => {
                    if (!audioState?.audioContext) return;
                    chunk.source.disconnect(
                        audioState.audioContext.destination
                    );
                    chunk.source.stop();
                });
                audioState.audioChunks = [];
                audioState.nextPlayTime = audioCurrentTime + 0.1;
            }

            audioState.nextPlayTime =
                audioState.nextPlayTime || audioCurrentTime;

            const chunk: AudioChunk = {
                source: source,
                playTime: audioState.nextPlayTime,
                duration: audioBuffer.length / samplingRate
            };

            source.start(chunk.playTime);
            audioState.nextPlayTime += chunk.duration;

            audioState.audioChunks.push(chunk);
        });
    };

    return (
        <div className="app" onClick={onAudioReady} onTouchStart={onAudioReady}>
            <ModalManager ref={modalManagerRef} />
            <ToastManager ref={toastManagerRef} />
            <Overlay text={"Drag to load ROM"} onFile={onFile} />
            <Footer color={getBackground()}>
                Built with ❤️ by{" "}
                <Link href="https://joao.me" target="_blank">
                    João Magalhães
                </Link>
            </Footer>
            <PanelSplit
                left={
                    <div className="display-container">
                        <Display
                            options={{
                                width:
                                    emulator.dimensions.width *
                                    (emulator.dimensions.scale ?? 2),
                                height:
                                    emulator.dimensions.height *
                                    (emulator.dimensions.scale ?? 2),
                                logicWidth: emulator.dimensions.width,
                                logicHeight: emulator.dimensions.height
                            }}
                            fullscreen={fullscreenState}
                            nativeFullscreen={nativeFullscreen}
                            onDrawHandler={onDrawHandler}
                            onClearHandler={onClearHandler}
                            onMinimize={onMinimize}
                        />
                    </div>
                }
            >
                <Section visible={keyboardVisible} separatorBottom={true}>
                    {hasFeature(Feature.KeyboardChip8) && (
                        <KeyboardChip8
                            onKeyDown={onKeyDown}
                            onKeyUp={onKeyUp}
                        />
                    )}
                    {hasFeature(Feature.KeyboardGB) && (
                        <KeyboardGB
                            fullscreen={fullscreenState}
                            onKeyDown={onKeyDown}
                            onKeyUp={onKeyUp}
                            onGamepad={onGamepad}
                        />
                    )}
                </Section>
                <Title
                    text={emulator.name}
                    version={emulator.version?.text}
                    versionUrl={emulator.version?.url}
                    iconSrc={emulator.icon ?? require("../res/thunder.png")}
                ></Title>
                <Section>
                    <Paragraph>
                        This is a{" "}
                        {emulator.device.url ? (
                            <Link href={emulator.device.url} target="_blank">
                                {emulator.device.text}
                            </Link>
                        ) : (
                            emulator.device.text
                        )}{" "}
                        emulator built using the{" "}
                        <Link href="https://www.rust-lang.org" target="_blank">
                            Rust Programming Language
                        </Link>{" "}
                        and is running inside this browser with the help of{" "}
                        <Link href="https://webassembly.org" target="_blank">
                            WebAssembly
                        </Link>
                        .
                    </Paragraph>
                    {emulator.repository && (
                        <Paragraph>
                            You can check the source code of it on{" "}
                            {emulator.repository.url ? (
                                <Link
                                    href={emulator.repository.url}
                                    target="_blank"
                                >
                                    {emulator.repository.text}
                                </Link>
                            ) : (
                                <>{emulator.repository.text}</>
                            )}
                            .
                        </Paragraph>
                    )}
                    <Paragraph>
                        TIP: Drag and Drop ROM files to the Browser to load the
                        ROM.
                    </Paragraph>
                </Section>
                {debugVisible && (
                    <Section>
                        <Debug
                            panels={emulator.debug.map((h) => h.node)}
                            names={emulator.debug.map((h) => h.name)}
                        />
                    </Section>
                )}
                {infoVisible && (
                    <Section>
                        <PanelTab
                            tabs={getTabs()}
                            tabNames={getTabNames()}
                            selectors={true}
                        />
                    </Section>
                )}
                {emulator.sections.map(
                    (section) =>
                        visibleSections.includes(section.name) && (
                            <Section key={section.name}>{section.node}</Section>
                        )
                )}
                <Section>
                    <ButtonContainer>
                        <Button
                            text={getPauseText()}
                            image={getPauseIcon()}
                            imageAlt="pause"
                            enabled={paused}
                            style={["simple", "border", "padded"]}
                            onClick={onPauseClick}
                        />
                        <Button
                            text={"Reset"}
                            image={require("../res/reset.svg")}
                            imageAlt="reset"
                            style={["simple", "border", "padded"]}
                            onClick={onResetClick}
                        />
                        <Button
                            text={getSoundText()}
                            image={getSoundIcon()}
                            imageAlt="sound"
                            enabled={muted}
                            style={["simple", "border", "padded"]}
                            onClick={onSoundClick}
                        />
                        {hasFeature(Feature.Benchmark) &&
                            emulator.benchmark && (
                                <Button
                                    text={"Benchmark"}
                                    image={require("../res/bolt.svg")}
                                    imageAlt="benchmark"
                                    style={["simple", "border", "padded"]}
                                    onClick={onBenchmarkClick}
                                />
                            )}
                        <Button
                            text={"Fullscreen"}
                            image={require("../res/maximise.svg")}
                            imageAlt="maximise"
                            style={["simple", "border", "padded"]}
                            onClick={onFullscreenClick}
                        />
                        {hasFeature(Feature.Keyboard) && (
                            <Button
                                text={"Keyboard"}
                                image={require("../res/dialpad.svg")}
                                imageAlt="keyboard"
                                enabled={keyboardVisible}
                                style={["simple", "border", "padded"]}
                                onClick={onKeyboardClick}
                            />
                        )}
                        <Button
                            text={"Information"}
                            image={require("../res/info.svg")}
                            imageAlt="information"
                            enabled={infoVisible}
                            style={["simple", "border", "padded"]}
                            onClick={onInformationClick}
                        />
                        {hasFeature(Feature.Help) && (
                            <Button
                                text={"Help"}
                                image={require("../res/help.svg")}
                                imageAlt="help"
                                style={["simple", "border", "padded"]}
                                onClick={onHelpClick}
                            />
                        )}
                        {hasFeature(Feature.Debug) && (
                            <Button
                                text={"Debug"}
                                image={require("../res/bug.svg")}
                                imageAlt="debug"
                                enabled={debugVisible}
                                style={["simple", "border", "padded"]}
                                onClick={onDebugClick}
                            />
                        )}
                        {hasFeature(Feature.Themes) && (
                            <Button
                                text={"Themes"}
                                image={require("../res/marker.svg")}
                                imageAlt="theme"
                                style={["simple", "border", "padded"]}
                                onClick={onThemeClick}
                            />
                        )}
                        {hasFeature(Feature.Palettes) &&
                            emulator.changePalette && (
                                <Button
                                    text={"Palette"}
                                    image={require("../res/brightness.svg")}
                                    imageAlt="palette"
                                    style={["simple", "border", "padded"]}
                                    onClick={onPaletteClick}
                                />
                            )}
                        <Button
                            text={"Load ROM"}
                            image={require("../res/upload.svg")}
                            imageAlt="upload"
                            file={true}
                            accept={emulator.romExts
                                .map((e) => `.${e}`)
                                .join(",")}
                            style={["simple", "border", "padded"]}
                            onFile={onUploadFile}
                        />
                        {emulator.sections.map((section) => (
                            <Button
                                key={section.name}
                                text={section.name}
                                image={section.icon}
                                enabled={visibleSections.includes(section.name)}
                                onClick={() => onSectionClick(section.name)}
                            />
                        ))}
                    </ButtonContainer>
                </Section>
            </PanelSplit>
        </div>
    );
};

export const startApp = (
    element: string,
    {
        emulator,
        fullscreen = false,
        debug = false,
        keyboard = false,
        palette,
        background,
        backgrounds
    }: {
        emulator: Emulator;
        fullscreen?: boolean;
        debug?: boolean;
        keyboard?: boolean;
        palette?: string;
        background?: string;
        backgrounds?: string[];
    }
) => {
    const elementRef = document.getElementById(element);
    if (!elementRef) return;

    const root = ReactDOM.createRoot(elementRef);
    root.render(
        <EmulatorApp
            emulator={emulator}
            fullscreen={fullscreen}
            debug={debug}
            keyboard={keyboard}
            palette={palette}
            background={background}
            backgrounds={backgrounds}
        />
    );
};

export default EmulatorApp;
