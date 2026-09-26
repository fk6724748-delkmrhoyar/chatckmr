import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "../lib/store";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  BadgeCheck,
  SwitchCamera,
} from "lucide-react";

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function CallScreen() {
  const { activeCall, users, answerCall, endCall } = useAppStore();
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [cameraOn, setCameraOn] = useState(activeCall?.type === "video");
  const [frontCamera, setFrontCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const peer = users.find((u) => u.uid === activeCall?.peerId);

  // Ringing -> answered (local demo signalling)
  useEffect(() => {
    if (!activeCall || activeCall.status !== "ringing") return;
    const t = setTimeout(() => answerCall(), 3500);
    return () => clearTimeout(t);
  }, [activeCall?.id, activeCall?.status]);

  // Duration timer
  useEffect(() => {
    if (activeCall?.status !== "answered") return;
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(i);
  }, [activeCall?.status]);

  // Media (mic + camera)
  useEffect(() => {
    let cancelled = false;
    const open = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video:
            activeCall?.type === "video" && cameraOn
              ? { facingMode: frontCamera ? "user" : "environment" }
              : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("Media permission denied", err);
      }
    };
    if (activeCall) open();
    return () => {
      cancelled = true;
    };
  }, [activeCall?.id, cameraOn, frontCamera]);

  // Mute toggle
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }, [muted]);

  const hangUp = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    endCall();
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!activeCall || !peer) return null;

  const isVideo = activeCall.type === "video";
  const ringing = activeCall.status === "ringing";

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0b141a] text-white flex flex-col">
      {isVideo && cameraOn && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      )}
      {(!isVideo || !cameraOn) && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#134d3b] via-[#0b141a] to-black" />
      )}

      <div className="relative z-10 flex flex-col items-center pt-16 flex-1">
        {(!isVideo || !cameraOn) && (
          <img
            src={peer.photoURL}
            alt={peer.displayName}
            className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white/10 mb-6"
          />
        )}
        <h2 className="text-2xl font-medium flex items-center gap-1.5">
          {peer.displayName}
          {peer.isVerified && (
            <BadgeCheck size={20} className="text-white fill-[#1da1f2]" />
          )}
        </h2>
        <p className="text-white/70 mt-2 text-[15px]">
          {ringing
            ? `Ringing… ${isVideo ? "Video call" : "Voice call"}`
            : formatDuration(elapsed)}
        </p>
        <p className="text-white/40 mt-1 text-[12px]">End-to-end encrypted</p>
      </div>

      {isVideo && cameraOn && (
        <div className="absolute top-6 right-4 w-28 h-40 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black/50 z-10">
          <video
            autoPlay
            muted
            playsInline
            ref={(el) => {
              if (el && streamRef.current) el.srcObject = streamRef.current;
            }}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="relative z-10 pb-12 px-6">
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => setMuted(!muted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-white text-[#0b141a]" : "bg-white/15 hover:bg-white/25"}`}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={() => setSpeaker(!speaker)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${speaker ? "bg-white/15 hover:bg-white/25" : "bg-white text-[#0b141a]"}`}
            title="Speaker"
          >
            {speaker ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>

          {isVideo && (
            <>
              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${cameraOn ? "bg-white/15 hover:bg-white/25" : "bg-white text-[#0b141a]"}`}
                title="Camera"
              >
                {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
              </button>
              <button
                onClick={() => setFrontCamera(!frontCamera)}
                className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                title="Switch camera"
              >
                <SwitchCamera size={24} />
              </button>
            </>
          )}

          <button
            onClick={hangUp}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title="End call"
          >
            <PhoneOff size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
