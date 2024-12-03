import { DownloadFileExtension } from "../types/har";

/**
 * Checks if the website is cross-origin isolated
 * @param webmBlob  Blob
 * @param downloadFileExtension DownloadFileExtension
 * @returns Promise<Blob>
 */
export const convertToDownloadFileExtension = async (
  webmBlob: Blob,
  downloadFileExtension: DownloadFileExtension
): Promise<Blob> => {
  const FFmpeg = await import("@ffmpeg/ffmpeg");
  const ffmpeg = FFmpeg.createFFmpeg({ log: false });
  await ffmpeg.load();

  const inputName = "input.webm";
  const outputName = `output.${downloadFileExtension}`;

  ffmpeg.FS(
    "writeFile",
    inputName,
    new Uint8Array(await webmBlob.arrayBuffer())
  );

  await ffmpeg.run("-i", inputName, outputName);

  const outputData = ffmpeg.FS("readFile", outputName);
  const outputBlob = new Blob([outputData.buffer], {
    type: `audio/${downloadFileExtension}`,
  });

  return outputBlob;
};

/**
 * Downloads a blob as a file
 * @param blob  Blob
 * @param downloadFileExtension
 */
export const downloadBlob = async (
  blob: Blob,
  downloadFileExtension: DownloadFileExtension
): Promise<void> => {
  if (!crossOriginIsolated && downloadFileExtension !== "webm") {
    console.warn(
      `This website is not "cross-origin isolated". Audio will be downloaded in webm format, since mp3/wav encoding requires cross origin isolation. Please visit https://web.dev/cross-origin-isolation-guide/ and https://web.dev/coop-coep/ for information on how to make your website "cross-origin isolated"`
    );
  }

  const downloadBlob = crossOriginIsolated
    ? await convertToDownloadFileExtension(blob, downloadFileExtension)
    : blob;
  const fileExt = crossOriginIsolated ? downloadFileExtension : "webm";
  const url = URL.createObjectURL(downloadBlob);

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `audio.${fileExt}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/**
 * Logs a warning message
 * @param content
 * @returns void
 */
export const warn = (content: string): void =>
  console.warn("[react-screen-wake-lock]: " + content);

export const PLAYER_OPTIONS_DEFAULT = {
  height: 20,
  width: 360,
  // waveColor: '#570df8',
  waveColor: "#2563EB",
  // progressColor: '#00126e',
  progressColor: "#E4E5EC",
  normalize: true,
  cursorColor: "#2563EB",
  cursorWidth: 1,
  barWidth: 3,
  barGap: 1,
  barRadius: 1,
  barHeight: 1,
  minPxPerSec: 1,
  fillParent: true,
  mediaControls: false,
  autoplay: false,
  interact: true,
  dragToSeek: false,
  hideScrollbar: true,
  audioRate: 1,
  autoScroll: false,
  autoCenter: true,
  sampleRate: 8000,
};
