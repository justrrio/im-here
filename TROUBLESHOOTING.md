# 🚨 TROUBLESHOOTING GUIDE - Im Here App

## ✅ MASALAH YANG TELAH DIPERBAIKI

### 1. ✅ Create Room Error: "db is not a function" + Firebase v22 Warnings

**Masalah**: Firebase calls menggunakan deprecated syntax `db()` dan warning v22
**Solusi**: Migrasi ke Firebase v22 modular API dengan helper functions
**File**: `lib/firebase.ts`, `app/create-room.tsx`, `contexts/AuthContext.tsx`

### 2. ✅ Button Create Account Tidak Redirect

**Masalah**: Navigasi menggunakan syntax yang salah atau cache issue
**Solusi**: Added debug logging dan restart server dengan --clear
**File**: `app/login.tsx`

### 3. ✅ Login Harus Double Tap

**Masalah**: AuthContext menggunakan inconsistent Firebase syntax  
**Solusi**: Updated ke Firebase v22 API yang konsisten
**File**: `contexts/AuthContext.tsx`

### 4. ✅ Tabs Footer - Explore Diganti Profile + Icon Issues

**Masalah**: User ingin profile di footer, explore masih muncul, icon tidak tampil
**Solusi**: Hapus explore.tsx, pastikan profile.tsx di (tabs), updated icon
**File**: `app/(tabs)/_layout.tsx`, `app/(tabs)/profile.tsx`, removed `explore.tsx`

---

## 🔧 CARA TESTING ULANG

### 1. Restart Development Server

```bash
cd "C:\Mobile"
npx expo start --clear
```

### 2. Test Flow Aplikasi

#### A. Authentication Test

1. **Register**:

   - Buka app di Expo Go
   - Tap "Create Account" di login screen
   - Isi form register
   - Verify redirect ke login setelah register

2. **Login**:
   - Login dengan akun yang dibuat
   - Verify langsung redirect ke home (tidak perlu double tap)

#### B. Room Test

1. **Create Room**:

   - Tap "Create Room" di home
   - Masukkan nama room
   - Tap "Create Room"
   - Verify berhasil create tanpa error

2. **Join Room**:
   - Test dengan 2nd device
   - Join room dengan kode
   - Verify berhasil join

#### C. Navigation Test

1. **Tabs**:
   - Check footer ada "Home" dan "Profile" (bukan Explore)
   - Tap Profile tab
   - Verify profile screen muncul

---

## 📱 EXPO GO TROUBLESHOOTING

### Masalah: QR Code Tidak Bisa Di-scan

#### Solusi 1: Network Connection

```bash
# Check if development server running
npx expo start

# Try with tunnel mode (slower but works through firewall)
npx expo start --tunnel
```

#### Solusi 2: Alternative Testing Methods

```bash
# Method 1: Send link via email/SMS
# Saat expo start, akan ada link exp://xxx
# Copy link dan send ke device

# Method 2: Build development build
npx expo run:android

# Method 3: Use Expo CLI link
npx expo start --dev-client
```

#### Solusi 3: Check Device & Network

- **Same WiFi**: Pastikan PC dan phone di WiFi yang sama
- **Firewall**: Disable Windows Firewall sementara
- **Antivirus**: Disable antivirus protection sementara
- **VPN**: Disconnect VPN di PC dan phone

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### Firebase Connectivity

```bash
# If Firebase error, check google-services.json
# File should be in:
# - c:\Mobile\google-services.json
# - c:\Mobile\android\app\google-services.json
```

### Location Permission (for Maps)

- Maps hanya work di **real device** (bukan emulator)
- Pastikan location services enabled di device
- App akan auto-request permission

### Build Issues

