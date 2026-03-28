const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

// Templates directory (relative to project root, not /api/)
const TEMPLATES_DIR = path.join(process.cwd(), "templates");

// Score band thresholds from env vars (fallback to defaults)
const BAND_HIGH_MAX = parseFloat(process.env.BAND_HIGH_MAX || "35");
const BAND_MID_MAX = parseFloat(process.env.BAND_MID_MAX || "69");

function getBandTemplate(score) {
  if (score <= BAND_HIGH_MAX) return "High Risk.docx";
  if (score <= BAND_MID_MAX) return "At Risk.docx";
  return "Low Risk.docx";
}

function fillTemplate(filename, data) {
  const filePath = path.join(TEMPLATES_DIR, filename);
  const content = fs.readFileSync(filePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(data);
  const buf = doc.getZip().generate({ type: "nodebuffer" });
  return buf.toString("base64");
}

module.exports = async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional webhook secret check
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers["x-webhook-secret"];
    if (incoming !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const body = req.body || {};

  // Extract fields from payload
  const rawScore = body["Overall Score"] || body.overall_score || body.score || "0";
  const score = parseFloat(String(rawScore).replace("%", ""));

  if (isNaN(score)) {
    return res.status(400).json({ error: "Invalid score value", received: rawScore });
  }

  const templateData = {
    "Overall Score": String(rawScore),
    Policy: String(body["Policy"] || body.policy || ""),
    Leadership: String(body["Leadership"] || body.leadership || ""),
    Workplace: String(body["Workplace"] || body.workplace || ""),
    Education: String(body["Education"] || body.education || ""),
    Measurement: String(body["Measurement"] || body.measurement || ""),
  };

  let generalBase64, bandBase64, bandTemplateName;

  try {
    generalBase64 = fillTemplate("Category Scores.docx", templateData);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fill general template", detail: err.message });
  }

  try {
    bandTemplateName = getBandTemplate(score);
    bandBase64 = fillTemplate(bandTemplateName, templateData);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fill band template", detail: err.message });
  }

  return res.status(200).json({
    general: generalBase64,
    band: bandBase64,
    band_template: bandTemplateName,
    score_used: score,
  });
};
