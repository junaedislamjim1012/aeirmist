# 📱 Native Android & iOS App Setup (Capacitor Integration)

Aeirmist এখন সম্পূর্ণভাবে **Cross-Platform Native (Android & iOS)** অ্যাপ হিসেবে প্রস্তুত করা হয়েছে! আপনার বিদ্যমান **Web App** এবং Firebase database (`aeirmist-d4dd8`) সম্পূর্ণ অক্ষুণ্ণ রেখে আপনি এখন Play Store এবং App Store-এ আপলোড করার জন্য Native App বিল্ড করতে পারবেন।

---

## 🚀 কিভাবে Native App বিল্ড এবং রান করবেন?

### ১. Web Build এবং Capacitor Sync:
প্রথমে প্রজেক্টের প্রোডাকশন বিল্ড তৈরি করে Capacitor-এর সাথে সিঙ্ক করুন:
```bash
npm run build:native
```

### ২. Android App ওপেন করুন (Android Studio-তে):
```bash
npm run cap:open:android
```
- এটি Android Studio ওপেন করবে।
- Android Studio থেকে আপনি **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** ক্লিক করে সরাসরি `.apk` বা `.aab` (Google Play Console-এর জন্য) ফাইল তৈরি করে Google Play Store-এ আপলোড করতে পারবেন।

### ৩. iOS App ওপেন করুন (Xcode-তে - Mac প্রয়োজন):
```bash
npm run cap:open:ios
```
- এটি Xcode ওপেন করবে।
- Xcode থেকে আপনার Apple Developer account দিয়ে Sign করে সরাসরি App Store-এ publish করতে পারবেন।

---

## ⚙️ Configuration Details:
- **App ID / Bundle ID**: `com.aeirmist.social`
- **Firebase Project**: `aeirmist-d4dd8` (Unchanged & fully working)
- **Web App**: `https://aeirmist.com` / GitHub Pages / Cloud Run (কোনো কিছু কাটা হয়নি, ওয়েব অ্যাপ আগের মতোই চলবে!)
