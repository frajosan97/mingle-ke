// resources/js/hooks/conversations/use-audio-recorder.ts
import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED_AUDIO_MIMES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
] as const;

const extensionForAudioMime = (mime: string): string => {
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
    if (mime.includes("wav")) return "wav";
    return "webm";
};

interface Options {
    disabled?: boolean;
    onComplete: (file: File) => void;
}

export function useAudioRecorder({ disabled, onComplete }: Options) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const stopTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const start = useCallback(async () => {
        if (disabled || isRecording || mediaRecorderRef.current) return;
        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === "undefined"
        ) {
            console.error("Audio recording is not supported in this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (mediaRecorderRef.current) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }

            const resolvedMime =
                PREFERRED_AUDIO_MIMES.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
            if (!resolvedMime) {
                console.error("No audio-only recording format is supported.");
                stream.getTracks().forEach((t) => t.stop());
                return;
            }

            const recorder = new MediaRecorder(stream, { mimeType: resolvedMime });
            mediaRecorderRef.current = recorder;
            recordingStreamRef.current = stream;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                stopTimer();
                const rawType = recorder.mimeType || resolvedMime;
                const normalisedType = rawType.startsWith("video/")
                    ? rawType.replace(/^video\//, "audio/")
                    : rawType;

                const blob = new Blob(audioChunksRef.current, { type: normalisedType });
                const file = new File(
                    [blob],
                    `voice-note-${Date.now()}.${extensionForAudioMime(normalisedType)}`,
                    { type: normalisedType },
                );

                stream.getTracks().forEach((t) => t.stop());
                recordingStreamRef.current = null;
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
                setIsRecording(false);
                setRecordingTime(0);

                if (file.size > 0) onCompleteRef.current(file);
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
        } catch (err) {
            console.error("Could not access the microphone:", err);
            recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
            recordingStreamRef.current = null;
            mediaRecorderRef.current = null;
            setIsRecording(false);
        }
    }, [disabled, isRecording, stopTimer]);

    const stop = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (recorder?.state === "recording") recorder.stop();
    }, []);

    const cancel = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        stopTimer();
        if (recorder) {
            recorder.onstop = null;
            if (recorder.state !== "inactive") recorder.stop();
        }
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
    }, [stopTimer]);

    useEffect(() => {
        return () => {
            stopTimer();
            const recorder = mediaRecorderRef.current;
            if (recorder) {
                recorder.onstop = null;
                if (recorder.state !== "inactive") recorder.stop();
            }
            recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [stopTimer]);

    return { isRecording, recordingTime, start, stop, cancel };
}