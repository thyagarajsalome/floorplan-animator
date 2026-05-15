import { GoogleGenAI } from '@google/genai';
import { useStore, Room } from '../store/useStore';

export const useGeminiVision = () => {
  const { apiKey, setRooms, setStatus } = useStore();

  const analyzeImage = async (base64Image: string) => {
    if (!apiKey) {
      alert("Please save your Gemini API key first.");
      return;
    }

    setStatus('analyzing');

    try {
      // Initialize the official Google Gen AI SDK
      const ai = new GoogleGenAI({ apiKey: apiKey });

      // Strip the data URL prefix for the API
      const base64Data = base64Image.split(',')[1];

      const prompt = `
        You are an expert architectural AI analyzing a 9:16 house floor plan.
        Identify ALL rooms and spaces visible.
        
        CRITICAL RULES:
        1. Strictly exclude any pooja rooms or religious spaces. Do not list them.
        2. Return the position of each room as a bounding box using normalized coordinates (0.0 to 1.0) where (0,0) is top-left and (1,1) is bottom-right.
        3. Format the boundingBox exactly as an array: [xmin, ymin, xmax, ymax].

        Respond ONLY with a valid JSON object in this exact format:
        {
          "rooms": [
            {
              "id": "unique-string",
              "label": "Master Bedroom",
              "boundingBox": [0.1, 0.05, 0.45, 0.35],
              "color": "#FF6B6B"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: [
          prompt,
          { inlineData: { data: base64Data, mimeType: 'image/png' } }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsed = JSON.parse(resultText);
        setRooms(parsed.rooms as Room[]);
        setStatus('ready');
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      alert("Failed to analyze image. Check console for details.");
      setStatus('idle');
    }
  };

  return { analyzeImage };
};