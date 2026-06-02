export const rules = [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [{ header: "Origin", operation: "remove" }]
      },
      condition: {
        urlFilter: "https://www.facebook.com/api/graphql/*",
        resourceTypes: ["xmlhttprequest"]
      }
    },
    // Inbox: facebook.com requests — set origin + sec-fetch-site
    {
      id: 10,
      priority: 2,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "origin",
            operation: "set",
            value: "https://www.facebook.com"
          },
          { header: "sec-fetch-site", operation: "set", value: "same-origin" }
        ]
      },
      condition: {
        urlFilter: "https://www.facebook.com/*",
        resourceTypes: ["xmlhttprequest"]
      }
    },
    {
      id: 11,
      priority: 2,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "origin",
            operation: "set",
            value: "https://business.facebook.com"
          },
          { header: "sec-fetch-site", operation: "set", value: "same-origin" }
        ]
      },
      condition: {
        urlFilter: "https://business.facebook.com/*",
        resourceTypes: ["xmlhttprequest"]
      }
    },
    {
      id: 12,
      priority: 2,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "origin",
            operation: "set",
            value: "https://business.facebook.com"
          },
          {
            header: "referer",
            operation: "set",
            value: "https://business.facebook.com"
          },
          { header: "sec-fetch-site", operation: "set", value: "same-origin" }
        ]
      },
      condition: {
        urlFilter: "https://upload-business.facebook.com/*",
        resourceTypes: ["xmlhttprequest"]
      }
    },
    // upload.facebook.com — used by inbox message attachment upload from background
    {
      id: 13,
      priority: 2,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "origin",
            operation: "set",
            value: "https://www.facebook.com"
          },
          {
            header: "referer",
            operation: "set",
            value: "https://www.facebook.com/"
          },
          { header: "sec-fetch-site", operation: "set", value: "same-origin" }
        ]
      },
      condition: {
        urlFilter: "https://upload.facebook.com/*",
        resourceTypes: ["xmlhttprequest"]
      }
    }
  ]