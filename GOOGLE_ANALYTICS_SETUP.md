# Hướng dẫn setup Google Analytics 4

## Bước 1: Tạo tài khoản Google Analytics
1. Truy cập: https://analytics.google.com/
2. Đăng nhập bằng Google Account của bạn
3. Click "Start measuring"

## Bước 2: Tạo Property
1. Nhập tên Property (ví dụ: "HappyNewYear2026")
2. Chọn timezone: **(UTC+07:00) Bangkok, Hanoi, Jakarta**
3. Chọn currency: **Vietnamese Dong (₫)**
4. Click "Next"

## Bước 3: Thông tin doanh nghiệp (có thể skip)
1. Chọn Business size: "Small"
2. Chọn mục đích sử dụng
3. Click "Create"
4. Đồng ý Terms of Service

## Bước 4: Thiết lập Data Stream
1. Chọn platform: **Web**
2. Website URL: URL GitHub Pages của bạn
   - Ví dụ: `https://yourusername.github.io/HappyNewYear2026`
3. Stream name: "Happy New Year Website"
4. Click "Create stream"

## Bước 5: Lấy Measurement ID
Sau khi tạo stream, bạn sẽ thấy **Measurement ID** có dạng:
```
G-XXXXXXXXXX
```
(Ví dụ: G-ABC123DEF4)

## Bước 6: Cập nhật code
Mở file `index.html`, tìm và thay thế **2 lần**:
```html
<!-- Tìm dòng này (có 2 chỗ) -->
YOUR_MEASUREMENT_ID

<!-- Thay bằng -->
G-ABC123DEF4 (ID của bạn)
```

## Bước 7: Deploy lên GitHub Pages
1. Push code lên GitHub repository
2. Vào Settings → Pages → Chọn branch và Save
3. Đợi vài phút để GitHub deploy
4. Website của bạn sẽ có URL: `https://yourusername.github.io/repository-name`

## Bước 8: Kiểm tra Analytics hoạt động
1. Truy cập website của bạn
2. Quay lại Google Analytics
3. Vào **Reports** → **Realtime**
4. Bạn sẽ thấy mình đang online (có thể mất 1-2 phút)

## Xem báo cáo
- **Realtime**: Xem người đang online ngay lúc này
- **Reports → Life cycle → Acquisition**: Xem số lượt truy cập theo thời gian
- **Reports → User → Demographics**: Xem thông tin thiết bị, vị trí

---

## Lưu ý quan trọng:
- ✅ Google Analytics hoạt động **chỉ khi website đã deploy lên internet** (không hoạt động khi mở file:// local)
- ✅ Dữ liệu có thể mất 24-48 giờ để xuất hiện đầy đủ trong Reports (Realtime thì ngay lập tức)
- ✅ Hoàn toàn miễn phí
- ⚠️ Nếu người xem bật Ad Blocker, tracking có thể bị chặn

---

## Nếu gặp lỗi:
1. Kiểm tra Measurement ID đã đúng chưa
2. Xóa cache browser (Ctrl+Shift+Del)
3. Đợi 24h để dữ liệu được xử lý
