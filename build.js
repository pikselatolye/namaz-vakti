const fs = require('fs');
const https = require('https');

const API_URL = "https://api.aladhan.com/v1/timingsByCity?city=Ankara&country=Turkey&method=13";

console.log("🚀 Vakitler çekiliyor: " + API_URL);

const request = https.get(API_URL, { timeout: 10000 }, (res) => {
  let data = '';

  res.on('data', (chunk) => { data += chunk; });

  res.on('end', () => {
    try {
      if (!data || data.trim() === "") {
        throw new Error("API boş yanıt döndü.");
      }

      const json = JSON.parse(data);
      const timings = json.data.timings;
      const date = json.data.date;

      const output = {
        district: "ANKARA",
        source: "Aladhan API",
        generatedAt: new Date().toISOString(),
        today: {
          MiladiTarihUzun: date.readable,
          Imsak: timings.Fajr,
          Gunes: timings.Sunrise,
          Ogle: timings.Dhuhr,
          Ikindi: timings.Asr,
          Aksam: timings.Maghrib,
          Yatsi: timings.Isha
        }
      };

      fs.writeFileSync('vakit.json', JSON.stringify(output, null, 2));
      console.log('✅ vakit.json başarıyla güncellendi.');
    } catch (e) {
      handleError(e.message);
    }
  });
});

request.on("error", (err) => {
  handleError(err.message);
});

request.on("timeout", () => {
  request.destroy();
  handleError("Zaman aşımı (Timeout)");
});

function handleError(msg) {
  console.error("⚠️ Hata Oluştu:", msg);
  
  // Eğer dosya zaten varsa dokunma, yoksa boş bir şablon oluştur
  if (fs.existsSync('vakit.json')) {
    console.log("ℹ️ Mevcut vakit.json dosyası korunuyor, build devam ediyor...");
  } else {
    console.log("ℹ️ Yeni şablon vakit.json oluşturuluyor...");
    const template = {
      district: "ANKARA",
      source: "Hata Kaydı",
      generatedAt: new Date().toISOString(),
      today: {
        MiladiTarihUzun: "Veri Çekilemedi",
        Imsak: "00:00", Gunes: "00:00", Ogle: "00:00", Ikindi: "00:00", Aksam: "00:00", Yatsi: "00:00"
      }
    };
    fs.writeFileSync('vakit.json', JSON.stringify(template, null, 2));
  }
  // ÖNEMLİ: Hata olsa bile süreci durdurmuyoruz (exit 0)
  process.exit(0); 
}
