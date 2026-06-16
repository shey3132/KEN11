const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// תמיכה מלאה בקבלת נתונים מימות המשיח ב-POST וב-GET
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// רשימת מספרי הטלפון המורשים להאזין לשידור (החלף במספרים האמיתיים שלך)
const ALLOWED_PHONES = ['0501234567', '0529876543', '0541112223'];

app.all('/yemot-api', (req, res) => {
    // חוק ברזל: תגובה בטקסט פשוט בלבד עבור ימות המשיח
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // שליפת נתונים מהבקשה של ימות המשיח
    const phone = req.body.ApiPhone || req.query.ApiPhone || "לא ידוע";
    const currentExtension = req.body.ApiExtension || req.query.ApiExtension || "2";

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] פנייה משלוחה: ${currentExtension}, מספר טלפון: ${phone}`);

    // -----------------------------------------------------------------
    // שלב א': המאזין נכנס לשלוחה 2 (שלוחת המוח / הכניסה הראשונית)
    // -----------------------------------------------------------------
    if (currentExtension === "2" || currentExtension === "/") {
        if (ALLOWED_PHONES.includes(phone)) {
            console.log(`[ACCESS GRANTED] מספר ${phone} מאושר. מעביר לשלוחה 3.`);
            return res.send("go_to_folder=/3");
        } else {
            console.log(`[ACCESS DENIED] מספר ${phone} חסום. מנתק.`);
            // TTS ללא נקודות או מקפים
            return res.send("t-אינך מורשה להאזין לשידור זה המערכת תתנתק כעת&hangup=yes");
        }
    }

    // -----------------------------------------------------------------
    // שלב ב': המאזין מנסה להיכנס לשלוחה 3 (נלכד ע"י הגנת check_api=yes)
    // -----------------------------------------------------------------
    if (currentExtension === "3") {
        if (ALLOWED_PHONES.includes(phone)) {
            console.log(`[CHECK_API - OK] מאשר כניסה לשידור עבור ${phone}`);
            return res.send("OK"); // אישור רשמי לימות המשיח לפתוח את הסטרים
        } else {
            console.log(`[CHECK_API - BREACH] ניסיון מעקף חסום עבור ${phone}. זורק לתפריט הראשי.`);
            return res.send("api_goto=/1"); // זריקה חזרה לשלוחה 1 (תפריט ראשי)
        }
    }

    // מגננת ברירת מחדל לכל מקרה לא צפוי
    return res.send("hangup=yes");
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Secure API Firewall running on port ${PORT}`);
    console.log(`=========================================`);
});
