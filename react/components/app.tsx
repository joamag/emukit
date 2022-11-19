import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

declare const require: any;

import {
    Button,
    ButtonContainer,
    ButtonIncrement,
    ButtonSwitch,
    ClearHandler,
    Display,
    DrawHandler,
    Footer,
    Help,
    Info,
    KeyboardChip8,
    KeyboardGB,
    Link,
    Modal,
    Overlay,
    Pair,
    PanelSplit,
    PanelTab,
    Paragraph,
    RegistersGB,
    Section,
    Tiles,
    Title,
    Toast
} from "./components";
import {
    Emulator,
    Feature,
    FREQUENCY_DELTA,
    PixelFormat,
    RomInfo
} from "./structs";

import "./app.css";

type EmulatorAppProps = {
    emulator: Emulator;
    fullscreen?: boolean;
    debug?: boolean;
    keyboard?: boolean;
    palette?: string;
    backgrounds?: string[];
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
    backgrounds = ["264653"]
}) => {
    const [paused, setPaused] = useState(false);
    const [fullscreenState, setFullscreenState] = useState(fullscreen);
    const [backgroundIndex, setBackgroundIndex] = useState(0);
    const [romInfo, setRomInfo] = useState<RomInfo>({});
    const [framerate, setFramerate] = useState(0);
    const [paletteName, setPaletteName] = useState(emulator.palette);
    const [keyaction, setKeyaction] = useState<string>();
    const [modalTitle, setModalTitle] = useState<string>();
    const [modalText, setModalText] = useState<string>();
    const [modalContents, setModalContents] = useState<ReactNode>();
    const [modalVisible, setModalVisible] = useState(false);
    const [toastText, setToastText] = useState<string>();
    const [toastError, setToastError] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(
        isTouchDevice() || keyboard
    );
    const [infoVisible, setInfoVisible] = useState(true);
    const [debugVisible, setDebugVisible] = useState(debug);

    const toastCounterRef = useRef(0);
    const frameRef = useRef<boolean>(false);
    const errorRef = useRef<boolean>(false);
    const modalCallbackRef =
        useRef<(value: boolean | PromiseLike<boolean>) => void>();

    useEffect(() => {
        document.body.style.backgroundColor = `#${getBackground()}`;
    }, [backgroundIndex]);
    useEffect(() => {
        switch (keyaction) {
            case "Plus":
                emulator.frequency +=
                    emulator.frequencyDelta ?? FREQUENCY_DELTA;
                setKeyaction(undefined);
                break;
            case "Minus":
                emulator.frequency -=
                    emulator.frequencyDelta ?? FREQUENCY_DELTA;
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
            case "Accelerate":
                emulator.frequency *= 8;
                break;
            case "Slowdown":
                emulator.frequency /= 8;
                break;
        }
    }, [keyaction]);
    useEffect(() => {
        if (palette) {
            emulator.palette = palette;
        }
        const onFullChange = (event: Event) => {
            if (
                !document.fullscreenElement &&
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
            }
        };
        const onBooted = () => {
            setRomInfo(emulator.romInfo);
            setPaused(false);
        };
        const onMessage = (
            emulator: Emulator,
            params: Record<string, any> = {}
        ) => {
            showToast(params.text, params.error, params.timeout);
        };
        document.addEventListener("fullscreenchange", onFullChange);
        document.addEventListener("webkitfullscreenchange", onFullChange);
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        emulator.bind("booted", onBooted);
        emulator.bind("message", onMessage);
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

    const getPauseText = () => (paused ? "Resume" : "Pause");
    const getPauseIcon = () =>
        paused ? require("../res/play.svg") : require("../res/pause.svg");
    const getBackground = () => backgrounds[backgroundIndex];

    const showModal = async (
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
    };
    const showHelp = async (title = "Help") => {
        await showModal(title, undefined, <Help />);
    };
    const showToast = async (text: string, error = false, timeout = 3500) => {
        setToastText(text);
        setToastError(error);
        setToastVisible(true);
        toastCounterRef.current++;
        const counter = toastCounterRef.current;
        await new Promise((resolve) => {
            setTimeout(() => {
                if (counter !== toastCounterRef.current) return;
                setToastVisible(false);
                resolve(true);
            }, timeout);
        });
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

        const arrayBuffer = await file.arrayBuffer();
        const romData = new Uint8Array(arrayBuffer);

        emulator.boot({ engine: null, romName: file.name, romData: romData });

        showToast(`Loaded ${file.name} ROM successfully!`);
    };
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
    const onToastCancel = () => {
        setToastVisible(false);
    };
    const onPauseClick = () => {
        emulator.toggleRunning();
        setPaused(!paused);
    };
    const onResetClick = () => {
        emulator.reset();
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
        const palette = emulator.changePalette?.();
        setPaletteName(palette);
    };
    const onUploadFile = async (file: File) => {
        const arrayBuffer = await file.arrayBuffer();
        const romData = new Uint8Array(arrayBuffer);
        emulator.boot({ engine: null, romName: file.name, romData: romData });
        showToast(`Loaded ${file.name} ROM successfully!`);
    };
    const onEngineChange = (engine: string) => {
        emulator.boot({ engine: engine.toLowerCase() });
        showToast(
            `${emulator.device.text} running in engine "${engine}" from now on!`
        );
    };
    const onFrequencyChange = (value: number) => {
        emulator.frequency = value * 1000 * 1000;
    };
    const onFrequencyReady = (handler: (value: number) => void) => {
        emulator.bind("frequency", (emulator: Emulator, frequency: number) => {
            handler(frequency / 1000000);
        });
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
    const onGamepad = (id: string, isValid: boolean, connected = true) => {
        if (connected) {
            if (isValid) showToast(`🕹️ Gamepad connect ${id}`);
            else showToast(`😥 Unsupported gamepad connect ${id}`, true);
        } else if (isValid) {
            showToast(`🕹️ Gamepad disconnected ${id}`, true);
        }
    };
    const onDrawHandler = (handler: DrawHandler) => {
        if (frameRef.current) return;
        frameRef.current = true;
        emulator.bind("frame", () => {
            handler(emulator.imageBuffer, PixelFormat.RGB);
            setFramerate(emulator.framerate);
        });
    };
    const onClearHandler = (handler: ClearHandler) => {
        if (errorRef.current) return;
        errorRef.current = true;
        emulator.bind("error", async () => {
            await handler(undefined, require("../res/storm.png"), 0.2);
        });
    };

    return (
        <div className="app">
            <Overlay text={"Drag to load ROM"} onFile={onFile} />
            <Modal
                title={modalTitle}
                text={modalText}
                contents={modalContents}
                visible={modalVisible}
                onConfirm={onModalConfirm}
                onCancel={onModalCancel}
            />
            <Toast
                text={toastText}
                error={toastError}
                visible={toastVisible}
                onCancel={onToastCancel}
            />
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
                            fullscreen={fullscreenState}
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
                    iconSrc={require("../res/thunder.png")}
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
                        <Link href="https://webassembly.org/" target="_blank">
                            WebAssembly
                        </Link>
                        .
                    </Paragraph>
                    {emulator.repository && (
                        <Paragraph>
                            You can check the source code of it at{" "}
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
                        <div
                            style={{
                                display: "inline-block",
                                verticalAlign: "top",
                                marginRight: 32,
                                width: 256
                            }}
                        >
                            <h3>VRAM Tiles</h3>
                            <Tiles
                                getTile={(index) => emulator.getTile(index)}
                                tileCount={384}
                                width={"100%"}
                                contentBox={false}
                            />
                        </div>
                        <div
                            style={{
                                display: "inline-block",
                                verticalAlign: "top"
                            }}
                        >
                            <h3>Registers</h3>
                            <RegistersGB
                                getRegisters={() => emulator.registers}
                            />
                        </div>
                    </Section>
                )}
                {infoVisible && (
                    <Section>
                        <PanelTab
                            tabs={[
                                <Info>
                                    <Pair
                                        key="button-engine"
                                        name={"Engine"}
                                        valueNode={
                                            <ButtonSwitch
                                                options={emulator.engines.map(
                                                    (e) => e.toUpperCase()
                                                )}
                                                size={"large"}
                                                style={["simple"]}
                                                onChange={onEngineChange}
                                            />
                                        }
                                    />
                                    <Pair
                                        key="rom"
                                        name={"ROM"}
                                        value={romInfo.name ?? "-"}
                                    />
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
                                                value={
                                                    emulator.frequency /
                                                    1000 /
                                                    1000
                                                }
                                                delta={
                                                    (emulator.frequencyDelta ??
                                                        FREQUENCY_DELTA) /
                                                    1000 /
                                                    1000
                                                }
                                                min={0}
                                                suffix={"MHz"}
                                                decimalPlaces={2}
                                                onChange={onFrequencyChange}
                                                onReady={onFrequencyReady}
                                            />
                                        }
                                    />
                                    <Pair
                                        key="rom-type"
                                        name={"ROM Type"}
                                        value={
                                            romInfo.extra?.romType
                                                ? `${romInfo.extra?.romType}`
                                                : "-"
                                        }
                                    />
                                    <Pair
                                        key="framerate"
                                        name={"Framerate"}
                                        value={`${framerate} fps`}
                                    />
                                </Info>,
                                <Info>
                                    <Pair
                                        key="palette"
                                        name={"Palette"}
                                        value={paletteName}
                                    />
                                </Info>
                            ]}
                            tabNames={["General", "Detailed"]}
                            selectors={true}
                        />
                    </Section>
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
                        {hasFeature(Feature.Benchmark) && (
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
                        <Button
                            text={"Help"}
                            image={require("../res/help.svg")}
                            imageAlt="help"
                            style={["simple", "border", "padded"]}
                            onClick={onHelpClick}
                        />
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
                        <Button
                            text={"Theme"}
                            image={require("../res/marker.svg")}
                            imageAlt="theme"
                            style={["simple", "border", "padded"]}
                            onClick={onThemeClick}
                        />
                        {hasFeature(Feature.Palettes) && (
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
                            accept={".gb"}
                            style={["simple", "border", "padded"]}
                            onFile={onUploadFile}
                        />
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
        backgrounds = []
    }: {
        emulator: Emulator;
        fullscreen?: boolean;
        debug?: boolean;
        keyboard?: boolean;
        palette?: string;
        backgrounds: string[];
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
            backgrounds={backgrounds}
        />
    );
};

export default EmulatorApp;
