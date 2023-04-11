import React, { FC, useEffect, useRef, useState } from "react";
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
import Canvas from "../canvas/canvas";

import "./audio-gb.css";

type AudioGBProps = {
    getAudioOutput: () => Record<string, number>;
    interval?: number;
    drawInterval?: number;
    color?: number;
    range?: number;
    rangeVolume?: number;
    style?: string[];
};

export const AudioGB: FC<AudioGBProps> = ({
    getAudioOutput,
    interval = 1,
    drawInterval = 10,
    color = 0x50cb93ff,
    range = 128,
    rangeVolume = 32,
    style = []
}) => {
    const classes = () => ["audio-gb", ...style].join(" ");
    const [audioOutput, setAudioOutput] = useState<Record<string, number[]>>(
        {}
    );
    const intervalsRef = useRef<number>();
    const intervalsExtraRef = useRef<number>();

    useEffect(() => {
        const updateAudioOutput = () => {
            const _audioOutput = getAudioOutput();
            for (const [key, value] of Object.entries(_audioOutput)) {
                const values = audioOutput[key] ?? [];
                values.push(value);
                if (values.length > range) {
                    values.shift();
                }
                audioOutput[key] = values;
            }
            setAudioOutput(audioOutput);
        };
        setInterval(() => updateAudioOutput(), interval);
        updateAudioOutput();
        return () => {
            if (intervalsRef.current) {
                clearInterval(intervalsRef.current);
            }
            if (intervalsExtraRef.current) {
                clearInterval(intervalsExtraRef.current);
            }
        };
    }, []);
    const renderAudioWave = (
        name: string,
        key: string,
        styles: string[] = []
    ) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const classes = ["audio-wave", ...styles].join(" ");
        useEffect(() => {
            if (!canvasRef.current) return;

            // converts the canvas to the expected size according
            // to the device pixel ratio value
            const devicePixelRatio = window.devicePixelRatio || 1;
            canvasRef.current.width =
                canvasRef.current.clientWidth * devicePixelRatio;
            canvasRef.current.height =
                canvasRef.current.clientHeight * devicePixelRatio;

            // creates the WGL Plot object with the canvas element
            // that is associated with the current audio wave
            const wglPlot = new WebglPlot(canvasRef.current);

            const color = new ColorRGBA(1, 1, 1, 1);
            const line = new WebglLine(color, range);

            line.arrangeX();
            wglPlot.addLine(line);

            const drawWave = () => {
                const values = audioOutput[key];
                if (!values) {
                    return;
                }

                values.forEach((value, index) => {
                    const valueN = Math.min(value, rangeVolume - 1);
                    line.setY(index, valueN / rangeVolume);
                });

                wglPlot.update();
            };
            drawWave();
            intervalsExtraRef.current = setInterval(
                () => drawWave(),
                drawInterval
            );
        }, [canvasRef]);
        return (
            <div className={classes}>
                <h4>{name}</h4>
                <Canvas
                    canvasRef={canvasRef}
                    width={range}
                    height={rangeVolume}
                    init={false}
                />
            </div>
        );
    };
    return (
        <div className={classes()}>
            <div className="section">
                {renderAudioWave("Master", "master")}
                {renderAudioWave("CH1", "ch1")}
                {renderAudioWave("CH2", "ch2")}
                {renderAudioWave("CH3", "ch3")}
                {renderAudioWave("CH4", "ch4")}
            </div>
        </div>
    );
};

export default AudioGB;
