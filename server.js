const express = require('express');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(express.urlencoded({ extended: false }));

const OPENCLAW_URL = process.env.OPENCLAW_URL;
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;

const conversations = {};

app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body;
  const sender = req.body.From;

  if (!conversations[sender]) conversations[sender] = [];
  conversations[sender].push({ role: 'user', content: userMessage });

  try {
    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.1-codex',
        messages: conversations[sender]
      })
    });

    const rawText = await response.text();
    console.log('OpenClaw status:', response.status);
    console.log('OpenClaw response:', rawText);

    const data = JSON.parse(rawText);
    const reply = data.choices[0].message.content;

    conversations[sender].push({ role: 'assistant', content: reply });

    const twiml = new MessagingResponse();
    twiml.message(reply);
    res.type('text/xml').send(twiml.toString());

  } catch (err) {
    console.error(err);
    const twiml = new MessagingResponse();
    twiml.message('Something went wrong, please try again.');
    res.type('text/xml').send(twiml.toString());
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(process.env.PORT || 3000, () => console.log('Bridge running'));
