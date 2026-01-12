# Da Nang Travel Map - Backend Documentation

Tài liệu hướng dẫn cài đặt và chi tiết API cho Developer.

## 1. Cài đặt & Cấu hình (Setup)

### Bước 1: Cài đặt thư viện

Tại thư mục gốc của dự án, chạy lệnh:

```bash
npm install
```

### Bước 2: Cấu hình Environment (.env)

**Quan trọng:** Hệ thống sẽ không chạy nếu thiếu file này.

1. Kiểm tra xem có file `.env` chưa. Nếu chưa có, hãy tạo mới.
2. Copy nội dung từ file `.env.example` sang file `.env` (lưu ý không xóa `.env.example`).
3. Điền thông tin Database của bạn vào `.env`:

```ini
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=admin
DB_NAME=da_nang_travel
JWT_SECRET=super_secret_key
```

### Bước 3: Khởi tạo Database

1. Mở MySQL Workbench, tạo Database rỗng tên trùng với `DB_NAME`.
2. Chạy lệnh để tạo bảng và nạp dữ liệu mẫu:

```bash
npm run seed
```

### Bước 4: Chạy Server

```bash
npm run dev
```

Server chạy tại: `http://localhost:8080`

---

## 2. Chi tiết API (API Reference)

**Base URL:** `http://localhost:8080/api`

### A. Authentication (Xác thực)

#### 1. Đăng ký (Register)

- **URL:** `/auth/register`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "email": "khai@gmail.com",
    "password": "123",
    "full_name": "Khải Leader"
  }
  ```

#### 2. Đăng nhập (Login)

- **URL:** `/auth/login`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "email": "khai@gmail.com",
    "password": "123"
  }
  ```
- **Response Success:** Trả về `token` và thông tin user.

#### 3. Lấy thông tin User (Get Me)

- **URL:** `/auth/me`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Thông tin profile của user hiện tại.

#### 4. Đổi mật khẩu

- **URL:** `/auth/change-password`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Body (JSON):**
  ```json
  {
    "old_password": "123",
    "new_password": "456"
  }
  ```

---

### B. Reviews (Đánh giá & Upload)

#### 1. Tạo Review mới (Kèm ảnh)

**Lưu ý:** API này dùng `multipart/form-data` để upload ảnh.

- **URL:** `/review`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body (Form-Data):**
  - `place_id`: 1 (Text)
  - `stars`: 5 (Text - số sao từ 1-5)
  - `title`: "Trải nghiệm quá đã" (Text)
  - `content`: "Review chi tiết..." (Text)
  - `images`: [File ảnh chọn từ máy] (File)

#### 2. Lấy danh sách Review theo địa điểm

- **URL:** `/review/place/:place_id` (Ví dụ: `/review/place/1`)
- **Method:** `GET`
- **Response:** Danh sách các review của địa điểm đó.

#### 3. Xóa Review

**Lưu ý:** Hiện tại là **Hard Delete** (Xóa vĩnh viễn).

- **URL:** `/review/:id`
- **Method:** `DELETE`
- **Headers:** `Authorization: Bearer <token>`

---

### C. Favorites (Yêu thích)

#### 1. Thả tim / Bỏ tim (Toggle)

- **URL:** `/favorite/toggle`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body (JSON):**
  ```json
  {
    "place_id": 1
  }
  ```
- **Logic:** Nếu chưa tim -> Thêm tim. Nếu đã tim -> Xóa tim.

#### 2. Xem danh sách đã yêu thích

- **URL:** `/favorite/me`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

---

## 3. Cấu trúc Response chuẩn

Mọi API thành công sẽ trả về dạng:

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... }
}
```
