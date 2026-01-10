import Phaser from "phaser";

type PlayMusicOpts = {
  loop?: boolean;
  volume?: number;
};

class AudioManager {
  private inited = false;
  private sound?: Phaser.Sound.BaseSoundManager;

  private soundEnabled = true;

  private currentMusicKey: string | null = null;
  private currentMusic?: Phaser.Sound.BaseSound;

  private currentExclusiveSfx?: Phaser.Sound.BaseSound;

  private readonly masterVolume = 0.2;

  init(game: Phaser.Game) {
    if (this.inited) return;
    this.inited = true;
    this.sound = game.sound;
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;

    if (!enabled) {
      this.stopMusic();
      this.stopExclusiveSfx();
      this.sound?.stopAll();
      return;
    }

    if (this.currentMusicKey) {
      this.playMusic(this.currentMusicKey, { loop: true });
    }
  }

  playMusic(key: string, opts: PlayMusicOpts = {}) {
    if (!this.sound) throw new Error("Audio.init(game) must be called before using Audio.");

    this.currentMusicKey = key;

    if (!this.soundEnabled) return;

    if (this.currentMusic && this.currentMusic.isPlaying && this.currentMusic.key === key) return;

    this.stopMusic();

    const relVol = opts.volume ?? 1;

    const music = this.sound.add(key, {
      loop: opts.loop ?? true,
      volume: relVol * this.masterVolume
    });

    this.currentMusic = music;
    music.play();
  }

  playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (!this.sound) throw new Error("Audio.init(game) must be called before using Audio.");
    if (!this.soundEnabled) return;

    const relVol = config?.volume ?? 1;

    const cfg: Phaser.Types.Sound.SoundConfig = {
      ...(config ?? {}),
      volume: relVol * this.masterVolume
    };

    this.sound.play(key, cfg);
  }

  private stopExclusiveSfx() {
    if (!this.currentExclusiveSfx) return;

    this.currentExclusiveSfx.stop();
    this.currentExclusiveSfx.destroy();
    this.currentExclusiveSfx = undefined;
  }

  playExclusiveSfx(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (!this.sound) throw new Error("Audio.init(game) must be called before using Audio.");
    if (!this.soundEnabled) return;

    this.stopExclusiveSfx();

    const relVol = config?.volume ?? 1;

    const cfg: Phaser.Types.Sound.SoundConfig = {
      ...(config ?? {}),
      volume: relVol * this.masterVolume
    };

    const sfx = this.sound.add(key, cfg);
    this.currentExclusiveSfx = sfx;

    sfx.once(Phaser.Sound.Events.COMPLETE, () => {
      if (this.currentExclusiveSfx === sfx) {
        this.currentExclusiveSfx = undefined;
      }
      sfx.destroy();
    });

    sfx.play();
  }

  stopMusic() {
    if (!this.currentMusic) return;

    this.currentMusic.stop();
    this.currentMusic.destroy();
    this.currentMusic = undefined;
  }

  stopAll() {
    if (!this.sound) return;

    this.stopMusic();
    this.stopExclusiveSfx();

    this.sound.stopAll();

    this.currentMusicKey = null;
  }

  stopMusicIfKey(key: string) {
    if (this.currentMusicKey !== key) return;
    this.stopMusic();
  }
}

export const Audio = new AudioManager();
