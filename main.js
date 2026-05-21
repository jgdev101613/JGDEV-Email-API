import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import keepAliveCron from "./cron";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Airtable contact backend is running.",
  });
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    if (!process.env.AIRTABLE_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Missing AIRTABLE_TOKEN in .env.",
      });
    }

    if (!process.env.AIRTABLE_BASE_ID) {
      return res.status(500).json({
        success: false,
        message: "Missing AIRTABLE_BASE_ID in .env.",
      });
    }

    if (!process.env.AIRTABLE_TABLE_ID) {
      return res.status(500).json({
        success: false,
        message: "Missing AIRTABLE_TABLE_ID in .env.",
      });
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`;

    const airtableResponse = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name.trim(),
          Email: email.trim(),
          Subject: subject?.trim() || "",
          Message: message.trim(),
          "Created On": new Date().toISOString().split("T")[0],
        },
      }),
    });

    const airtableData = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error("Airtable Error:", airtableData);

      return res.status(airtableResponse.status).json({
        success: false,
        message: "Failed to insert data into Airtable.",
        error: airtableData,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message saved to Airtable successfully.",
      data: airtableData,
    });
  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);

  keepAliveCron.start();
});
