# 🗺️ Maps Setup Guide - OpenStreetMap (Free Alternative)

## Overview

Aplikasi "Im Here" menggunakan **OpenStreetMap (OSM)** sebagai penyedia peta, yang merupakan alternatif gratis dari Google Maps. Tidak diperlukan API key berbayar!

## Why OpenStreetMap?

- ✅ **100% Gratis** - Tidak perlu kartu kredit/debit
- ✅ **Open Source** - Data peta terbuka
- ✅ **No Limits** - Tidak ada batasan request
- ✅ **Global Coverage** - Peta seluruh dunia
- ✅ **Community Driven** - Diperbarui oleh komunitas

## Current Setup Status: ✅ READY TO USE

### Android Configuration ✅

**File**: `android/app/src/main/AndroidManifest.xml`

- ✅ Location permissions added
- ✅ Placeholder API key configured
- ✅ react-native-maps requirements met

### Map Service ✅

**File**: `lib/mapService.ts`

- ✅ OpenStreetMap tile URL configured
- ✅ Alternative tile servers available
- ✅ Location services implemented

### Map Components ✅

- ✅ `set-destination.tsx` - Using OpenStreetMap
- ✅ `map.tsx` - Using OpenStreetMap
- ✅ UrlTile implementation ready

## Testing Instructions

### 1. Clean & Rebuild (if you just updated AndroidManifest.xml)

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### 2. Test Maps Functionality

1. **Login** ke aplikasi
2. **Create Room**
3. **Navigate** ke room
4. **Click "Set Destination"** - Peta seharusnya muncul dengan OpenStreetMap tiles
5. **Test location** - Grant location permission saat diminta

### 3. Expected Behavior

- ✅ Map loads with OpenStreetMap tiles
- ✅ Location permission dialog appears
- ✅ Current location marker shows
- ✅ Can tap to set destination
- ✅ No Google Maps API errors

## Troubleshooting Common Issues

### If Map Fails to Load:

- **Check Internet Connection**: Pastikan perangkat terhubung ke internet.
- **Retry**: Kadang-kadang server OSM lambat, coba lagi beberapa saat kemudian.

### If Location Services Fail:

- **Check Permissions**: Pastikan aplikasi memiliki izin lokasi yang diperlukan.
- **Enable GPS**: Pastikan GPS di perangkat diaktifkan.

### For Development Issues:

- **Rebuild the App**: Setelah mengubah konfigurasi, selalu bersihkan dan bangun ulang aplikasi.
- **Check Logs**: Lihat log kesalahan di console untuk petunjuk lebih lanjut.

---

## 🎉 Kesimpulan

Dengan mengikuti panduan ini, Anda seharusnya dapat mengatur dan menguji integrasi OpenStreetMap dengan sukses di aplikasi "Im Here".

Silakan hubungi tim pengembang jika Anda mengalami masalah lebih lanjut atau memiliki pertanyaan! 👍
