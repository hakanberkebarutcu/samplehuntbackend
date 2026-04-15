import numpy as np
import librosa
import scipy.signal as signal
from scipy.stats import zscore

class AudioAnalyzer:
    def __init__(self):
        self.SAMPLE_RATE = 22050

    def analyze_audio(self, audio_path):
        try:
            y, sr = librosa.load(audio_path, sr=self.SAMPLE_RATE, duration=120)
            if len(y) < self.SAMPLE_RATE * 10:
                return {"bpm": None, "key": None, "energy": None}

            bpm = self._detect_bpm(y, sr)
            key = self._detect_key(y, sr)
            energy = self._calculate_energy(y)

            return {"bpm": bpm, "key": key, "energy": energy}
        except Exception as e:
            return {"bpm": None, "key": None, "energy": None}

    def _detect_bpm(self, y, sr):
        try:
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            tempo = librosa.beat.tempo(onset_envelope=onset_env, sr=sr)[0]
            return int(round(tempo))
        except:
            return None

    def _detect_key(self, y, sr):
        try:
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            chroma_mean = np.mean(chroma, axis=1)
            notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            key_idx = np.argmax(chroma_mean)
            mode = self._determine_mode(chroma_mean)
            key = notes[key_idx] + ('m' if mode == 'minor' else '')
            return key
        except:
            return None

    def _determine_mode(self, chroma):
        try:
            major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
            minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
            major_corr = np.corrcoef(zscore(chroma), zscore(major_profile))[0, 1]
            minor_corr = np.corrcoef(zscore(chroma), zscore(minor_profile))[0, 1]
            return 'major' if major_corr > minor_corr else 'minor'
        except:
            return 'major'

    def _calculate_energy(self, y):
        try:
            return float(np.mean(y ** 2))
        except:
            return None