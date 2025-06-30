enum Background { IntoMusic, HoldBallNoise, GameplayeMusic }
class SoundManager {
    private muted: boolean = false;
    private audioBackground = new Audio();
    private backgroundMusic: Background | null = null;
    private audioAction = new Audio();
    private ballHitsPaddle: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//ball-hits-paddle.mp3",
        volume: 1.0,
        loop: false
    }
    private ballPressed: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//ball-pressed.mp3",
        volume: 1.0,
        loop: false
    }
    private enemyHit: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//enemy-hit.mp3",
        volume: 1.0,
        loop: false
    }
    private gameOver: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//game-over.mp3",
        volume: 1.0,
        loop: false
    }
    private gameplaySoundtrack: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//gameplay-soundtrack.mp3",
        volume: 0.5,
        loop: true
    }
    private introScreen: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//intro-screen.mp3",
        volume: 1.0,
        loop: true
    }
    private ligmaBalls: SoundConfig = {
        url: "https://ivaiacgqwatkujvyrntd.supabase.co/storage/v1/object/public/the-seer-of-ligma//ligma-balls.mp3",
        volume: 1.0,
        loop: false
    }

    constructor() {
        this.backgroundMusic = null;
        this.playIntroScreen();
    }

    private setBackground(soundCfg: SoundConfig): void {
        setSoundConfigToAudio(this.audioBackground, soundCfg);
    }

    private setAction(soundCfg: SoundConfig): void {
        setSoundConfigToAudio(this.audioAction, soundCfg);
    }

    public playBallHitsPaddle(): void {
        playSoundConfigOnce(this.ballHitsPaddle);
    }

    public playBallPressed(): void {
        if (this.backgroundMusic !== Background.HoldBallNoise) {
            this.setBackground(this.ballPressed);
            this.backgroundMusic = Background.HoldBallNoise;
        }
    }

    public playEnemyHit(): void {
        playSoundConfigOnce(this.enemyHit)
    }

    public playGameOver(): void {
        this.setAction(this.gameOver);
    }

    public playGameplaySoundtrack(): void {
        if (this.backgroundMusic !== Background.GameplayeMusic) {
            this.setBackground(this.gameplaySoundtrack);
            this.backgroundMusic = Background.GameplayeMusic;
        }
    }

    public playIntroScreen(): void {
        // if (this.backgroundMusic !== Background.IntoMusic) {
        // }
        this.backgroundMusic = Background.IntoMusic
        this.setBackground(this.introScreen);

    }

    public playLigmaBalls(): void {
        this.setAction(this.ligmaBalls);
    }

    public mute(): void {
        this.muted = true;
        this.setMute(true);
    }

    public unmute(): void {
        this.muted = false;
        this.setMute(false);
    }

    private setMute(muted: boolean): void {
        this.audioAction.muted = muted;
        this.audioBackground.muted = muted;
    }

    public muteToggle(): void {
        this.muted ? this.unmute() : this.mute();
    }

    public isMuted(): boolean {
        return this.muted;
    }
}

type SoundConfig = {
    url: string;
    volume: number;
    loop: boolean;
}

function playSoundConfigOnce(soundConfig: SoundConfig) {
    const audio = new Audio();
    setSoundConfigToAudio(audio, soundConfig);
}

function setSoundConfigToAudio(audio: HTMLAudioElement, soundCfg: SoundConfig): void {
    audio.volume = soundCfg.volume
    audio.loop = soundCfg.loop
    audio.src = soundCfg.url
    audio.load();
    audio.play();
}

const soundManager = new SoundManager();
export default soundManager;