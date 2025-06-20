// utils/mediaUtils.js
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const configurationModel = require("../models/configurationModel");

const getMediaUrl = async (mediaId, phoneNumberId) => {
  const credentials = await configurationModel.findOne({ phoneNumberId });
  console.log("Database Credentials:", credentials);
  const token = credentials?.accessToken;
  console.log("Token:", token);

  const urlRes = await axios.get(`https://graph.facebook.com/v14.0/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const mediaUrl = urlRes.data.url;

  const mimeRes = await axios.head(mediaUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return { url: mediaUrl, mime_type: mimeRes.headers["content-type"], token };
};

const downloadMedia = async (url, mimeType, mediaId, phoneNumberId) => {
  const credentials = await configurationModel.findOne({ phoneNumberId });
  console.log("Database Credentials:", credentials);
  const token = credentials?.accessToken;
  console.log("Token:", token);
  const ext = mimeType.split("/")[1].split(";")[0];
  const fileName = `${mediaId}.${ext}`;
  const savePath = path.join(__dirname, `../uploads/${fileName}`);
  const writer = fs.createWriteStream(savePath);

  const response = await axios.get(url, {
    responseType: "stream",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(savePath));
    writer.on("error", reject);
  });
};

module.exports = {
  getMediaUrl,
  downloadMedia,
};
