import WaveSurfer, { WaveSurferOptions } from "wavesurfer.js";

export type RecorderControls = {
  startRecording: () => void;
  stopRecording: () => void;
  togglePauseResume: () => void;
  recordingBlob?: Blob;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder?: MediaRecorder;
  onRecordingComplete?: (blob: Blob) => void;
};

export type MediaAudioTrackConstraints = Pick<
  MediaTrackConstraints,
  | "deviceId"
  | "groupId"
  | "autoGainControl"
  | "channelCount"
  | "echoCancellation"
  | "noiseSuppression"
  | "sampleRate"
  | "sampleSize"
>;

export type WakeLockOptions = {
  onError?: (error: Error) => void;
  onRequest?: () => void;
  onRelease?: EventListener;
};

export type DownloadFileExtension = "mp3" | "wav" | "webm";

export type HARProps = {
  /**
   * This gets called when the save button is clicked.
   * In case the recording is cancelled, the blob is discarded.
   **/
  onRecordingComplete?: (blob: Blob) => void;
  /**
   * This gets called when the getUserMedia Promise is rejected.
   * It takes the resultant DOMException as its parameter.
   **/
  onNotAllowedOrFound?: (exception: DOMException) => any;
  /**
   * Takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings#instance_properties_of_audio_tracks subset} of
   * `MediaTrackConstraints` that apply to the audio track
   *
   * @Property `deviceId`
   * @Property `groupId`
   * @Property `autoGainControl`
   * @Property `channelCount`
   * @Property `echoCancellation`
   * @Property `noiseSuppression`
   * @Property `sampleRate`
   * @Property `sampleSize`
   */
  audioTrackConstraints?: MediaAudioTrackConstraints;
  /**
   * If set to `true` the file gets downloaded when save recording is pressed
   **/
  downloadOnFinish?: boolean;
  /**
   * File extension for the audio filed that gets downloaded
   **/
  downloadFileExtension?: DownloadFileExtension;
  /**
   * Displays a waveform visualization for the audio when set to `true`. Defaults to `false`
   **/
  showVisualizer?: boolean;
  /**
   * The options passed to the HTML MediaRecorder API.
   **/
  mediaRecorderOptions?: MediaRecorderOptions;
  /**
   * The time limit for the recording in seconds
   */
  recordTimeLimit?: number;
  /**
   * If set to `true` the screen will not lock while recording
   */
  wakeLock?: boolean;
  /**
   * The options passed to the WakeLock API.
   */
  wakeLockOptions?: WakeLockOptions;
  /**
   * If set to `true` the component will render a player (@wavesurfer/react) for the recorded audio
   */
  player?: boolean;
  /**
   * The options passed to the audio player (@wavesurfer/react)
   */
  playerOptions?: {};
};
