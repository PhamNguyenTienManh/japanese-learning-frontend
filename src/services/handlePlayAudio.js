const handlePlayAudio = (text) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    } else {
        alert(`Phát âm: ${text}`);
    }
};

export default handlePlayAudio;