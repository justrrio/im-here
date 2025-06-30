# 🇮🇩 Cara Set Lokasi Indonesia di Emulator Android

Untuk mengatasi masalah lokasi yang salah (North America) di emulator, ikuti langkah-langkah berikut:

## Method 1: Extended Controls (Recommended)

1. **Buka Android Emulator**
2. **Klik tombol "..." (More)** di side panel emulator
3. **Pilih "Location"** dari menu Extended Controls
4. **Set koordinat Indonesia:**
   - **Jakarta**: Latitude `-6.2088`, Longitude `106.8456`
   - **Bandung**: Latitude `-6.9175`, Longitude `107.6191`
   - **Surabaya**: Latitude `-7.2575`, Longitude `112.7521`
   - **Yogyakarta**: Latitude `-7.7956`, Longitude `110.3695`
5. **Klik "Send"** untuk apply lokasi
6. **Restart aplikasi Im Here** untuk refresh location

## Method 2: Command Line (ADB)

```bash
# Jakarta
adb emu geo fix 106.8456 -6.2088

# Bandung
adb emu geo fix 107.6191 -6.9175

# Surabaya
adb emu geo fix 112.7521 -7.2575
```

## Method 3: Google Maps di Emulator

1. Buka **Google Maps** di emulator
2. Search lokasi di Indonesia (misal: "Jakarta")
3. **Klik "Set Location"** atau pin lokasi
4. Buka kembali aplikasi **Im Here**

## Verifikasi Lokasi

Setelah set lokasi:

1. **Cek di aplikasi Im Here** - lokasi harus sudah benar
2. **Check console logs** - akan terlihat log koordinat yang benar
3. **Test live map** - marker "YOU" harus di Indonesia

## Troubleshooting

### Jika masih salah lokasi:

1. **Restart emulator** setelah set lokasi
2. **Clear app data** Im Here di emulator
3. **Reinstall aplikasi** jika perlu
4. **Pastikan GPS enabled** di emulator settings

### Jika aplikasi tidak minta permission lokasi:

1. Go to **Settings > Apps > Im Here > Permissions**
2. Enable **Location** permission
3. Set ke **"Allow all the time"** atau **"Allow only while using app"**

## Tips untuk Development

- **Set lokasi sebelum** buka aplikasi pertama kali
- **Gunakan koordinat yang sama** untuk semua testing
- **Jakarta (-6.2088, 106.8456)** adalah default terbaik untuk testing
- **Restart app setelah change lokasi** untuk refresh GPS cache

## Code Improvements Applied

✅ **mapService.ts**: Improved location accuracy with fallback to Indonesia  
✅ **LiveTrackingMap.tsx**: Better geolocation with validation  
✅ **Location validation**: Check for fake/invalid coordinates  
✅ **Fallback system**: Auto-use Jakarta if GPS fails

Lokasi sekarang akan otomatis fallback ke Indonesia jika:

- GPS tidak tersedia
- Koordinat tidak valid (0,0 atau middle of ocean)
- Permission ditolak
- Timeout occurred
