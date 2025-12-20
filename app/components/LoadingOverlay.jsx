"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header.jsx";

const check1 = "/assets/check_1.png";
const check2 = "/assets/check_2.png";

const DEFAULT_LOADING_VIDEO = {
  id: "default-loading-video",
  platform: "youtube",
  videoId: "ipIU_qeHwk8",
  videoUrl: "https://youtu.be/ipIU_qeHwk8",
};

const parseCsv = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx] ?? "";
      return acc;
    }, {});
  });
};

const normalizeVideoRow = (row) => {
  const videoId = row.video_id || row.videoId || "";
  const videoUrl = row.video_url || row.videoUrl || "";
  const platform = (row.platform || "").toLowerCase() || "youtube";

  return {
    id: row.id || videoId || videoUrl || `video-${Math.random().toString(36).slice(2, 8)}`,
    platform,
    videoId,
    videoUrl,
  };
};

const withAutoplayParams = (url, params = "autoplay=1&mute=1&controls=0") => {
  if (!url) return url;
  if (url.includes("autoplay=")) return url;

  const [base, fragment] = url.split("#");
  const separator = base.includes("?") ? "&" : "?";
  const nextUrl = `${base}${separator}${params}`;
  return fragment ? `${nextUrl}#${fragment}` : nextUrl;
};

const extractDriveId = (value = "") => {
  const trimmed = value.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)\//) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
};

const extractYoutubeId = (value = "") => {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([0-9A-Za-z_-]{11})/);
  return match?.[1] || null;
};

const resolvePlayerSource = (video) => {
  if (!video) return null;

  const platform = (video.platform || "").toLowerCase();

  if (platform === "drive" || (video.videoUrl || "").includes("drive.google.com")) {
    const driveId = extractDriveId(video.videoId || video.videoUrl);
    if (!driveId) {
      return video.videoUrl ? { type: "iframe", src: withAutoplayParams(video.videoUrl, "autoplay=1&mute=1&muted=1") } : null;
    }
    const params = "autoplay=1&mute=1&muted=1&controls=0&loop=1";
    const src = `https://drive.google.com/file/d/${driveId}/preview?${params}`;
    return { type: "iframe", src };
  }

  if (platform === "youtube") {
    const youtubeId = extractYoutubeId(video.videoId || video.videoUrl);
    if (!youtubeId) return null;

    const params = `autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${youtubeId}`;
    return { type: "iframe", src: `https://www.youtube.com/embed/${youtubeId}?${params}` };
  }

  if (platform === "direct" || /\.mp4($|\?)/.test(video.videoUrl || "")) {
    return video.videoUrl ? { type: "video", src: video.videoUrl } : null;
  }

  if (video.videoUrl) {
    return { type: "iframe", src: withAutoplayParams(video.videoUrl) };
  }

  return null;
};

const pickRandomVideo = (videos) => {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  const index = Math.floor(Math.random() * videos.length);
  return videos[index];
};

export default function LoadingOverlay() {
  const [secondCheckOngoing, setSecondCheckOngoing] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(DEFAULT_LOADING_VIDEO);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSecondCheckOngoing(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLoadingVideos = async () => {
      try {
        const response = await fetch("/loading_videos.csv", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        const parsedVideos = parseCsv(csvText)
          .map(normalizeVideoRow)
          .filter((video) => video.videoId || video.videoUrl);

        if (!isMounted) return;

        const randomVideo = pickRandomVideo(parsedVideos);
        if (randomVideo) {
          setLoadingVideo(randomVideo);
        } else {
          setLoadingVideo(DEFAULT_LOADING_VIDEO);
        }
      } catch (error) {
        console.warn("[loading-overlay] 영상 목록 로드 실패, 기본 영상 사용", error);
        if (isMounted) {
          setLoadingVideo(DEFAULT_LOADING_VIDEO);
        }
      }
    };

    loadLoadingVideos();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStopButton = () => {
    router.push("/");
  };

  const playerSource = resolvePlayerSource(loadingVideo);

  return (
    <>
      <Header />
      <div className="loading-overlay">
        {playerSource && (
          <div className="loading-hero-video">
            {playerSource.type === "video" ? (
              <video
                className="loading-video-player"
                src={playerSource.src}
                autoPlay
                loop
                muted
                playsInline
                controls
              />
            ) : (
              <iframe
                className="loading-video-iframe"
                src={playerSource.src}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                title="로딩 중 안내 영상"
              ></iframe>
            )}
          </div>
        )}
        <p className="loading-text">잠시만 기다려주세요.</p>
        <h1 className="loading-title">AI가 열심히 문제를 출제중이에요!</h1>
        <div className="loading-progress-container">
          <div className="loading-progress-check first ongoing">
            <img className="loading-progress-img" src={check1} alt="check_1" />
            <p className="loading-progress-text">패턴 - 유형별 문제 생성중</p>
          </div>
          <div className={`loading-progress-check second ${secondCheckOngoing ? "ongoing" : ""}`}>
            <img
              className="loading-progress-img"
              src={secondCheckOngoing ? check1 : check2}
              alt="check"
            />
            <p className="loading-progress-text">난이도별 문제 정리중</p>
          </div>
        </div>
        <div className="stop-container">
          <button className="stop-button" onClick={handleStopButton}>
            문제출제 멈추기
          </button>
        </div>
      </div>
    </>
  );
}
