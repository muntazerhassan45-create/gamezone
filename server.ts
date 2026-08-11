import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'GameZone AR' });
  });

  // Serve Blogger Theme XML file download
  app.get('/GameZone_AR_Blogger_Theme.xml', (req, res) => {
    const xmlPath = path.join(process.cwd(), 'public', 'GameZone_AR_Blogger_Theme.xml');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="GameZone_AR_Blogger_Theme.xml"');
    res.sendFile(xmlPath);
  });

  app.get('/api/blogger-xml', (req, res) => {
    const xmlPath = path.join(process.cwd(), 'public', 'GameZone_AR_Blogger_Theme.xml');
    res.sendFile(xmlPath);
  });

  // AI Game Assistant API Route
  app.post('/api/ai/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        // Friendly fallback response when API key is default placeholder
        return res.json({
          reply: `أهلاً بك في GameZone AR! بناءً على سؤالك حول "${prompt}":
• ننصحك بتجربة **Elden Ring: Shadow of the Erdtree** (تقييم 9.5) إذا كنت تحب التحدي واستكشاف العوالم المفتوحة.
• أو **Black Myth: Wukong** (تقييم 9.2) لأسلوب القتال الملحمي والرسوميات الخرافية.
• ولعشاق الرياضة: **FC 25** تقدم نظام التكتيكات الجديد FC IQ وطور الخماسي Rush.

(ملاحظة: يمكنك ضبط GEMINI_API_KEY في لوحة الإعدادات للحصول على إجابات مباشرة مخصصة عبر ذكاء جميناي).`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `أنت مساعد GameZone AR الذكي، خبير ألعاب متمرس يتحدث اللغة العربية بأسلوب مشوق واحترافي. تقدم ترشيحات ألعاب دقيقة، ونصائح قتال، وإجابات حول مواصفات التشغيل والمراجعات. كن مختصراً ومباشراً في إجاباتك.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nسؤال المستخدم: ${prompt}` }] }
        ]
      });

      const reply = response.text || 'عذراً، لم أستطع تحليل الطلب حالياً. جرب سؤالاً آخر!';
      res.json({ reply });

    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.json({
        reply: `أهلاً بك! حالياً يمكنك الاطلاع على قائمة المراجعات الممتازة في الصفحة الرئيسية مثل **Elden Ring** و **Wukong** للحصول على إجابات فورية.`
      });
    }
  });

  // Vite development middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GameZone AR Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
