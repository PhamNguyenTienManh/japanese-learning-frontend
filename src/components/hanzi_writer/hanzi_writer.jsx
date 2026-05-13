import { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import styles from "./hanzi_writer.module.scss";

const cx = classNames.bind(styles);

const HanziWriter = ({ kanji }) => {
    const writerContainerRef = useRef(null);
    const writerInstanceRef = useRef(null);
    const [animationSpeed] = useState(1);
    const [showOutline] = useState(true);
    const [showOrder] = useState(false);
    const [strokeColor] = useState('#00879a');
    const [isLoaded, setIsLoaded] = useState(false);
    const [size] = useState(240);

    useEffect(() => {
        if (window.HanziWriter) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => console.error('Failed to load Hanzi Writer');
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (!kanji || !isLoaded || !writerContainerRef.current) return;

        if (writerContainerRef.current) {
            writerContainerRef.current.innerHTML = '';
        }

        try {
            writerInstanceRef.current = window.HanziWriter.create(
                writerContainerRef.current,
                kanji,
                {
                    width: size,
                    height: size,
                    padding: 10,
                    strokeAnimationSpeed: animationSpeed,
                    delayBetweenStrokes: 200,
                    strokeColor,
                    radicalColor: '#fc5f00',
                    outlineColor: '#cdd4d4',
                    showOutline,
                    showCharacter: false,
                    showStrokeOrder: showOrder,
                    strokeWidth: 6,
                }
            );

            setTimeout(() => {
                try {
                    if (writerInstanceRef.current && writerInstanceRef.current.animateCharacter) {
                        writerInstanceRef.current.animateCharacter();
                    }
                } catch (err) {
                    // ignore auto-animate errors
                }
            }, 200);
        } catch (err) {
            // ignore creation errors when API has no data
        }

        return () => {
            if (writerContainerRef.current) {
                writerContainerRef.current.innerHTML = '';
            }
            writerInstanceRef.current = null;
        };
    }, [kanji, isLoaded, showOutline, showOrder, size, animationSpeed, strokeColor]);

    const handleAnimateAll = () => {
        if (writerInstanceRef.current) {
            try {
                writerInstanceRef.current._options.strokeAnimationSpeed = animationSpeed;
                writerInstanceRef.current.animateCharacter();
            } catch (err) {
                console.error('Animation error:', err);
            }
        }
    };

    if (!kanji) {
        return <div className={cx("empty")}>Chưa có ký tự</div>;
    }

    if (!isLoaded) {
        return <div className={cx("loading")}>Đang tải...</div>;
    }

    return (
        <div className={cx("wrap")}>
            <div ref={writerContainerRef} className={cx("canvas-frame")} />
            <button
                type="button"
                onClick={handleAnimateAll}
                className={cx("replay-btn")}
                title="Phát lại"
                aria-label="Phát lại"
            >
                ↻
            </button>
        </div>
    );
};

export default HanziWriter;
