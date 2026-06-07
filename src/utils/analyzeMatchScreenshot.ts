export async function analyzeMatchScreenshot(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = async () => {
            try {
                URL.revokeObjectURL(img.src);
                
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const MAX_DIMENSION = 1200;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height = Math.round(height * (MAX_DIMENSION / width));
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width = Math.round(width * (MAX_DIMENSION / height));
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                     throw new Error("Canvas not supported");
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress image to keep payload size small
                const base64String = canvas.toDataURL("image/jpeg", 0.8);
                
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
                    const errorText = await response.text();
                    let parsedMessage = errorText;
                    try {
                        const parsedError = JSON.parse(errorText);
                        if (parsedError.error) parsedMessage = parsedError.error;
                    } catch (e) {
                        // Not JSON, just use raw text
                    }
                    throw new Error(`Server returned ${response.status}: ${parsedMessage}`);
                }

                const data = await response.json();
                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = () => reject(new Error("Failed to load image for compression"));
    });
}
