const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client;

const getClient = () => {
  if (!client && accountSid && authToken) {
    client = twilio(accountSid, authToken);
  }
  return client;
};

const sendSMS = async (to, message) => {
  try {
    const twilioClient = getClient();

    if (!twilioClient) {
      console.log('[MOCK SMS] To:', to, 'Message:', message);
      return { success: true, mock: true, message: 'SMS sent (mock mode)' };
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

const sendWhatsApp = async (to, message) => {
  try {
    const twilioClient = getClient();

    if (!twilioClient) {
      console.log('[MOCK WHATSAPP] To:', to, 'Message:', message);
      return { success: true, mock: true, message: 'WhatsApp sent (mock mode)' };
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    throw new Error(`Failed to send WhatsApp: ${error.message}`);
  }
};

module.exports = { sendSMS, sendWhatsApp };
