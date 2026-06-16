const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// תמיכה בקבלת נתונים בפורמט URL-Encoded (כמו שימות המשיח שולחת ב-POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------------
// 1. נקודת קצה מותאמת עבור ה-API של ימות המשיח
// ---------------------------------------------------------
app.all('/yemot-api', (req, res) => {
    // הגדרת כותרת קריטית: טקסט נקי בלבד בקידוד עברית מותאם
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // שליפת נתונים שימות המשיח שולחת לנו אוטומטית ב-POST
    const phone = req.body.ApiPhone || req.query.ApiPhone || "לא ידוע";
    const userResponse = req.body.password || req.query.password; // המשתנה שהגדרנו ב-read

    console.log(`[API LOG] שיחה נכנסת ממספר: ${phone}`);

    // שלב א': המאזין רק נכנס לשלוחה, עדיין לא הקיש קוד
    if (!userResponse) {
        console.log(`[API LOG] מבקש קוד גישה מהמאזין`);
        
        // שימוש בפקודת read לפי 10 הפרמטרים המדויקים שלך.
        // שים לב: בטקסט ה-TTS אין נקודות או מקפים!
        const msg = "t-ברוך הבא למערכת כאן אחת עשרה אנא הקש את קוד הגישה שלך ולסיום הקש סולמית";
        const params = "password,no,Number,,,yes,yes,no,1,6";
        
        return res.send(`read=${msg}=${params}`);
    }

    // שלב ב': המאזין הקיש קוד, אנחנו בודקים אותו
    console.log(`[API LOG] המאזין הקיש את הקוד: ${userResponse}`);

    if (userResponse === "1234") {
        // הקוד נכון! משמיעים הודעת הצלחה ומעבירים לשלוחה 11 (השידור החי)
        // שים לב: חיבור פקודות באמצעות & ללא נקודות בטקסט
        return res.send("t-הקוד נקלט בהצלחה מעביר אותך לשידור החי&go_to_folder=/11");
    } else {
        // הקוד שגוי! משמיעים הודעה ומבקשים שוב (מנקים את המשתנה password כדי שישאל מחדש)
        const msgRetry = "t-קוד שגוי אנא נסה שנית והקש את הקוד הנכון";
        const paramsRetry = "password,no,Number,,,yes,yes,no,1,6";
        
        return res.send(`read=${msgRetry}=${paramsRetry}`);
    }
});

// ---------------------------------------------------------
// 2. נקודת קצה שמזרימה את השידור החי (ללא שינוי, עובדת פגז)
// ---------------------------------------------------------
app.get('/live', async (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const KAN_STREAM_URL = 'https://kanliveic.media.kan.org.il/kanbet_mp3';
    let streamResponse;

    try {
        streamResponse = await axios({
            method: 'get',
            url: KAN_STREAM_URL,
            responseType: 'stream',
            timeout: 15000
        });

        streamResponse.data.pipe(res);

        req.on('close', () => {
            console.log('[STREAM LOG] המאזין ניתק, סוגר חיבור מול כאן');
            if (streamResponse && streamResponse.data) {
                streamResponse.data.destroy();
            }
        });

        streamResponse.data.on('error', (streamErr) => {
            console.error('[STREAM ERROR] שגיאה בזרימת האודיו:', streamErr.message);
            res.end();
        });

    } catch (error) {
        console.error('[STREAM ERROR] לא מצליח למשוך את כאן:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Stream temporarily unavailable');
        }
    }
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Server is running smoothly on port ${PORT}`);
    console.log(`=========================================`);
});
