"use client";

export default function YoutubeFrame({ videoId }) {
  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="youtube-container">
      <iframe
        className="youtube-iframe"
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="youtube-video"
      ></iframe>
    </div>
  );
}
