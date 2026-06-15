require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callGemini(prompt, pageContext, contextType) {

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let finalPrompt = prompt;

    // Logic: Nếu pageContext có dữ liệu, thêm system prompt
    if (pageContext && pageContext.trim() !== '' && contextType !== 'none') {
        const typeStr = contextType === 'selection' ? 'đoạn văn bản được bôi đen' : 'toàn bộ nội dung trang web';
        finalPrompt = `Dựa vào nội dung ${typeStr} sau đây:\n"""\n${pageContext}\n"""\n\nHãy trả lời câu hỏi: ${prompt}`;
    }

    const result = await model.generateContent(finalPrompt);
    return result.response.text();
}

app.post(['/api/chat', '/chat'], async (req, res) => {
    try {
        const prompt = req.body.prompt || req.body.question;
        const pageContext = req.body.pageContext || req.body.contextText;
        const contextType = req.body.contextType || 'none';

        if (!prompt) {
            return res.status(400).json({ error: 'Thiếu tham số prompt.' });
        }

        const answer = await callGemini(prompt, pageContext, contextType);

        // Trả kết quả JSON về cho client
        res.json({ answer: answer });
    } catch (error) {
        console.error("Lỗi từ Backend/Gemini:", error);
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend API đang chạy tại http://localhost:${port}`);
});
