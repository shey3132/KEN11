const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// תמיכה בקבלת נתונים מימות המשיח (במידה ותשלח נתונים ב-POST/GET)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------------
// 1. נקודת קצה עבור ה-API של ימות המשיח
// ---------------------------------------------------------
app.all('/yemot-api', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] API Request received from Yemot`);
    
    // מעביר אוטומטית את המחייג לשלוחה 11 שבה נמצא הסטרים
    res.send("go_to_folder=/11");
});

// ---------------------------------------------------------
// 2. נקודת קצה להזרמת השידור החי (Audio Stream Proxy)
// ---------------------------------------------------------
app.get('/live', async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] New listener connected to the live stream`);

    // הגדרת כותרות קבועות להזרמת שמע שלא נגמר (Chunked Audio)
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // הלינק הישיר והיציב לסטרים של כאן ב'
    const KAN_STREAM_URL = 'https://kanliveic.media.kan.org.il/kanbet_mp3';
    let streamResponse;

    try {
        // התחברות למקור השידור של כאן
        streamResponse = await axios({
            method: 'get',
            url: KAN_STREAM_URL,
            responseType: 'stream',
            timeout: 15000 // גבול של 15 שניות להתחברות ראשונית
        });

        // הזרמת הנתונים (Pipe) ישירות מהשרת של כאן אל המתקשר בימות המשיח
        streamResponse.data.pipe(res);

        // טיפול במקרה של ניתוק השיחה מצד המתקשר
        req.on('close', () => {
            const closeTimestamp = new Date().toISOString();
            console.log(`[${closeTimestamp}] Listener disconnected. Closing stream.`);
            if (streamResponse && streamResponse.data) {
                streamResponse.data.destroy(); // סגירת החיבור מול כאן כדי לחסוך במשאבים
            }
        });

        // טיפול בשגיאה בתוך זרם הנתונים עצמו
        streamResponse.data.on('error', (streamErr) => {
            console.error('Error within the audio stream data:', streamErr.message);
            res.end();
        });

    } catch (error) {
        console.error('Failed to proxy KAN stream:', error.message);
        // אם השגיאה קרתה לפני שנשלחו כותרות בהצלחה, נחזיר שגיאת שרת
        if (!res.headersSent) {
            res.status(500).send('Stream temporarily unavailable');
        }
    }
});

// ---------------------------------------------------------
// הפעלת השרת
// ---------------------------------------------------------
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Server is running smoothly on port ${PORT}`);
    console.log(`=========================================`);
});
