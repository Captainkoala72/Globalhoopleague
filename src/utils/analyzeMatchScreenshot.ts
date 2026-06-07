export async function analyzeMatchScreenshot(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64String = reader.result as string;
                // e.g., "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                const matches = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                    throw new Error("Invalid image format");
                }
                const mimeType = matches[1];
                const imageBase64 = matches[2];

                const response = await fetch("/api/analyze-match-screenshot", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64, mimeType })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || "Failed to analyze image");
                }

                const data = await response.json();
                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (error) => reject(error);
    });
}
