<p align="center">
  <img src="assets/icon.png" width="120" alt="Logo Bluemaster" style="border-radius:24px" />
</p>

<h1 align="center">Bluemaster for Facebook</h1>

<p align="center">
  <a href="README.md">English</a> · <strong>Tiếng Việt</strong>
</p>

<p align="center">
  Tiện ích mở rộng mã nguồn mở, bổ sung bộ công cụ chuyên sâu ngay trên Facebook:<br/>
  tải media hàng loạt, quét UID, dọn dẹp bạn bè / nhóm / trang, công cụ bài viết và tin nhắn,<br/>
  inbox hàng loạt, đăng bài đa nhóm, chia sẻ hàng loạt, bình luận theo lịch, tiện ích token và cookies.
</p>

<p align="center">
  <a href="https://github.com/thuytx03/bluemaster/actions/workflows/ci.yml"><img src="https://github.com/thuytx03/bluemaster/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/thuytx03/bluemaster/releases/latest"><img src="https://img.shields.io/github/v/release/thuytx03/bluemaster?label=release" alt="Phiên bản" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Giấy phép MIT" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-green" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/built%20with-Plasmo-7c3aed" alt="Plasmo" />
</p>

<p align="center">
  <a href="https://github.com/thuytx03/bluemaster/releases/latest/download/bluemaster-latest.zip"><img src="https://img.shields.io/badge/T%E1%BA%A3i%20v%E1%BB%81-Chrome%20%2F%20Edge%20%2F%20Brave-1877F2?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Tải về cho Chrome, Edge, Brave" /></a>
  &nbsp;
  <a href="https://github.com/thuytx03/bluemaster/releases"><img src="https://img.shields.io/badge/T%E1%BA%A5t%20c%E1%BA%A3%20phi%C3%AAn%20b%E1%BA%A3n-changelog-555?style=for-the-badge&logo=github&logoColor=white" alt="Tất cả phiên bản" /></a>
  &nbsp;
  <a href="#cai-dat"><img src="https://img.shields.io/badge/H%C6%B0%E1%BB%9Bng%20d%E1%BA%ABn%20c%C3%A0i-3%20b%C6%B0%E1%BB%9Bc-0B5ED7?style=for-the-badge&logo=bookstack&logoColor=white" alt="Hướng dẫn cài đặt" /></a>
</p>

> Bluemaster là dự án độc lập, không liên kết, không được Meta Platforms, Inc. bảo trợ hay tài trợ. "Facebook" là nhãn hiệu của Meta Platforms, Inc.

---

## Tính năng

Mọi công cụ chạy trong một thanh bên (sidebar) được chèn vào `facebook.com`, nên bạn thao tác ngay trên trang đang mở. Thanh điều hướng liệt kê các nhóm công cụ; bấm vào một nhóm để mở danh sách công cụ của nhóm đó, hoặc ghim bất kỳ công cụ nào (tối đa 12) lên thanh điều hướng.

### Facebook

| Công cụ | Chức năng |
|---|---|
| **Tải hàng loạt** | Tải toàn bộ ảnh, video, reels, story nổi bật hoặc story đang hoạt động của một trang cá nhân hay nhóm. Tuỳ chỉnh định dạng tên file (thứ tự, id, tiêu đề, thời gian), lọc theo khoảng ngày, số luồng, độ trễ, thư mục riêng cho từng story nổi bật, và chế độ gộp một file ZIP để trình duyệt chỉ hỏi nơi lưu một lần. |
| **Tải nhiều URL** | Dán nhiều liên kết (bài viết, video/reels/watch, story, album, video trong bình luận), mỗi dòng một liên kết. Loại nội dung được nhận diện tự động; mỗi URL thành một tác vụ có thể theo dõi và thử lại. |
| **Quét UID** | Thu thập ID người dùng từ nhóm, bài viết, lượt cảm xúc hoặc danh sách bạn bè và xuất ra TXT, JSON hoặc Excel. |
| **Access token** | Lấy token EAAB / EAAGNO từ phiên đăng nhập hiện tại. |

### Tài khoản

| Công cụ | Chức năng |
|---|---|
| **Bạn bè** | Danh sách bạn bè có lọc theo giới tính và số bạn chung: huỷ kết bạn, chặn, hạn chế, chặn tin nhắn hoặc chọc, từng người hoặc hàng loạt, kèm xuất CSV. Có các tab người bị chặn, bị hạn chế, bị chặn tin nhắn, lời mời kết bạn đã nhận (chấp nhận / xoá hàng loạt) và lời mời đã gửi (huỷ hàng loạt). |
| **Nhóm** | Nhóm đã tham gia, lọc theo lần hoạt động gần nhất để rời hàng loạt các nhóm không còn tương tác; huỷ yêu cầu tham gia đang chờ duyệt; tham gia nhóm được đề xuất. |
| **Theo dõi** | Người và trang bạn đang theo dõi (bỏ theo dõi / theo dõi lại hàng loạt) và trang đã thích (bỏ thích hàng loạt). |

