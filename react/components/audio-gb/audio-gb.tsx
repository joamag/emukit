import React, { FC, useEffect, useRef, useState } from "react";
import { PixelFormat } from "../../structs";
import Canvas, { CanvasStructure } from "../canvas/canvas";

import "./audio-gb.css";

type AudioGBProps = {
    getAudioOutput: () => Record<string, number>;
    interval?: number;
    drawInterval?: number;
    style?: string[];
};

export const AudioGB: FC<AudioGBProps> = ({
    getAudioOutput,
    interval = 1,
    drawInterval = 30,
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
                if (values.length > 128) {
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
        const classes = ["audio-wave", ...styles].join(" ");
        const onCanvas = (structure: CanvasStructure) => {
            const drawWave = () => {
                const values = audioOutput[key];
                if (!values) {
                    return;
                }
                structure.canvasImage.data.fill(0);
                values.forEach((value, index) => {
                    const valueN = Math.min(value, 31);
                    const line = 31 - valueN;
                    const offset = (line * 128 + index) * PixelFormat.RGBA;
                    structure.canvasBuffer.setUint32(offset, 0xffffffff);
                });
                structure.canvasContext.putImageData(
                    structure.canvasImage,
                    0,
                    0
                );
            };
            drawWave();
            intervalsExtraRef.current = setInterval(
                () => drawWave(),
                drawInterval
            );
        };
        return (
            <div className={classes}>
                <h4>{name}</h4>
                <Canvas width={128} height={32} onCanvas={onCanvas} />
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
