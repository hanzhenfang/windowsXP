export function useSystemAudio() {
  function play(audio: HTMLAudioElement | undefined) {
    if (!audio) return
    const result = audio.play()
    if (result) result.catch(() => { /* Browsers may block audio until a user gesture. */ })
  }
  return { play }
}
