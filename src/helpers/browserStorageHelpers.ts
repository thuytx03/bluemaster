
// Set item
export const setLocalStorage = (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
        });
    });
};

// Get item
export const getLocalStorage = <T>(key: string): Promise<T | null> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(result[key] ?? null);
        });
    });
};

// Remove item
export const removeLocalStorage = (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove([key], () => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
        });
    });
};
