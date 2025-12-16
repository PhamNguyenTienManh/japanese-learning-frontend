import { useState, useEffect, useRef } from "react";

const HanziWriter = ({ kanji }) => {
    const writerContainerRef = useRef(null);
    const writerInstanceRef = useRef(null);
    const [animationSpeed, setAnimationSpeed] = useState(1);
    const [showOutline, setShowOutline] = useState(true);
    const [showOrder, setShowOrder] = useState(false);
    const [strokeColor, setStrokeColor] = useState('#1976d2');
    const [isLoaded, setIsLoaded] = useState(false);
    const [size, setSize] = useState(240);

    // Load Hanzi Writer script
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

    // Initialize writer when kanji changes
    useEffect(() => {
        if (!kanji || !isLoaded || !writerContainerRef.current) {
            return;
        };

        // Clear previous writer
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
                    strokeColor: strokeColor,
                    radicalColor: '#ff9800',
                    outlineColor: '#ddd',
                    showOutline: showOutline,
                    showCharacter: false,
                    showStrokeOrder: showOrder,
                    strokeWidth: 6
                }
            );

            // Auto-animate after creation
            setTimeout(() => {
                try {
                    if (writerInstanceRef.current && writerInstanceRef.current.animateCharacter) {
                        writerInstanceRef.current.animateCharacter();
                    }
                } catch (err) {
                    // Không hiển thị lỗi auto-animate
                }
            }, 200);
        } catch (err) {
            // Không hiển thị lỗi khi API không trả về dữ liệu
        }

        return () => {
            if (writerContainerRef.current) {
                writerContainerRef.current.innerHTML = '';
            }
            writerInstanceRef.current = null;
        };
    }, [kanji, isLoaded, showOutline, showOrder, size]);

    // Update writer options when settings change
    useEffect(() => {
        if (writerInstanceRef.current && writerInstanceRef.current._options) {
            writerInstanceRef.current._options.strokeColor = strokeColor;
            writerInstanceRef.current._options.strokeAnimationSpeed = animationSpeed;
        }
    }, [strokeColor, animationSpeed]);

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
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                backgroundColor: '#fafafa',
                borderRadius: '12px',
                border: '2px solid #e0e0e0'
            }}>
                <div style={{ textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ fontSize: '14px' }}>Chưa có ký tự kanji</div>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                backgroundColor: '#fafafa',
                borderRadius: '12px',
                border: '2px solid #e0e0e0'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '14px' }}>Đang tải </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
            {/* Canvas Container */}
            <div
                ref={writerContainerRef}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                    backgroundColor: '#fafafa',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    minWidth: `${size + 40}px`,
                    minHeight: `${size + 40}px`
                }}
            />


            {/* Animation Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button

                    onClick={handleAnimateAll}
                    style={{
                        color: 'black',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: '600',
                        boxSizing: "border-box",
                        backgroundColor: "white",

                    }}
                >
                    ↻
                </button>


            </div>

        </div>
    );
};


export default HanziWriter;