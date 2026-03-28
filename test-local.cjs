// Quick local test — simulates what Vercel would call
const handler = require("./api/webhook.js");

const mockReq = {
  method: "POST",
  headers: {},
  body: {
    "Overall Score": "72",
    "Policy": "80",
    "Leadership": "65",
    "Workplace": "75",
    "Education": "70",
    "Measurement": "68",
  },
};

const mockRes = {
  status(code) {
    this._code = code;
    return this;
  },
  json(data) {
    if (data.error) {
      console.error("ERROR:", data);
    } else {
      console.log("SUCCESS");
      console.log("  Score used:", data.score_used);
      console.log("  Band template:", data.band_template);
      console.log("  General base64 length:", data.general?.length || 0);
      console.log("  Band base64 length:", data.band?.length || 0);
    }
  },
};

handler(mockReq, mockRes).catch(console.error);
