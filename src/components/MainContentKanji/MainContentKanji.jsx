import { useState, useEffect } from "react";
import HanziWriter from "../hanzi_writer/hanzi_writer";
import Contribution from "../contribution/contribution";

const MainContent = ({ selectedKanji }) => {
    const [kanjiData, setKanjiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedKanji) return;

        const fetchKanjiDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('https://mazii.net/api/search/kanji', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dict: 'javi',
                        type: 'kanji',
                        query: selectedKanji,
                        page: 1
                    })
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();

                if (data && data.results && data.results.length > 0) {
                    setKanjiData(data.results[0]);
                } else {
                    throw new Error('Không tìm thấy dữ liệu kanji');
                }
            } catch (err) {
                console.error('Error fetching kanji:', err);
                setError(err.message);
                setKanjiData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchKanjiDetail();
    }, [selectedKanji]);

    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                    <div style={{ color: '#666' }}>Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center', color: '#d32f2f' }}>
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>❌</div>
                    <div>Lỗi: {error}</div>
                </div>
            </div>
        );
    }

    if (!kanjiData) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center', color: '#999' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                    <div>Chọn một kanji để xem chi tiết</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, backgroundColor: '#fff', overflowY: 'auto', padding: '40px 32px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                <div style={{display: 'flex', flexDirection: "row", justifyContent:"space-between"}}>

                    {/* Header */}
                    <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
                            Chi tiết chữ kanji {kanjiData.kanji}
                        </h1>
                        <div style={{ fontSize: '14px', lineHeight: '2', color: '#555' }}>
                            <p>
                                <span style={{ color: '#666', display: 'inline-block', width: '100px' }}>Hán tự:</span>
                                <span style={{ fontWeight: '600', color: '#333' }}>{kanjiData.kanji} - {kanjiData.mean}</span>
                            </p>
                            <p>
                                <span style={{ color: '#666', display: 'inline-block', width: '100px' }}>Kunyomi:</span>
                                <span>{kanjiData.kun || 'N/A'}</span>
                            </p>
                            <p>
                                <span style={{ color: '#666', display: 'inline-block', width: '100px' }}>Onyomi:</span>
                                <span>{kanjiData.on || 'N/A'}</span>
                            </p>
                            <p>
                                <span style={{ color: '#666', display: 'inline-block', width: '100px' }}>Số nét:</span>
                                <span>{kanjiData.stroke_count}</span>
                            </p>
                            {kanjiData.level && kanjiData.level.length > 0 && (
                                <p>
                                    <span style={{ color: '#666', display: 'inline-block', width: '100px' }}>JLPT:</span>
                                    <span>{kanjiData.level.join(', ')}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Kanji Display */}
                    {/* <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', backgroundColor: '#fafafa', borderRadius: '12px', marginBottom: '32px', border: '2px solid #e0e0e0' }}>
                        <div style={{ fontSize: '160px', fontWeight: 'bold', color: '#1976d2', lineHeight: 1 }}>
                            {kanjiData.kanji}
                        </div>
                    </div> */}

                    <HanziWriter kanji={kanjiData.kanji}/>
                </div>

                {/* Meaning */}
                {kanjiData.detail && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '12px', borderLeft: '4px solid #1976d2', paddingLeft: '12px' }}>
                            Nghĩa
                        </h2>
                        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#555', backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
                            {kanjiData.detail.split('##').map((para, idx) => (
                                <p key={idx} style={{ marginBottom: idx < kanjiData.detail.split('##').length - 1 ? '12px' : '0' }}>
                                    {para.replace('$', '').trim()}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Examples */}
                {kanjiData.examples && kanjiData.examples.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '12px', borderLeft: '4px solid #1976d2', paddingLeft: '12px' }}>
                            Ví dụ ({kanjiData.examples.length})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {kanjiData.examples.slice(0, 10).map((ex, index) => (
                                <div key={index} style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #1976d2' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                        {ex.w} {ex.p && <span style={{ color: '#999', fontSize: '14px' }}>({ex.p.trim()})</span>}
                                    </div>
                                    {ex.h && <div style={{ fontSize: '13px', color: '#1976d2', marginBottom: '4px' }}>{ex.h}</div>}
                                    {ex.m && <div style={{ fontSize: '14px', color: '#666' }}>{ex.m}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Contribution kanjiId={kanjiData.mobileId} kanjiChar={kanjiData.kanji} />
        </div>
        
    );
};
export default MainContent;