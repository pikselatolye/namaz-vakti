const fs = require("fs");
const path = require("path");
const https = require("https");

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "netlify-build" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error("HTTP " + res.statusCode + " for " + url));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("JSON parse error"));
          }
        });
      })
      .on("error", reject);
  });
}

function cleanHHMM(x) {
  return String(x || "").slice(0, 5);
}

async function main() {
  // dist klasörü garanti oluşsun
  const distDir = path.join(__dirname, "dist");
  fs.mkdirSync(distDir, { recursive: true });

  // AlAdhan (Diyanet method=13)
  const url =
    "https://api.aladhan.com/v1/timingsByCity?city=Ankara&country=Turkey&method=13";

  const json = await getJSON(url);

  if (!json || json.code !== 200 || !json.data || !json.data.timings) {
    throw new Error("Bad response from AlAdhan");
  }

  const t = json.data.timings;

  const out = {
    provider: "aladhan",
    source: "https://api.aladhan.com",
    generatedAt: new Date().toISOString(),
    today: {
      MiladiTarihKisa: json.data.date && json.data.date.readable ? json.data.date.readable : "",
      Imsak: cleanHHMM(t.Fajr),
      Gunes: cleanHHMM(t.Sunrise),
      Ogle: cleanHHMM(t.Dhuhr),
      Ikindi: cleanHHMM(t.Asr),
      Aksam: cleanHHMM(t.Maghrib),
      Yatsi: cleanHHMM(t.Isha),
    },
  };

  fs.writeFileSync(path.join(distDir, "vakit.json"), JSON.stringify(out, null, 2), "utf8");
  fs.copyFileSync(path.join(__dirname, "index.html"), path.join(distDir, "index.html"));

  console.log("OK: dist/vakit.json generated");
}

main().catch((e) => {
  console.error("BUILD FAILED:", e && e.message ? e.message : e);
  process.exit(1);
});
