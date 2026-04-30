const express = require('express');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(express.urlencoded({ extended: false }));

const OPENCLAW_URL = process.env.OPENCLAW_URL;
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;

app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body;
  const sender = req.body.From;
  const sessionId = sender.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    const response = await fetch(`${OPENCLAW_URL}/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({ message: userMessage })
    });

    const rawText = await response.text();
    console.log('OpenClaw status:', response.status);
    console.log('OpenClaw response:', rawText);

    const data = JSON.parse(rawText);
    const reply = data.response;

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
