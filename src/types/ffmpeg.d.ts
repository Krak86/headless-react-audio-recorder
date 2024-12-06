declare module "@ffmpeg/ffmpeg/dist/ffmpeg.min.js" {
  export const FS: FS;

  export function createFFmpeg(options?: CreateFFmpegOptions): FFmpeg;

  export function fetchFile(
    data: string | Buffer | Blob | File
  ): Promise<Uint8Array>;
}
