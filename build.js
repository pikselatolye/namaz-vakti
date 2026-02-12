const fs = require('fs');
const https = require('https');

// Örnek bir API üzerinden Ankara vakitlerini çekiyoruz
// Not: Gerçek projelerde Diyanet'in resmi verisini sağlayan API'ler tercih edilir.
const API_URL = "https://api.aladhan.com/v1/timingsByCity?city=Ankara&country=Turkey&method=13";

https.get(API_URL, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const timings = json.data.timings;
    const date = json.data.date;

    const output = {
      district: "ANKARA",
      source: "Aladhan API",
      updatedAt: new Date().toISOString(),
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
    console.log('vakit.json başarıyla güncellendi!');
  });
}).on("error", (err) => {
  console.log("Hata: " + err.message);
});
