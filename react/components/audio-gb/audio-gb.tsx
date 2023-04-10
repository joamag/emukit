import React, { FC, useEffect, useRef, useState } from "react";
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
import { PixelFormat } from "../../structs";
import Canvas, { CanvasStructure } from "../canvas/canvas";

import "./audio-gb.css";

type AudioGBProps = {
    getAudioOutput: () => Record<string, number>;
    interval?: number;
    drawInterval?: number;
    color?: number;
    style?: string[];
};

export const AudioGB: FC<AudioGBProps> = ({
    getAudioOutput,
    interval = 1,
    drawInterval = 30,
    color = 0x50cb93ff,
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
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [rendered, setRendered] = useState<boolean>(false);
        const classes = ["audio-wave", ...styles].join(" ");
        const build = () => {
            if (!canvasRef.current) return;

            if (rendered) { return; }

            const devicePixelRatio = window.devicePixelRatio || 1;
            canvasRef.current.width = canvasRef.current.clientWidth * devicePixelRatio;
            canvasRef.current.height = canvasRef.current.clientHeight * devicePixelRatio;

            const numX = canvasRef.current.width;
            const color = new ColorRGBA(
                Math.random(),
                Math.random(),
                Math.random(),
                1
            );
            const line = new WebglLine(color, numX);
            const wglp = new WebglPlot(canvasRef.current);

            line.arrangeX();
            wglp.addLine(line);

            setRendered(true);

                
            function update(): void {
                const freq = 0.001;
                const amp = 0.5;
                const noise = 0.1;
              
                for (let i = 0; i < line.numPoints; i++) {
                  const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
                  const yNoise = Math.random() - 0.5;
                  line.setY(i, ySin * amp + yNoise * noise);
                }
              }

            const drawWave = () => {
                const values = audioOutput[key];
                if (!values) {
                    return;
                }

                update();
                wglp.update();

                /*structure.canvasImage.data.fill(0);
                values.forEach((value, index) => {
                    const valueN = Math.min(value, 31);
                    const line = 31 - valueN;
                    const offset = (line * 128 + index) * PixelFormat.RGBA;
                    structure.canvasBuffer.setUint32(offset, color);
                });
                structure.canvasOffScreenContext.putImageData(
                    structure.canvasImage,
                    0,
                    0
                );
                structure.canvasContext.clearRect(0, 0, 128, 32);
                structure.canvasContext.drawImage(
                    structure.canvasOffScreen,
                    0,
                    0
                );*/
            };
            drawWave();
            intervalsExtraRef.current = setInterval(
                () => drawWave(),
                drawInterval
            );
        };
        setTimeout(() => build(), 1000);
        return (
            <div className={classes}>
                <h4>{name}</h4>
                <canvas ref={canvasRef} width={128} height={32} />
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
