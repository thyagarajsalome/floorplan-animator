import { GoogleGenAI } from '@google/genai';
import { useStore } from '../store/useStore';
import type { Room } from '../store/useStore';

export const useGeminiVision = () => {
  const { apiKey, setRooms, setStatus, addToast } = useStore();

  const analyzeImage = async (base64Image: string) => {
    if (!apiKey) {
      addToast('Please save your Gemini API key first.', 'error');
      return;
    }

    setStatus('analyzing');
    addToast('Analyzing floor plan with Gemini AI…', 'info');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = base64Image.split(',')[1];
      const mimeType = base64Image.startsWith('data:image/png') ? 'image/png'
                     : base64Image.startsWith('data:image/webp') ? 'image/webp'
                     : 'image/jpeg';

      const prompt = `
        You are an expert architectural AI analyzing a house floor plan image.
        Identify ALL rooms and spaces visible in the image.

        CRITICAL RULES:
        1. Exclude any pooja rooms, prayer rooms, or religious spaces.
        2. Return the position of each room as a bounding box using normalized coordinates (0.0 to 1.0)
           where (0,0) is the top-left corner and (1,1) is the bottom-right corner of the image.
        3. Format the boundingBox exactly as an array: [xmin, ymin, xmax, ymax].
        4. Assign each room a distinct, vibrant color hex code.
        5. Make sure the bounding boxes are accurate and do not overlap.

        Respond ONLY with a valid JSON object in this exact format, no markdown:
        {
          "rooms": [
            {
              "id": "unique-string-id",
              "label": "Master Bedroom",
              "boundingBox": [0.1, 0.05, 0.45, 0.35],
              "color": "#FF6B6B",
              "strokeWidth": 2,
              "fontSize": 14,
              "textColor": "#ffffff"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          { inlineData: { data: base64Data, mimeType } },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const resultText = response.text;
      if (!resultText) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(resultText);
      if (!parsed.rooms || !Array.isArray(parsed.rooms)) {
        throw new Error('Invalid response structure from Gemini');
      }

      setRooms(parsed.rooms as Room[]);
      setStatus('ready');
      addToast(`✓ Detected ${parsed.rooms.length} rooms successfully!`, 'success');
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      const msg = error?.message?.includes('API_KEY_INVALID')
        ? 'Invalid API key. Please check and re-enter your Gemini API key.'
        : error?.message?.includes('QUOTA_EXCEEDED')
          ? 'API quota exceeded. Try again later.'
          : `AI analysis failed: ${error?.message || 'Unknown error'}`;
      addToast(msg, 'error');
      setStatus('error');
    }
  };

  return { analyzeImage };
};