### Nội dung

| Công cụ | Chức năng |
|---|---|
| **Bài viết của tôi** | Duyệt bài viết với bộ lọc loại bài, quyền riêng tư và ngày đăng; xoá, ẩn, gỡ thẻ, chuyển vào thùng rác hoặc lưu trữ hàng loạt. |
| **Tải tin nhắn** | Xuất cuộc trò chuyện Messenger ra HTML, CSV, TXT hoặc Excel. |

### Tự động hoá

| Công cụ | Chức năng |
|---|---|
| **Inbox tự động** | Quét hộp thư của Fanpage, lọc khách hàng, soạn tin theo mẫu và gửi hàng loạt với giãn cách, thời gian nghỉ và hẹn giờ. |
| **Đăng bài đa nhóm** | Đăng một bài (chữ, phông nền, ảnh, video, check-in, liên kết) lên nhiều nhóm, có thể dưới tên Fanpage hoặc ẩn danh, hỗ trợ spin nội dung, thứ tự ngẫu nhiên, giãn cách và bình luận kèm sau khi đăng. |
| **Chia sẻ hàng loạt** | Chia sẻ bài viết, reels hoặc liên kết vào nhiều nhóm và lên tường của trang cá nhân lẫn các Fanpage, mỗi nơi dùng đúng danh tính của nó. |
| **Post Radar** | Theo dõi bài mới trong nhóm, trang cá nhân hoặc Fanpage, rồi đăng lại, chia sẻ hoặc nhân bản sang các nhóm đích. |
| **Quét & Bình luận** | Tìm bài viết theo từ khoá và bình luận bằng chữ kèm hình ảnh. |
| **Auto Bot Comment** | Các bot tự bình luận vào bài mới trong thư viện nhóm do bạn sắp xếp theo chủ đề, dùng mẫu bình luận có spin, chạy theo lịch. |

### Tiện ích

| Công cụ | Chức năng |
|---|---|
| **Cookies** | Xuất cookies hiện tại hoặc nhập một bộ cookies cho bất kỳ URL nào. |
| **Tự chạy trên trang** | Chặn "đã xem" cho story và tin nhắn, hiện tổng lượt cảm xúc bị ẩn, thêm nút tải và nút điều khiển gốc cho video. |

Mọi thao tác hàng loạt dùng chung một cấu hình an toàn: độ trễ ngẫu nhiên giữa các thao tác, nghỉ sau mỗi N thao tác, giới hạn số thao tác mỗi lượt và tự dừng khi lỗi liên tiếp. Danh sách nhóm đồng bộ từ tài khoản, bot, mẫu bình luận và thư viện nhóm được lưu trên máy và dùng chung giữa các công cụ.

Lịch sử tải, mẫu tên file và tuỳ chỉnh giao diện được giữ lại giữa các phiên. Có giao diện sáng / tối, tiếng Việt và tiếng Anh.

<a id="cai-dat"></a>
## Cài đặt

### Từ bản phát hành

