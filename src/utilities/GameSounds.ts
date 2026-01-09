import Phaser from "phaser";

type PlayMusicOpts = {
  loop?: boolean;
  volume?: number;
};

class AudioManager {
  private inited = false;
  private sound?: Phaser.Sound.BaseSoundManager;

  private musicEnabled = true;

  private currentMusicKey: string | null = null;
  private currentMusic?: Phaser.Sound.BaseSound;

  init(game: Phaser.Game) {
    if (this.inited) return;
    this.inited = true;
    this.sound = game.sound;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;

    if (!enabled) {
      this.stopMusic();
      return;
    }

    if (this.currentMusicKey) {
      this.playMusic(this.currentMusicKey, { loop: true });
    }
  }

  playMusic(key: string, opts: PlayMusicOpts = {}) {
    if (!this.sound) throw new Error("Audio.init(game) must be called before using Audio.");

    this.currentMusicKey = key;

    if (!this.musicEnabled) return;

    if (this.currentMusic && this.currentMusic.isPlaying && this.currentMusic.key === key) return;

    this.stopMusic();

    const music = this.sound.add(key, {
      loop: opts.loop ?? true,
      volume: opts.volume ?? 1
    });

    this.currentMusic = music;
    music.play();
  }

  stopMusic() {
    if (!this.currentMusic) return;

    this.currentMusic.stop();
    this.currentMusic.destroy();
    this.currentMusic = undefined;
  }

  stopMusicIfKey(key: string) {
    if (this.currentMusicKey !== key) return;
    this.stopMusic();
  }
}

export const Audio = new AudioManager();
