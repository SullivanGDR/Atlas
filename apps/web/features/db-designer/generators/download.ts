export function downloadFile(content: Blob, name: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const filename = (name: string) =>
  name.replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 80) || "athena";
