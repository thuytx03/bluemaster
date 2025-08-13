# Xthuy Social Extension

## Giới thiệu
Extension này hỗ trợ thao tác cookie, lấy token Facebook và một số tiện ích khác cho người dùng.

## Cài đặt

1. Clone hoặc tải mã nguồn về máy:
	```sh
	git clone https://github.com/your-username/xthuy-social.git
	```

2. Cài đặt các package cần thiết:
	```sh
	pnpm install
	```

3. Build extension:
	```sh
	pnpm run build
	```

4. Mở Chrome, truy cập `chrome://extensions/`, bật "Chế độ dành cho nhà phát triển", chọn "Tải tiện ích đã giải nén" và chọn thư mục `build/`.

## Sử dụng

- Nhấn vào icon extension trên trình duyệt để mở trang tùy chọn.
- Extension có thể thao tác cookie Facebook qua các hàm:
  - [`setCookie`](src/helpers/cookieHelpers.ts)
  - [`getCookie`](src/helpers/cookieHelpers.ts)
- Extension tự động lấy token Facebook khi nhận tin nhắn có action `"FB_DTSG"`.

## Cấu trúc thư mục

- `src/`: Mã nguồn chính của extension
- `build/`: File đã build để nạp vào Chrome
- `public/`: Tài nguyên tĩnh

## Đóng góp

Vui lòng tạo pull request hoặc liên hệ qua email nếu bạn muốn đóng góp.

## Giấy phép

Xem chi tiết tại [LICENSE](LICENSE).
