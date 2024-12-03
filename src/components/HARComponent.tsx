import useAudioRecorder from "../hooks/useRecorder";

const HARComponent = (): JSX.Element => {
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
};

export default HARComponent;
