chrome.runtime.onInstalled.addListener(() => {
  console.log('Cài đặt extension thành công');

  (async () => {
    await chrome.sidePanel.setOptions({
      path: 'sidepanel.html',
      enabled: true
    });

    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });
  })();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "FB_DTSG") {
    const profileUrl = `https://www.facebook.com/profile.php?id=${message.c_user}`;
    fetch(profileUrl)
      .then(response => response.text())
      .then(pageContent => {
        const regexPattern = /DTSGInitialData(.?)+IntlPhonologicalRules/gm;
        const match = pageContent.match(regexPattern);
        const token = (match && match.length > 0) ? match[0].split("\"")[4] : null;
        sendResponse(token);
      })
      .catch(err => {
        console.error("Có lỗi xảy ra:", err);
        sendResponse(null);
      })
      .finally(() => {
        // đảm bảo kết thúc
        return true;
      });

    return true; // giữ kênh mở
  }
});

