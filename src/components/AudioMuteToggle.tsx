import { Volume2, VolumeX } from 'lucide-react';
import React, { useState } from "react";
import soundManager from "../utils/sound.ts";

interface AudioMuteToggleProps { }

const AudioMuteToggle: React.FC<AudioMuteToggleProps> = ({ }) => {
    const [isMuted, setMutedState] = useState(soundManager.isMuted())
    function toggleMute(): void {
        soundManager.muteToggle();
        setMutedState(soundManager.isMuted());
    }

    return (
        <button
            onClick={toggleMute}
            className="fixed top-4 right-4 z-50 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            title={isMuted ? "Enable Audio" : "Disable Audio"}
        >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
    )
}

export default AudioMuteToggle;