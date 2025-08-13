export function copyTextToClipboard(text: string): void {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard successfully!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
}
export const normalizeText = (text: string) => {
    return text
        .normalize("NFD") // Chuyển thành dạng ký tự cơ bản + dấu
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
        .toLowerCase(); // Chuyển về chữ thường
};
