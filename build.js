const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

function getJSONFollow(url, maxRedirects) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);

    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: {
          "User-Agent": "netlify-build",
          Accept: "application/json,text/plain,*/*",
        },
      },
      (res) => {
        const code = res.statusCode || 0;

        // Redirect takip et
        if ((code === 301 || code === 302 || code === 307 || code === 308) && res.headers.location) {
          if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
          const nextUrl = new URL(res.headers.location, u).toString();
          res.resume(); // socket'i boşalt
          return resolve(getJSONFollow(nextUrl, maxRedirects - 1));
        }

        if (code < 200 || code >= 300) {
          res.resume();
          return reject(new Error("HTTP " + code + " for " + url));
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (_e) {
            reject(new Error("JSON parse error"));
          }
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

function cleanHHMM(x) {
  return String(x || "").slice(0, 5);
}

async function main() {
  // dist klasörü garanti oluşsun
  const distDir = path.join(__dirname, "dist");
  fs.mkdirSync(distDir, { recursive: true });

  const url =
    "https://api.aladhan.com/v1/timingsByCity?city=Ankara&country=Turkey&method=13";

  const json = await getJSONFollow(url, 5);

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
