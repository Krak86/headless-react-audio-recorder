import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  lazy,
  Suspense,
  useRef,
} from "react";
import { useWavesurfer } from "@wavesurfer/react";

import { DownloadFileExtension, HARProps } from "@/types/har";
import { downloadBlob, PLAYER_OPTIONS_DEFAULT, warn } from "../helpers/utils";

const LiveAudioVisualizer = lazy(async () => {
  const { LiveAudioVisualizer } = await import("react-audio-visualize");
  return { default: LiveAudioVisualizer };
});

/**
 * @returns Controls for the recording. Details of returned controls are given below
 *
 * @param `audioTrackConstraints`: Takes a {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings#instance_properties_of_audio_tracks subset} of `MediaTrackConstraints` that apply to the audio track
 * @param `onNotAllowedOrFound`: A method that gets called when the getUserMedia promise is rejected. It receives the DOMException as its input.
 * @param `onRecordingComplete`: callback of finished recording. Return the blob of the recording
 * @param `mediaRecorderOptions`: Options for the MediaTrackConstraints type {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#instance_properties subset}
 * @param `downloadFileExtension`: file extension for the audio filed that gets downloaded
 * @param `downloadOnFinish`: Optinal dowloading the recording after finish
 * @param `showVisualizer`: Optional show visualizer while recording
 * @param `wakeLock`: Optional screen wake lock
 * @param `wakeLockOptions`: Optional screen wake lock options
 * @param `player`: Optional @wavesurfer/react player for the recorded audio
 * @param `playerOptions`: Optional @wavesurfer/react player options
 *
 * @details `startRecording`: Calling this method would result in the recording to start. Sets `isRecording` to true
 * @details `stopRecording`: This results in a recording in progress being stopped and the resulting audio being present in `recordingBlob`. Sets `isRecording` to false
 * @details `togglePauseResume`: Calling this method would pause the recording if it is currently running or resume if it is paused. Toggles the value `isPaused`
 * @details `recordingBlob`: This is the recording blob that is created after `stopRecording` has been called
 * @details `isRecording`: A boolean value that represents whether a recording is currently in progress
 * @details `isPaused`: A boolean value that represents whether a recording in progress is paused
 * @details `recordingTime`: Number of seconds that the recording has gone on. This is updated every second
 * @details `lastRecordingTime`: Number of seconds that the recording has gone on. This is updated every second (last recorded value)
 * @details `mediaRecorder`: The current mediaRecorder in use
 * @details `recordTimeLimit`: The time limit for the recording in seconds
 * @details `downloadingBlob`: A boolean value that represents whether the recording is currently being downloaded
 * @details `showVisualizer`: A boolean value that represents whether the visualizer is currently being shown
 * @details `visualizer`: Optional Visualizer component
 * @details `isSupported`: A boolean value that represents whether the Wake Lock Screen API is supported
 * @details `released`: A boolean value that represents whether the screen wake lock has been released
 * @details `request`: Request screen wake lock
 * @details `release`: Release screen wake lock
 * @details `player`: Optional @wavesurfer/react player for the recorded audio
 * @details `playerRef`: @wavesurfer/react player reference
 * @details `audio`: Audio string converted from recordingBlob blob
 * @details `isPlayingPlayer`: A boolean value that represents whether the player is currently playing
 * @details `currentTimePlayer`: The current time of the player
 * @details `onPlayPausePlayer`: Handle @wavesurfer/react Play/Pause the Player
 */

