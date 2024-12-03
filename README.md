# Headless React Audio Recorder and Player (Headless Recorder)

## Overview

Headless Recorder is an open-source project for a React-based audio recorder and player. It provides a headless implementation that allows developers to easily integrate audio recording and playback functionalities into their applications without dealing with UI components.

Ideally fit for design branding solutions.

## Features

- **Audio Recording:** Capture high-quality audio from the user's microphone.
- **Audio Playback:** Play recorded audio with customizable controls.
- **Headless Implementation:** Allows for full control over the UI, providing only the essential functionality.
- **Easy Integration:** Simple and intuitive API for seamless integration into any React project.
- **Customizable:** Flexible architecture that supports extensions and customizations.
- **Save Record on Finish:** Automatically saves the recorded audio file when the recording process is completed.
- **Recording Process Visualization:** Provides visual feedback and indicators during the recording process to help users understand the status and duration of the recording.
- **Screen Wake:** Keeps the screen awake during the recording process to prevent interruptions and ensure continuous recording.

## Installation

To install Headless Recorder, run the following command in your project directory:

```bash
npm i headless-react-audio-recorder
```

## Idea

Creating headless UI Recorder components allows developers to easily integrate audio recording and playback functionalities while maintaining complete control over the design and branding. It offers flexibility in customizing the user interface, ensuring that the components can match any design system or brand identity seamlessly. By separating the functionality from the presentation layer, it simplifies maintenance, enhances reusability, and ensures a consistent user experience across different projects and contexts. This approach is especially beneficial for projects that require unique and tailored user interfaces.

