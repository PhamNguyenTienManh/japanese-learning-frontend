const BASE_URL = process.env.REACT_APP_BASE_URL_API;

export async function uploadImage(file) {
    if (!file) throw new Error("File is required");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/upload/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to upload image: ${response.statusText}`);
    }

    const result = await response.json();
    return result?.data || result;
}
