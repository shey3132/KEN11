const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// רשימת מספרי הטלפון המורשים (המספר שלך כבר בפנים)
const ALLOWED_PHONES = ['0527673132', '0583207048'];

app.all('/yemot-api', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    const phone = req.body.ApiPhone || req.query.ApiPhone || "לא ידוע";
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] פנייה מהטלפון: ${phone}`);

    // בדיקת הרשאה פשוטה וחד-משמעית
    if (ALLOWED_PHONES.includes(phone)) {
        console.log(`[ACCESS GRANTED] מספר ${phone} מאושר. מעביר לשלוחה 3.`);
        return res.send("go_to_folder=/3");
    } else {
        console.log(`[ACCESS DENIED] מספר ${phone} חסום. מנתק את השיחה.`);
        return res.send("t-אינך מורשה להאזין לשידור זה המערכת תתנתק כעת&hangup=yes");
    }
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Lightweight API Gateway running on port ${PORT}`);
    console.log(`=========================================`);
});
