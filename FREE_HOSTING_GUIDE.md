# 🌐 DigitalLab - 100% Free Production Hosting & Code Security Guide
*(फ्री में होस्टिंग, डेटाबेस, यूजरनेम/पासवर्ड और कोड सिक्योरिटी का पूरा तरीका)*

---

## 🔒 1. कोड सिक्योरिटी: "कोई और मेरा कोड न देख सके और न चुरा सके"

आपके कोड को पूरी तरह सुरक्षित रखने के लिए 2 मुख्य सुरक्षा उपाय हैं:

### Step 1: GitHub Repository को Private करना
अगर आपका GitHub रिपॉजिटरी अभी Public है, तो कोई भी कोड देख सकता है। इसे तुरंत **Private** कर लें:
1. अपने GitHub में जाएँ: [https://github.com/Manish088/DigitalLab](https://github.com/Manish088/DigitalLab)
2. ऊपर **Settings** टैब पर क्लिक करें।
3. बिल्कुल नीचे **Danger Zone** में जाएँ।
4. **Change repository visibility** पर क्लिक करें।
5. **Change to private** चुनें और कन्फर्म करें।
> **परिणाम:** अब इंटरनेट पर केवल आपके पास ही कोड का एक्सेस होगा। कोई और आपका कोड क्लोन या डाउनलोड नहीं कर सकेगा।

### Step 2: सर्वर पर केवल Compiled Binaries अपलोड होती हैं
सर्वर पर आपकी ओरिजिनल `.cs` (C#) या `.ts` (TypeScript) फाइलें अपलोड नहीं होतीं। सिर्फ कम्पाइल की गई `.dll` और मिनिफाइड `.js` फाइलें जाती हैं, जिससे आपका ओरिजिनल सोर्स कोड सुरक्षित रहता है।

---

## 🏆 2. सबसे बेस्ट और 100% Free होस्टिंग: MonsterASP.NET

ASP.NET Core (.NET 10/9) + Microsoft SQL Server + Angular के लिए **MonsterASP.NET** दुनिया भर में नंबर-1 फ्री होस्टिंग है:
- **100% फ्री प्लान** (कोई क्रेडिट कार्ड नहीं चाहिए)
- **कंट्रोल पैनल:** यूजरनेम और पासवर्ड मिलता है
- **Microsoft SQL Server:** अलग से फ्री MSSQL डेटाबेस + यूजरनेम + पासवर्ड मिलता है
- **फाइल मैनेजर / FTP:** फाइल अपलोड करने के लिए अलग यूजरनेम और पासवर्ड मिलता है
- **फ्री सबडोमेन:** `yourlab.monsterasp.net`

---

## 📋 3. Step-by-Step होस्ट करने की प्रक्रिया

### चरण 1: GitHub से या अपने कंप्यूटर से रेडी-टू-होस्ट पैकेज तैयार करना
हमने आपके प्रोजेक्ट में ऑटोमेटेड बिल्डर तैयार कर दिया है:
1. अपने कंप्यूटर पर `D:\Antigravity\Lab` फोल्डर में मौजूद **`publish_production.bat`** पर डबल क्लिक करके रन करें।
2. यह 2 मिनट में अपने आप:
   - Angular Frontend को प्रोडक्शन मोड में बिल्ड करेगा।
   - ASP.NET Core Backend को Release मोड में पब्लिश करेगा।
   - दोनों को एक साथ मिलाकर `digitlab_production_package.zip` फाइल बना देगा।
*(या GitHub Actions टैब में जाकर `Build & Package Full-Stack Production Artifacts` से भी जिप फाइल डाउनलोड कर सकते हैं)*

---

### चरण 2: MonsterASP.NET पर फ्री अकाउंट बनाना
1. ब्राउज़र में [https://www.monsterasp.net](https://www.monsterasp.net) खोलें।
2. **Register Free Account** पर क्लिक करें।
3. अपनी ईमेल और पासवर्ड डालें।
4. अकाउंट बनने के बाद आपको **Hosting Control Panel का Username और Password** मिल जाएगा।

---

### चरण 3: फ्री MS SQL Server Database बनाना
1. MonsterASP.NET के कंट्रोल पैनल में **Databases** मेन्यू पर क्लिक करें।
2. **Create Database** -> **MS SQL** चुनें।
3. डेटाबेस का नाम रखें: उदा. `LabLimsDb`.
4. आपको तुरंत स्क्रीन पर मिलेगा:
   - **SQL Server Host/Server Name:** (उदा. `mssqlXX.monsterasp.net`)
   - **Database Name:** (उदा. `u12345_LabLimsDb`)
   - **Database Username:** (उदा. `u12345`)
   - **Database Password:** (जो आपने सेट किया)
5. **SQL Query Editor** या **Web Admin** पर क्लिक करें, और अपने प्रोजेक्ट के `database/schema.sql` का पूरा कोड पेस्ट करके **Execute / Run** दबा दें।
   *(इससे आपकी सारी टेबल्स सेकंड्स में बन जाएँगी)*

---

### चरण 4: वेबसाइट फाइल्स अपलोड करना
1. MonsterASP.NET कंट्रोल पैनल में **Websites** -> **File Manager** पर क्लिक करें।
2. `site/wwwroot/` फोल्डर में जाएँ।
3. `digitlab_production_package.zip` को अपलोड करके **Extract / Unzip** कर दें।
4. `appsettings.json` फाइल को खोलें (Edit करें) और अपनी नई SQL Server Connection String डाल दें:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=mssqlXX.monsterasp.net;Database=u12345_LabLimsDb;User Id=u12345;Password=YourDbPassword;TrustServerCertificate=True;MultipleActiveResultSets=true;"
}
```
5. **Save** करें।

---

### चरण 5: वेबसाइट लाइव टेस्ट करना!
1. आपको मिला हुआ फ्री डोमेन खोलें (उदा. `https://yourlab.monsterasp.net`).
2. वेबसाइट खुलते ही सबसे पहले **Launch Page** आएगा।
3. कोड `8866` दर्ज करें -> पटाखे फूटेंगे -> वेबसाइट मुख्य पेज पर फूलों की बारिश के साथ लाइव हो जाएगी!
4. **SuperAdmin Login**:
   - **Email:** `admin@digitlab.com`
   - **Password:** `Pass@12345`

---

## 🔑 आपके सभी क्रेडेंशियल्स की समरी चेकलिस्ट

| सेवा / टूल | क्रेडेंशियल टाइप | डिफ़ॉल्ट / कहाँ मिलेगा |
| :--- | :--- | :--- |
| **GitHub Repo** | Private Visibility | GitHub Settings -> Danger Zone |
| **Hosting Panel** | Username & Password | MonsterASP.NET साइन अप पर |
| **SQL Database** | Server, DB Name, User, Pwd | MonsterASP.NET Databases सेक्शन में |
| **FTP / File Manager** | Host, User, Pwd | MonsterASP.NET FTP Accounts में |
| **Website Launch Code** | Secret PIN | `8866` |
| **SuperAdmin Login** | Email & Password | `admin@digitlab.com` / `Pass@12345` |
