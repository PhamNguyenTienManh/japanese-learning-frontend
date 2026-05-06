const ASSESS_API_URL = "https://MinhNguyenMinj-voice-recognize.hf.space/assess";

export async function assessPronunciation(audioBlob, targetText) {
    const formData = new FormData();
    const fileName = `recording_${Date.now()}.webm`;
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });

    formData.append("file", audioFile);
    formData.append("target_text", targetText);

    const response = await fetch(ASSESS_API_URL, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to assess pronunciation: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