1. Bấm nút **Tải về** ở trên (hoặc lấy file `bluemaster-<phiên bản>.zip` ở [trang phát hành](https://github.com/thuytx03/bluemaster/releases/latest)) rồi giải nén.
2. Mở `chrome://extensions`, bật **Chế độ dành cho nhà phát triển**, bấm **Tải tiện ích đã giải nén** và chọn thư mục vừa giải nén.
3. Mở `facebook.com`. Nút nổi ở mép phải màn hình sẽ mở thanh công cụ.

### Từ mã nguồn

```bash
git clone https://github.com/thuytx03/bluemaster.git
cd bluemaster
pnpm install          # hoặc: corepack enable && pnpm install
pnpm dev              # bản phát triển, tự tải lại khi sửa code -> build/chrome-mv3-dev
pnpm build            # bản phát hành + file zip           -> build/chrome-mv3-prod
```

Nạp thư mục `build/chrome-mv3-dev` (hoặc `-prod`) dưới dạng tiện ích đã giải nén.

## Phát triển

| Lệnh | Mục đích |
|---|---|
| `pnpm dev` | Máy chủ phát triển Plasmo, tự tải lại khi sửa code |
| `pnpm build` | Build bản phát hành và đóng gói `.zip` |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | oxlint (quy tắc TypeScript, React, React Hooks) |
| `pnpm check` | type-check + lint |

Công nghệ: [Plasmo](https://www.plasmo.com/) (Manifest V3), React 18, TypeScript, Tailwind CSS (tiền tố `bm-` và giới hạn trong shadow DOM của thanh bên để style của Facebook không lẫn vào và ngược lại), Zustand, i18next, Lucide icons.

### Cấu trúc dự án

```
src/
  background.ts            service worker: tải file, proxy fetch, quy tắc declarativeNetRequest
  contents/                content script: giao diện thanh bên, tự chạy trên trang (isolated + MAIN world)
  configs/                 axios client, danh sách công cụ của thanh bên
  constants/               enum, route, mẫu regex, cấu hình tải
  modules/
    download/              tải hàng loạt + tải nhiều URL (components, hooks, services, utils)
    facebook/              lớp Facebook dùng chung: service GraphQL / bài viết / nhóm, relay qua service worker,
                           hook phiên đăng nhập, tiện ích thao tác hàng loạt + giãn cách, khung trang công cụ;
                           quét UID, trang token
    account/               bạn bè, nhóm, theo dõi (pages · components · hooks · services · types)
    content/               bài viết của tôi, tải tin nhắn
    automation/            đăng bài đa nhóm, chia sẻ hàng loạt, Post Radar, quét & bình luận, auto bot comment
    inbox/                 trình gửi tin nhắn hàng loạt
    auto-run/              tiện ích tự chạy trên trang (chặn đã xem, tổng cảm xúc, nút video)
    cookies/ settings/ shared/
  stores/                  Zustand store (đăng nhập, trạng thái extension, lịch sử tải)
  utils/                   wrapper API chrome, lõi tải (thử lại / tiếp tục), ghi ZIP, đặt tên file
```

Quy tắc đặt tên: component và page dùng `PascalCase.tsx`, hook dùng `useThing.ts`, còn lại dùng `ten-file.<loại>.ts` (`service`, `util`, `store`, `types`, `constants`, `config`, `feature`). Import nội bộ dùng alias `src/`.

Trong mỗi module, request tới Facebook nằm ở `services/` (hàm async thuần, không dùng React), state React ở `hooks/`, giao diện ở `components/` và `pages/`. Bản dịch là các key phẳng dạng `snake_case` trong `src/assets/languages/{vi,en}.json`.

### Cơ chế tải

Đường dẫn media lấy từ chính các endpoint GraphQL của Facebook bằng phiên đăng nhập của bạn (không qua máy chủ bên thứ ba). File được lưu qua `chrome.downloads` có xử lý thử lại và tải tiếp; ở chế độ ZIP, các file được tải vào bộ nhớ rồi ghi thành một file nén bằng bộ ghi ZIP không phụ thuộc thư viện ngoài. Mọi file nằm trong `Downloads/bluemaster/`.

## Quyền riêng tư

Bluemaster chỉ giao tiếp với Facebook (`facebook.com` và các máy chủ upload của Facebook) và GitHub (để kiểm tra phiên bản mới). Cookies, token, media đã tải, danh sách nhóm đã đồng bộ, bot và mẫu bình luận không bao giờ rời khỏi trình duyệt của bạn. Không có phân tích hay thu thập dữ liệu sử dụng. Chi tiết xem [PRIVACY.md](PRIVACY.md).

## Sử dụng có trách nhiệm

Tiện ích này tự động hoá thao tác trên chính tài khoản Facebook của bạn. Bạn tự chịu trách nhiệm tuân thủ Điều khoản dịch vụ của Facebook và pháp luật nơi bạn sinh sống, bao gồm quy định về bản quyền và quyền riêng tư đối với nội dung bạn tải về hay người bạn nhắn tin. Hãy đặt giãn cách hợp lý; tự động hoá quá dày có thể khiến tài khoản bị hạn chế.

## Phát hành

CI chạy type-check, lint và build ở mỗi lần push và pull request. Để phát hành phiên bản mới, chạy `pnpm version <patch|minor|major>` rồi push kèm tag. Lệnh này tăng phiên bản trong `package.json`, đồng bộ `version.json` và `CHANGELOG.md`, tạo commit và tag; workflow phát hành sau đó build extension, đính kèm `bluemaster-<phiên bản>.zip` (kèm mã kiểm tra SHA-256) vào GitHub Release, và tính năng kiểm tra cập nhật của extension sẽ nhận ra phiên bản mới.

```bash
pnpm version minor && git push --follow-tags
```

## Đóng góp

Mọi issue và pull request đều được hoan nghênh. Đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách cài đặt, quy ước và danh sách kiểm tra cho PR, và [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) về quy tắc cộng đồng. Lỗi bảo mật xin báo qua [SECURITY.md](SECURITY.md); cách xử lý dữ liệu được mô tả trong [PRIVACY.md](PRIVACY.md). Thay đổi theo từng phiên bản nằm trong [CHANGELOG.md](CHANGELOG.md). Hãy giữ quy tắc đặt tên ở trên và bo góc thống nhất 8 px trong bộ UI ở `src/modules/shared/ui`.

## Giấy phép

[MIT](LICENSE) © 2026 Trịnh Xuân Thuỷ