Inspired of the idea of [Shadcn](https://ui.shadcn.com/), [headlessui](https://headlessui.com), and others.

## Usage

Use single **useAudioRecorder** hook for all actions:

```js
import { useAudioRecorder } from "headless-react-audio-recorder";

function App() {
  // use single hook for all actions
  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    lastRecordingTime,
    recordTimeLimit,
    downloadingBlob,
    showVisualizer,
    visualizer,
    audio,
    player,
    playerRef,
    isPlayingPlayer,
    onPlayPausePlayer,
  } = useAudioRecorder({
    onRecordingComplete: (blob: Blob) => {
      console.log("recording complete", blob);
    },
    recordTimeLimit: 180,
    downloadOnFinish: false,
    showVisualizer: true,
    wakeLock: true,
    wakeLockOptions: {
      onError: (error) => {
        console.error("Wake Lock request failed", error);
      },
      onRequest: () => {
        console.log("Wake Lock is active");
      },
      onRelease: () => {
        console.log("Wake Lock is released");
      },
    },
    player: true,
    playerOptions: {
      waveColor: "#570df8",
      progressColor: "#00126e",
    },
  });

  // user defined function to format time
  const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
      .map((v) => `0${Math.floor(v)}`.slice(-2))
      .join(":");

  return (
    <div>
      {/* Record Action  */}
      {!isRecording && (
        <button onClick={() => startRecording()}>
          {lastRecordingTime ? `Start over` : `Record`}
        </button>
      )}

      {/* resume/pause Action  */}
      {(isRecording || isPaused) && (
        <button onClick={togglePauseResume}>
          {isPaused ? "resume" : "pause"}
        </button>
      )}

      {(isRecording || isPaused) && (
        <button onClick={stopRecording}>Finish</button>
      )}

      {/* possible range indicator  */}
      <div>
        {!recordingBlob && !!recordTimeLimit && (isRecording || isPaused) && (
          <input
            type="range"
            min={0}
            max={recordTimeLimit}
            value={recordingTime}
          />
        )}
      </div>

      {/* Recording Time parsed */}
      {(isRecording || isPaused || recordingBlob) && (
        <p className="text-sm font-thin">{`${formatTime(
          isRecording ? recordingTime : lastRecordingTime
        )} ${!!recordTimeLimit ? ` / ${formatTime(recordTimeLimit)}` : ""}`}</p>
      )}

      {/* Recording Time Blob */}
      <p>recording Time: {recordingTime}</p>

      {/* last Recording Blob */}
      <p>last recording Time: {lastRecordingTime}</p>

      {/* Record Blob */}
      {downloadingBlob && <p>record is downloading...</p>}

      {/* Optional visualizer */}
      {showVisualizer && isRecording ? <div>{visualizer}</div> : null}

      {/* Optional Built-In player */}
      {audio && player && !isRecording && (
        <div>
          <div ref={playerRef} />

          <button onClick={onPlayPausePlayer} disabled={!audio}>
            {isPlayingPlayer ? "Pause" : "Play"}
          </button>
        </div>
      )}

      {/* Optional HTML5 player */}
      {audio && player && !isRecording && (
        <div>
          <audio controls src={audio} />
        </div>
      )}
    </div>
  );
}

export default App;
```

## Under the hood implementation

- limited hooks taken from [react-audio-voice-recorder](https://www.npmjs.com/package/react-audio-voice-recorder), without ui
- optional visualizer during recording [react-audio-visualize](https://www.npmjs.com/package/react-audio-visualize)
- optional saving record on finish provided by [@ffmpeg](https://www.npmjs.com/package/@ffmpeg/ffmpeg)
- optional Screen Wake Lock API, limited hooks taken from [react-screen-wake-lock](https://www.npmjs.com/package/react-screen-wake-lock)
- optional player of recorded voice (as a replacement of html5 built-in player), hooks of [@wavesurfer/react](https://github.com/katspaugh/wavesurfer-react) with all listed [options](https://wavesurfer.xyz/examples/?all-options.js)

## Props

| Parameter/Details       | Description                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audioTrackConstraints` | Takes a [subset](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings#instance_properties_of_audio_tracks) of `MediaTrackConstraints` that apply to the audio track |
| `onNotAllowedOrFound`   | A method that gets called when the getUserMedia promise is rejected. It receives the `DOMException` as its input.                                                                  |
| `onRecordingComplete`   | Callback of finished recording. Returns the blob of the recording.                                                                                                                 |
| `mediaRecorderOptions`  | Options for the `MediaTrackConstraints` type [subset](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#instance_properties)                                          |
| `downloadFileExtension` | File extension for the audio file that gets downloaded.                                                                                                                            |
| `downloadOnFinish`      | Optional downloading the recording after finish.                                                                                                                                   |
| `showVisualizer`        | Optional show visualizer while recording.                                                                                                                                          |
| `wakeLock`              | Optional screen wake lock.                                                                                                                                                         |
| `wakeLockOptions`       | Optional screen wake lock options.                                                                                                                                                 |
| `player`                | Optional @wavesurfer/react player for the recorded audio.                                                                                                                          |
| `playerOptions`         | Optional @wavesurfer/react player options.                                                                                                                                         |
| `startRecording`        | Calling this method starts the recording. Sets `isRecording` to true.                                                                                                              |
| `stopRecording`         | Stops a recording in progress and saves the resulting audio in `recordingBlob`. Sets `isRecording` to false.                                                                       |
| `togglePauseResume`     | Pauses the recording if it is running, or resumes if it is paused. Toggles the value `isPaused`.                                                                                   |
| `recordingBlob`         | The recording blob created after `stopRecording` has been called.                                                                                                                  |
| `isRecording`           | A boolean value that represents whether a recording is currently in progress.                                                                                                      |
| `isPaused`              | A boolean value that represents whether a recording in progress is paused.                                                                                                         |
| `recordingTime`         | Number of seconds that the recording has gone on. Updated every second.                                                                                                            |
| `lastRecordingTime`     | Number of seconds that the recording has gone on. Updated every second (last recorded value).                                                                                      |
| `mediaRecorder`         | The current mediaRecorder in use.                                                                                                                                                  |
| `recordTimeLimit`       | The time limit for the recording in seconds.                                                                                                                                       |
| `downloadingBlob`       | A boolean value that represents whether the recording is currently being downloaded.                                                                                               |
| `showVisualizer`        | A boolean value that represents whether the visualizer is currently being shown.                                                                                                   |
| `visualizer`            | Optional Visualizer component.                                                                                                                                                     |
| `isSupported`           | A boolean value that represents whether the Wake Lock Screen API is supported.                                                                                                     |
| `released`              | A boolean value that represents whether the screen wake lock has been released.                                                                                                    |
| `request`               | Request screen wake lock.                                                                                                                                                          |
| `release`               | Release screen wake lock.                                                                                                                                                          |
| `player`                | Optional @wavesurfer/react player for the recorded audio.                                                                                                                          |
| `playerRef`             | @wavesurfer/react player reference.                                                                                                                                                |
| `audio`                 | Audio string converted from `recordingBlob` blob.                                                                                                                                  |
| `isPlayingPlayer`       | A boolean value that represents whether the player is currently playing.                                                                                                           |
| `currentTimePlayer`     | The current time of the player.                                                                                                                                                    |
| `onPlayPausePlayer`     | Handle @wavesurfer/react Play/Pause the Player.                                                                                                                                    |

## Contributing

We welcome contributions from the community! If you would like to contribute, please follow these steps:

- Fork the repository.

- Create a new branch for your feature or bug fix.

- Make your changes and commit them.

- Push your changes to your forked repository.

- Create a pull request to the main repository.

## License

This project is licensed under the MIT License. See the LICENSE file for more information.

Feel free to customize this template to fit the specifics of your project. If you need any help with additional details or sections, just let me know! 😊