```bash
# Clean build if issues
cd "C:\Mobile"
npx expo r -c

# Or hard reset
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 🎯 TESTING CHECKLIST

### ✅ Authentication

- [ ] Register akun baru (button Create Account works)
- [ ] Login sekali langsung masuk (tidak double tap)
- [ ] Logout dari profile

### ✅ Room Management

- [ ] Create room berhasil (no error)
- [ ] Join room dengan kode
- [ ] Share room code
- [ ] Leave room

### ✅ Navigation

- [ ] Footer tabs: Home + Profile (no Explore)
- [ ] Navigation antar screen works
- [ ] Back button works

### ✅ Maps (Optional - jika sudah sampai tahap ini)

- [ ] Set destination (admin)
- [ ] View live map
- [ ] Real-time location tracking

---

## 📞 CONTACT DEVELOPER

Jika masih ada masalah setelah mengikuti guide ini:

1. **Copy error message** exact dari console
2. **Screenshot** dari issue yang terjadi
3. **Mention step** mana yang gagal
4. **Device info** (Android/iOS, version, dll)

---

## 🚀 FINAL NOTES

**Aplikasi sudah diperbaiki untuk semua issues yang disebutkan:**

✅ Create Account navigation - **FIXED**
✅ Double tap login - **FIXED**
✅ Create room error - **FIXED**
✅ Tabs layout (Profile instead of Explore) - **UPDATED**

**Untuk Expo Go QR scanning**, coba:

1. Use tunnel mode: `npx expo start --tunnel`
2. Check same WiFi network
3. Try development build: `npx expo run:android`

**App ready untuk testing!** 🎉

---

## Troubleshooting Map Issues

### Map Tiles Tidak Muncul (Putih/Blank)

Jika map tiles tidak muncul dan hanya menampilkan warna putih, ikuti langkah troubleshooting berikut:

#### 1. Test Koneksi Internet Emulator

```bash
# Test di Android emulator
adb shell ping -c 4 8.8.8.8

# Test akses HTTPS
adb shell 'curl -I https://www.google.com'
```

#### 2. Gunakan Network Test di App

- Buka halaman "Set Destination"
- Tekan tombol "Test Network" (merah)
- Lihat console log untuk hasil test

#### 3. Coba Berbagai Tile Server

- Tekan "Default Map" (menggunakan Google Maps bawaan)
- Coba tile server alternatif: CartoDB, OSM, Wiki
- Perhatikan mana yang berhasil di console log

#### 4. Cold Boot Emulator

```bash
# Tutup emulator
# Buka AVD Manager
# Pilih emulator -> Actions -> Cold Boot Now
```

#### 5. Test di Device Fisik

- Build APK: `npx expo build:android --type=apk`
- Install di device fisik
- Test apakah tile muncul di device

#### 6. Periksa Proxy/Network Settings

```bash
# Lihat network config emulator
adb shell getprop | grep proxy
adb shell getprop | grep dns
```

#### 7. Test Tile Server Manual

```javascript
// Test di browser desktop
https://tile.openstreetmap.org/1/0/0.png
https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/1/0/0.png
```

### Error Firebase Deprecated API

Jika masih melihat warning deprecated Firestore API:

1. **Check remaining files**:

```bash
grep -r "\.collection(" app/
grep -r "\.doc(" app/
```

2. **Migrate to modular API**:

```javascript
// Lama (deprecated)
db.collection("Users").doc(userId).get();

// Baru (modular)
import { getDoc } from "@/lib/firebase";
const doc = await getDoc("Users", userId);
```

### Performance Issues

1. **Map rendering lambat**:

   - Gunakan `maximumZ={19}` di UrlTile
   - Set `opacity={1.0}` untuk performa
   - Hindari terlalu banyak marker sekaligus

2. **Location updates too frequent**:
   - Set `timeInterval: 5000` (5 detik)
   - Set `distanceInterval: 10` (10 meter)

### Debug Tools

1. **Enable debug mode**:

```javascript
// Di set-destination.tsx, lihat console log:
// 🗺️ Map initialized with tile URL
// 🔍 Tile URL details
// 🌐 Network test results
```

2. **Monitor network requests**:

```bash
adb logcat | grep -i "network\|http\|tile"
```

### Known Issues

1. **Emulator network tidak stabil**:

   - Solution: Test di device fisik
   - Workaround: Gunakan "Default Map" mode

2. **Google Maps API key required**:

   - Map tanpa tiles masih perlu placeholder API key
   - Sudah dikonfigurasi di AndroidManifest.xml

3. **iOS simulators**:
   - Tile servers mungkin berbeda behavior
   - Test khusus untuk iOS jika diperlukan