const useAudioRecorder = (
  Props: HARProps = {
    audioTrackConstraints: {
      noiseSuppression: true,
      echoCancellation: true,
    },
    mediaRecorderOptions: {
      audioBitsPerSecond: 128000,
    },
    downloadOnFinish: false,
    downloadFileExtension: "mp3",
    showVisualizer: false,
    wakeLock: false,
    wakeLockOptions: {
      onError: () => {},
      onRequest: () => {},
      onRelease: () => {},
    },
    player: false,
    playerOptions: PLAYER_OPTIONS_DEFAULT,
    onNotAllowedOrFound: () => {},
    onRecordingComplete: () => {},
  }
) => {
  const {
    audioTrackConstraints,
    mediaRecorderOptions,
    recordTimeLimit,
    downloadOnFinish,
    downloadFileExtension,
    showVisualizer,
    wakeLock,
    wakeLockOptions,
    player,
    playerOptions,
    onNotAllowedOrFound,
    onRecordingComplete,
  } = Props;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastRecordingTime, setLastRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [timerInterval, setTimerInterval] = useState<number>();
  const [recordingBlob, setRecordingBlob] = useState<Blob>();
  const [downloadingBlob, setDownloadingBlob] = useState<boolean>();
  const [audio, setAudio] = useState<string | null>(null);
  const [released, setReleased] = useState<boolean | undefined>();

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const playerRef = useRef(null);

  const _startTimer: () => void = useCallback(() => {
    const interval = setInterval(() => {
      setRecordingTime((time) => time + 1);
    }, 1000);
    setTimerInterval(interval);
  }, [setRecordingTime, setTimerInterval]);

  const _stopTimer: () => void = useCallback(() => {
    timerInterval != null && clearInterval(timerInterval);
    setTimerInterval(undefined);
  }, [timerInterval, setTimerInterval]);

  /**
   * Calling this method would result in the recording to start. Sets `isRecording` to true
   */
  const startRecording: () => void = useCallback(() => {
    if (timerInterval != null) return;

    navigator.mediaDevices
      .getUserMedia({ audio: audioTrackConstraints ?? true })
      .then((stream) => {
        setIsRecording(true);
        const recorder: MediaRecorder = new MediaRecorder(
          stream,
          mediaRecorderOptions
        );
        setMediaRecorder(recorder);
        recorder.start();
        _startTimer();

        recorder.addEventListener("dataavailable", (event) => {
          setRecordingBlob(event.data);
          recorder.stream.getTracks().forEach((t) => t.stop());
          setMediaRecorder(undefined);
        });
      })
      .catch((err: DOMException) => {
        console.log(err.name, err.message, err.cause);
        onNotAllowedOrFound?.(err);
      });
  }, [
    timerInterval,
    setIsRecording,
    setMediaRecorder,
    _startTimer,
    setRecordingBlob,
    onNotAllowedOrFound,
    mediaRecorderOptions,
  ]);

  /**
   * Calling this method results in a recording in progress being stopped and the resulting audio being present in `recordingBlob`. Sets `isRecording` to false
   */
  const stopRecording: () => void = useCallback(() => {
    mediaRecorder?.stop();
    _stopTimer();
    setLastRecordingTime(recordingTime);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  }, [
    recordingTime,
    mediaRecorder,
    setRecordingTime,
    setIsRecording,
    setIsPaused,
    _stopTimer,
  ]);

  const handleDownloadBlob = async (
    recordingBlob: Blob,
    downloadFileExtension: DownloadFileExtension
  ) => {
    setDownloadingBlob(true);
    await downloadBlob(recordingBlob, downloadFileExtension!);
    setDownloadingBlob(false);
  };

  /**
   * Calling this method would pause the recording if it is currently running or resume if it is paused. Toggles the value `isPaused`
   */
  const togglePauseResume: () => void = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      mediaRecorder?.resume();
      _startTimer();
    } else {
      setIsPaused(true);
      _stopTimer();
      mediaRecorder?.pause();
    }
  }, [mediaRecorder, setIsPaused, _startTimer, _stopTimer]);

  // https://caniuse.com/mdn-api_wakelock
  const isSupported = typeof window !== "undefined" && "wakeLock" in navigator;

  /**
   * Request screen wake lock
   */
  const request = useCallback(
    async (type: WakeLockType = "screen") => {
      const isWakeLockAlreadyDefined = wakeLockRef.current != null;
      if (!isSupported) {
        return warn(
          "Calling the `request` function has no effect, Wake Lock Screen API isn't supported"
        );
      }
      if (isWakeLockAlreadyDefined) {
        return warn(
          "Calling `request` multiple times without `release` has no effect"
        );
      }

      try {
        wakeLockRef.current = await navigator.wakeLock.request(type);

        wakeLockRef.current.onrelease = (e: Event) => {
          // Default to `true` - `released` API is experimental: https://caniuse.com/mdn-api_wakelocksentinel_released
          setReleased(
            (wakeLockRef.current && wakeLockRef.current.released) || true
          );
          wakeLockOptions?.onRelease && wakeLockOptions?.onRelease(e);
          wakeLockRef.current = null;
        };

        wakeLockOptions?.onRequest && wakeLockOptions?.onRequest();
        setReleased(
          (wakeLockRef.current && wakeLockRef.current.released) || false
        );
      } catch (error: any) {
        wakeLockOptions?.onError && wakeLockOptions?.onError(error);
      }
    },
    [
      isSupported,
      wakeLockOptions?.onRequest,
      wakeLockOptions?.onError,
      wakeLockOptions?.onRelease,
    ]
  );

  /**
   * Release screen wake lock
   */
  const release = useCallback(async () => {
    const isWakeLockUndefined = wakeLockRef.current == null;
    if (!isSupported) {
      return warn(
        "Calling the `release` function has no effect, Wake Lock Screen API isn't supported"
      );
    }

    if (isWakeLockUndefined) {
      return warn("Calling `release` before `request` has no effect.");
    }

    wakeLockRef.current && (await wakeLockRef.current.release());
  }, [isSupported]);

  /**
   * handle onRecordingCompletem optional callback as handleDownloadBlob
   */
  useEffect(() => {
    if (!!recordingBlob && typeof onRecordingComplete === "function") {
      onRecordingComplete(recordingBlob);
      // convert blob to audio string
      setAudio(URL.createObjectURL(recordingBlob));

      if (downloadOnFinish) {
        handleDownloadBlob(recordingBlob, downloadFileExtension!);
      }
    }
  }, [recordingBlob]);

  /**
   * handle if timeout is reached, optional callback as wakeLock
   */
  useEffect(() => {
    if (isRecording) {
      // stop if recording time is more than recordTimeLimit
      if (!!recordTimeLimit && recordingTime >= recordTimeLimit) {
        stopRecording();
      }
      // request screen wake lock
      if (isSupported && wakeLock) {
        request();
      }
    } else {
      // release screen wake lock
      if (isSupported && wakeLock) {
        release();
      }
    }
  }, [isRecording, recordingTime, recordTimeLimit, wakeLock, isSupported]);

  /**
   * Optional Visualizer component
   */
  const visualizer = useMemo(
    () =>
      showVisualizer && mediaRecorder ? (
        <Suspense fallback={<></>}>
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            barWidth={2}
            gap={2}
            width={140}
            height={30}
            fftSize={512}
            maxDecibels={-10}
            minDecibels={-80}
            smoothingTimeConstant={0.4}
          />
        </Suspense>
      ) : null,
    [showVisualizer, mediaRecorder]
  );

  /**
   * @wavesurfer/react Hook for the recording in Player
   */
  const {
    wavesurfer,
    isPlaying: isPlayingPlayer,
    currentTime: currentTimePlayer,
  } = useWavesurfer({
    ...PLAYER_OPTIONS_DEFAULT,
    ...playerOptions,
    container: playerRef,
    url: audio ?? "",
    duration: recordingTime,
  });

  /**
   * Handle @wavesurfer/react Play/Pause the Player
   */
  const onPlayPausePlayer = useCallback(() => {
    player && wavesurfer && wavesurfer.playPause();
  }, [wavesurfer, player]);

  return {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    lastRecordingTime,
    mediaRecorder,
    recordTimeLimit,
    downloadingBlob,
    showVisualizer,
    visualizer,
    isSupported,
    released,
    request,
    release,
    player,
    playerRef,
    audio,
    isPlayingPlayer,
    currentTimePlayer,
    onPlayPausePlayer,
  };
};

export default useAudioRecorder;
