export const copy = {
  vi: {
    title: 'Tạo mã xác thực TOTP',
    description:
      'Nhập khóa hoặc đọc ảnh QR để tạo mã xác thực TOTP ngay trong trình duyệt. Hỗ trợ SHA1, SHA256 và SHA512.',
    lead: 'Nhập khóa. Lấy mã. Đăng nhập.',
    intro:
      'Dùng khóa do dịch vụ cung cấp khi bật xác thực hai bước. Mã tự cập nhật theo thời gian.',
    skip: 'Đến công cụ',
    brandHome: 'Trang chủ VINASIG',
    formTitle: 'Khóa xác thực',
    secret: 'Secret key hoặc URL thiết lập TOTP',
    secretHint:
      'Dán khóa Base32 hoặc URL bắt đầu bằng otpauth://totp/ từ dịch vụ. Có thể giữ khoảng trắng và dấu gạch nối trong khóa.',
    show: 'Hiện khóa',
    hide: 'Ẩn khóa',
    clear: 'Xóa tất cả',
    qr: {
      title: 'Nhập từ mã QR',
      hint: 'Dán hoặc chọn ảnh QR thiết lập TOTP. Bạn cũng có thể dùng máy ảnh để quét mã trên một màn hình khác.',
      file: 'Chọn ảnh QR',
      fileHint:
        'Ảnh được đọc trên thiết bị, không tải lên máy chủ. Hỗ trợ PNG, JPEG, WebP và GIF, tối đa 20 MB.',
      paste: 'Dán hoặc thả ảnh QR vào đây',
      pastePlaceholder: 'Dán ảnh QR',
      pasteHint:
        'Chọn ô này rồi nhấn Ctrl+V, hoặc dùng Dán trên bàn phím điện thoại. Nhận ảnh QR hoặc URL otpauth://totp/. Nếu bàn phím không dán được ảnh, hãy dùng Chọn ảnh QR.',
      scanning: 'Đang đọc mã QR trên thiết bị.',
      imported: 'Đã đọc khóa và cài đặt từ mã QR.',
      cancel: 'Hủy đọc ảnh',
      cancelled: 'Đã hủy đọc ảnh.',
      camera: 'Quét bằng máy ảnh',
      cameraHint:
        'Máy ảnh chỉ bật khi bạn cho phép. Hình ảnh được đọc trên thiết bị, không ghi lại hay gửi lên máy chủ.',
      cameraRequest: 'Hãy cho phép dùng máy ảnh trong trình duyệt.',
      cameraScanning: 'Đang quét. Đưa một mã QR thiết lập TOTP vào khung hình.',
      cameraPreview: 'Khung máy ảnh quét QR',
      cameraAim:
        'Giữ đủ bốn cạnh của mã QR trong khung. Máy ảnh tự tắt khi đọc được mã, hoặc sau 2 phút.',
      stopCamera: 'Dừng máy ảnh',
      cameraCancelled: 'Đã tắt máy ảnh.',
      errors: {
        fileSize: 'Ảnh vượt quá 20 MB. Hãy chọn ảnh nhỏ hơn.',
        fileType:
          'Hãy chọn ảnh PNG, JPEG, WebP hoặc GIF. Không hỗ trợ SVG hay trang web.',
        imageSize:
          'Ảnh quá lớn. Giới hạn 24 triệu điểm ảnh và 12.000 điểm ảnh mỗi chiều.',
        imageUnreadable: 'Không đọc được ảnh. Hãy chụp rõ mã QR và thử lại.',
        decoderUnavailable:
          'Không tải được bộ đọc QR. Kết nối mạng rồi thử lại hoặc nhập khóa thủ công.',
        noQR: 'Không tìm thấy mã QR. Hãy giữ đủ bốn cạnh của mã trong ảnh.',
        multiple:
          'Ảnh có nhiều mã QR. Hãy cắt ảnh để chỉ còn mã của tài khoản bạn muốn dùng.',
        payload:
          'Không nhận được cấu hình TOTP hợp lệ. Chưa hỗ trợ HOTP, liên kết đăng nhập hoặc QR xuất nhiều tài khoản.',
        pasteUnavailable:
          'Không nhận được ảnh QR hoặc URL thiết lập TOTP. Hãy sao chép lại hoặc dùng Chọn ảnh QR.',
        pasteMultiple: 'Hãy dán một ảnh QR mỗi lần.',
        cameraUnsupported:
          'Trình duyệt chưa hỗ trợ máy ảnh hoặc trang không được mở qua HTTPS. Hãy dùng Chọn ảnh QR.',
        cameraDenied:
          'Chưa được phép dùng máy ảnh. Cho phép máy ảnh trong cài đặt trình duyệt hoặc dùng Chọn ảnh QR.',
        cameraMissing: 'Không tìm thấy máy ảnh. Hãy dùng Chọn ảnh QR.',
        cameraBusy:
          'Không mở được máy ảnh. Đóng ứng dụng đang dùng máy ảnh rồi thử lại, hoặc chọn ảnh QR.',
        cameraStopped: 'Máy ảnh đã bị ngắt. Hãy bật lại hoặc chọn ảnh QR.',
        cameraTimeout:
          'Đã tắt máy ảnh sau 2 phút. Bấm Quét bằng máy ảnh để thử lại hoặc chọn ảnh QR rõ hơn.',
        timeout: 'Đọc ảnh quá lâu. Hãy chọn ảnh nhỏ và rõ hơn rồi thử lại.',
      },
    },
    share: 'Chia sẻ khóa',
    shareTitle: 'Liên kết tạo mã',
    shareLink: 'Liên kết chia sẻ',
    shareWarning:
      'Ai có liên kết này đều có thể tạo mã xác thực của bạn. Chỉ gửi cho người bạn tin cậy.',
    shareHint: 'Khi người nhận mở liên kết, mã sẽ tự xuất hiện.',
    shareCopy: 'Sao chép liên kết',
    shareCopied: 'Đã sao chép liên kết chứa khóa. Hãy giữ kín liên kết này.',
    shareCopyFailed:
      'Không sao chép được. Hãy chọn liên kết và sao chép bằng bàn phím.',
    shareFailed: 'Không tạo được liên kết. Hãy kiểm tra khóa và cài đặt.',
    shareImported: 'Đã đọc khóa và cài đặt từ liên kết chia sẻ.',
    shareInvalid:
      'Liên kết chia sẻ không hợp lệ hoặc chưa được hỗ trợ. Hãy xin lại liên kết từ người gửi.',
    advanced: 'Cài đặt nâng cao',
    advancedHint:
      'Chỉ đổi khi dịch vụ yêu cầu. Liên kết thiết lập sẽ tự điền các cài đặt này.',
    algorithm: 'Thuật toán',
    digits: 'Độ dài mã',
    six: '6 chữ số',
    eight: '8 chữ số',
    period: 'Đổi mã sau số giây',
    periodHint: 'Thường là 30 giây. Nhập số nguyên từ 1 đến 300.',
    offset: 'Điều chỉnh giờ theo giây',
    offsetHint:
      'Giữ 0 nếu giờ thiết bị đúng. Số dương làm giờ tính mã chạy trước, số âm làm giờ chạy sau. Từ -300 đến 300.',
    resultTitle: 'Mã xác thực hiện tại',
    empty: 'Mã sẽ xuất hiện khi bạn nhập khóa hợp lệ.',
    copy: 'Sao chép mã',
    copied: 'Đã sao chép mã.',
    copyFailed: 'Không sao chép được. Hãy chọn mã và sao chép bằng bàn phím.',
    remaining: 'Đổi mã sau',
    seconds: 'giây',
    second: 'giây',
    ready: 'Mã đang tự cập nhật.',
    loading: 'Đang tạo mã.',
    invalid: 'Kiểm tra ô nhập được đánh dấu.',
    imported: 'Đã đọc cài đặt từ liên kết thiết lập.',
    account: 'Tài khoản',
    privacy:
      'Khóa và mã không gửi lên máy chủ. Trang không lưu lịch sử. Liên kết chia sẻ chứa khóa, vì vậy hãy giữ kín.',
    technical: 'Thông tin mã',
    clock: 'Giờ thiết bị',
    expiry: 'Mã đổi lúc',
    warning: 'Hãy bật giờ tự động trên thiết bị nếu mã bị từ chối.',
    faqTitle: 'Cách dùng và lưu ý',
    faqUse: 'Secret key lấy ở đâu?',
    faqUseText:
      'Dịch vụ cung cấp khóa khi bạn bật xác thực hai bước. Bạn có thể nhập khóa thủ công hoặc chọn ảnh QR thiết lập TOTP của dịch vụ. Công cụ không tự lấy khóa từ tài khoản hay tạo khóa thay cho dịch vụ.',
    faqTime: 'Mã thay đổi như thế nào?',
    faqTimeText:
      'Khóa và thời gian hiện tại cùng tạo ra mã. Cùng khóa, cài đặt và khoảng thời gian sẽ cho cùng mã. Thông thường mã đổi sau mỗi 30 giây. Dịch vụ đăng nhập quyết định chấp nhận mã và ngăn dùng lại mã đã xác thực.',
    faqSafety: 'Cần giữ khóa an toàn như thế nào?',
    faqSafetyText:
      'Ai có khóa đều có thể tạo mã đăng nhập. Chỉ nhập khóa trên thiết bị bạn tin cậy. Chỉ chia sẻ với người được phép tạo mã. Tải lại trang sẽ xóa nội dung của phiên. Nội dung đã sao chép có thể còn trong clipboard của thiết bị.',
    faqShare: 'Liên kết chia sẻ có an toàn không?',
    faqShareText:
      'Liên kết chứa khóa xác thực và cài đặt tạo mã. Phần chứa khóa không gửi tới máy chủ khi mở trang và được xóa khỏi thanh địa chỉ sau khi trang đọc xong. Tuy vậy, liên kết có thể còn trong lịch sử trình duyệt, bản đồng bộ, clipboard hoặc tin nhắn. Ai có liên kết đều có thể tạo mã cho đến khi bạn thay khóa tại dịch vụ. Liên kết không tự hết hạn và không dùng một lần. Không gửi nếu bạn không muốn trao quyền này.',
    faqOffline: 'Có dùng khi mất mạng được không?',
    faqOfflineText:
      'Sau khi trang tải xong, việc tính mã không cần mạng. Đọc ảnh QR hoặc quét bằng máy ảnh cần có bộ giải mã từ website này. URL thiết lập otpauth được đọc trên thiết bị, không tải từ một website khác. Nếu tải lại trang khi mất mạng, trang có thể không mở được. Trình duyệt cần Web Crypto và HTTPS.',
    sources: 'Tài liệu chuẩn',
    source: 'Mã nguồn',
    licenses: 'Giấy phép',
    footer: 'Công cụ miễn phí của VINASIG.',
    noScript: 'Bật JavaScript để tạo mã ngay trên thiết bị.',
    unavailable:
      'Trình duyệt chưa hỗ trợ tạo mã an toàn. Hãy dùng trình duyệt mới và mở trang qua HTTPS.',
    errors: {
      empty: 'Nhập secret key do dịch vụ cung cấp.',
      base32:
        'Khóa Base32 chỉ gồm chữ A đến Z và số 2 đến 7. Kiểm tra cả độ dài và phần cuối của khóa.',
      length:
        'Nội dung quá dài. Chỉ nhập khóa hoặc liên kết thiết lập cho một tài khoản.',
      uri: 'Liên kết thiết lập không hợp lệ. Kiểm tra loại TOTP, khóa và các cài đặt.',
      hotp: 'Liên kết này dùng HOTP theo bộ đếm. Công cụ này tạo TOTP theo thời gian.',
      algorithm: 'Chọn SHA1, SHA256 hoặc SHA512.',
      digits: 'Độ dài mã phải là 6 hoặc 8 chữ số.',
      period: 'Nhập số nguyên từ 1 đến 300 giây.',
      offset: 'Nhập số giây từ -300 đến 300.',
      crypto: 'Trình duyệt cần Web Crypto và HTTPS để tạo mã.',
    },
  },
  en: {
    title: 'TOTP code generator',
    description:
      'Enter a key or read a QR image to generate TOTP verification codes in your browser. Supports SHA1, SHA256 and SHA512.',
    lead: 'Enter your key. Get your code. Sign in.',
    intro:
      'Use the key supplied by your service when enabling two-step verification. Codes update automatically over time.',
    skip: 'Go to the tool',
    brandHome: 'VINASIG home',
    formTitle: 'Authentication key',
    secret: 'Secret key or TOTP setup URL',
    secretHint:
      'Paste a Base32 key or a URL starting with otpauth://totp/ from your service. Spaces and hyphens in a key are accepted.',
    show: 'Show key',
    hide: 'Hide key',
    clear: 'Clear all',
    qr: {
      title: 'Import from a QR code',
      hint: 'Paste or choose a TOTP setup QR image. You can also scan a code on another screen with your camera.',
      file: 'Choose QR image',
      fileHint:
        'Images are read on your device and are not uploaded. Supports PNG, JPEG, WebP and GIF up to 20 MB.',
      paste: 'Paste or drop a QR image here',
      pastePlaceholder: 'Paste a QR image',
      pasteHint:
        'Select this field and press Ctrl+V, or use Paste on your phone keyboard. Accepts QR images or otpauth://totp/ URLs. If your keyboard cannot paste images, use Choose QR image.',
      scanning: 'Reading the QR code on your device.',
      imported: 'Key and settings read from the QR code.',
      cancel: 'Cancel image import',
      cancelled: 'Image import cancelled.',
      camera: 'Scan with camera',
      cameraHint:
        'The camera starts only with your permission. Frames are read on your device, without recording or upload.',
      cameraRequest: 'Allow camera access in your browser.',
      cameraScanning: 'Scanning. Point the camera at one TOTP setup QR code.',
      cameraPreview: 'QR scanner camera preview',
      cameraAim:
        'Keep all four sides of the QR code in view. The camera stops after a code is read or after 2 minutes.',
      stopCamera: 'Stop camera',
      cameraCancelled: 'Camera stopped.',
      errors: {
        fileSize: 'This image exceeds 20 MB. Choose a smaller image.',
        fileType:
          'Choose a PNG, JPEG, WebP or GIF image. SVG and web pages are unsupported.',
        imageSize:
          'This image is too large. The limit is 24 million pixels and 12,000 pixels per side.',
        imageUnreadable:
          'Could not read this image. Try a clear screenshot of the QR code.',
        decoderUnavailable:
          'Could not load the QR reader. Connect to the network and retry, or enter the key manually.',
        noQR: 'No QR code found. Keep all four sides of the code in the image.',
        multiple:
          'This image contains multiple QR codes. Crop it to the code for your intended account.',
        payload:
          'No valid TOTP setup found. HOTP, sign-in links and multi-account export QR codes are unsupported.',
        pasteUnavailable:
          'No QR image or TOTP setup URL received. Copy it again or use Choose QR image.',
        pasteMultiple: 'Paste one QR image at a time.',
        cameraUnsupported:
          'Camera access is unavailable in this browser or without HTTPS. Use Choose QR image.',
        cameraDenied:
          'Camera permission was not granted. Allow it in browser settings or use Choose QR image.',
        cameraMissing: 'No camera found. Use Choose QR image.',
        cameraBusy:
          'Could not open the camera. Close other camera apps and retry, or choose a QR image.',
        cameraStopped:
          'The camera was disconnected. Start it again or choose a QR image.',
        cameraTimeout:
          'Camera stopped after 2 minutes. Start scanning again or choose a clearer QR image.',
        timeout:
          'Reading took too long. Choose a smaller, clearer image and try again.',
      },
    },
    share: 'Share key',
    shareTitle: 'Code generation link',
    shareLink: 'Share link',
    shareWarning:
      'Anyone with this link can generate your verification codes. Send it only to someone you trust.',
    shareHint: 'Codes appear automatically when the recipient opens the link.',
    shareCopy: 'Copy link',
    shareCopied: 'Link containing your key copied. Keep this link private.',
    shareCopyFailed:
      'Copy failed. Select the link and copy it with your keyboard.',
    shareFailed: 'Could not create a link. Check your key and settings.',
    shareImported: 'Key and settings read from the share link.',
    shareInvalid:
      'This share link is invalid or unsupported. Ask the sender for a new link.',
    advanced: 'Advanced settings',
    advancedHint:
      'Change these only when required by your service. A setup link fills them in automatically.',
    algorithm: 'Algorithm',
    digits: 'Code length',
    six: '6 digits',
    eight: '8 digits',
    period: 'Seconds between codes',
    periodHint: 'Usually 30 seconds. Enter a whole number from 1 to 300.',
    offset: 'Clock adjustment in seconds',
    offsetHint:
      'Leave 0 if your device clock is correct. Positive values move the code clock ahead, negative values move it behind. From -300 to 300.',
    resultTitle: 'Current verification code',
    empty: 'Your code appears when you enter a valid key.',
    copy: 'Copy code',
    copied: 'Code copied.',
    copyFailed: 'Copy failed. Select the code and copy it with your keyboard.',
    remaining: 'New code in',
    seconds: 'seconds',
    second: 'second',
    ready: 'Your code updates automatically.',
    loading: 'Generating your code.',
    invalid: 'Check the highlighted field.',
    imported: 'Settings read from the setup link.',
    account: 'Account',
    privacy:
      'Your key and code are not sent to a server. This page saves no history. Share links contain your key, so keep them private.',
    technical: 'Code details',
    clock: 'Device time',
    expiry: 'Code changes at',
    warning: 'Enable automatic time on your device if codes are rejected.',
    faqTitle: 'How to use this tool',
    faqUse: 'Where do I get the secret key?',
    faqUseText:
      'Your service supplies the key when you enable two-step verification. Enter its manual key or choose an image of its TOTP setup QR. This tool cannot retrieve a key from your account or create a replacement key for the service.',
    faqTime: 'How do codes change?',
    faqTimeText:
      'The key and current time produce a code. The same key, settings and time window produce the same code. Codes usually change every 30 seconds. The sign-in service decides which codes to accept and prevents reuse after successful verification.',
    faqSafety: 'How should I protect my key?',
    faqSafetyText:
      'Anyone with your key can generate sign-in codes. Use a device you trust. Share only with someone allowed to generate your codes. Reloading clears this session. Copied content may remain in your device clipboard.',
    faqShare: 'Are share links safe?',
    faqShareText:
      'A share link contains your authentication key and code settings. The key portion is not sent to the server when the page opens and is removed from the address bar after import. However, the link may remain in browser history, sync, clipboard or messages. Anyone with the link can generate codes until you replace the key at your service. Links do not expire and are not single use. Do not send one unless you want to grant this access.',
    faqOffline: 'Can I use this without a network?',
    faqOfflineText:
      "Once the page has loaded, generating codes does not need a network. Image and camera scanning need this website's decoder assets to be available. otpauth setup URLs are parsed on your device without fetching another website. Reloading while offline may fail. Web Crypto and HTTPS are required.",
    sources: 'Standards',
    source: 'Source code',
    licenses: 'Licenses',
    footer: 'A free tool from VINASIG.',
    noScript: 'Enable JavaScript to generate codes on your device.',
    unavailable:
      'Your browser cannot generate codes securely. Use a current browser and open this page over HTTPS.',
    errors: {
      empty: 'Enter the secret key supplied by your service.',
      base32:
        'A Base32 key uses letters A to Z and numbers 2 to 7. Check its length and final characters too.',
      length:
        'This input is too long. Enter a key or setup link for one account.',
      uri: 'This setup link is invalid. Check its TOTP type, key and settings.',
      hotp: 'This link uses counter-based HOTP. This tool generates time-based TOTP.',
      algorithm: 'Choose SHA1, SHA256 or SHA512.',
      digits: 'The code must have 6 or 8 digits.',
      period: 'Enter a whole number from 1 to 300 seconds.',
      offset: 'Enter a number of seconds from -300 to 300.',
      crypto: 'Web Crypto and HTTPS are required to generate codes.',
    },
  },
} as const;
