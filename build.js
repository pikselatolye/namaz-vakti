const fs = require('fs');
const https = require('https');

// Ankara için güvenilir bir API endpoint
const API_URL = "https://api.aladhan.com/v1/timingsByCity?city=Ankara&country=Turkey&method=13";

console.log("Vakitler çekiliyor: " + API_URL);

https.get(API_URL, (res) => {
  let data = '';

  // Veri parçalarını topla
  res.on('data', (chunk) => { 
    data += chunk; 
  });

  // Veri alımı bittiğinde
  res.on('end', () => {
    try {
      if (!data || data.trim() === "") {
        throw new Error("API'den boş veri döndü!");
      }

      const json = JSON.parse(data);
      
      if (!json.data || !json.data.timings) {
        throw new Error("API yanıtı beklenen formatta değil!");
      }

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

      // Dosyayı yaz
      fs.writeFileSync('vakit.json', JSON.stringify(output, null, 2));
      console.log('✅ vakit.json başarıyla oluşturuldu.');
      
    } catch (e) {
      console.error('❌ JSON İşleme Hatası:', e.message);
      process.exit(1); // Netlify'a hata olduğunu bildir
    }
  });

}).on("error", (err) => {
  console.error("❌ Network Hatası: " + err.message);
  process.exit(1);
});
