"use client";

import PropTypes from "prop-types";

export default function ChapterCard({
  className = "",
  image = "",
  title,
  tags,
  onSelect,
}) {
  return (
    <div className={`chapter-card ${className}`} onClick={onSelect} role="button" tabIndex={0}>
      <div className={`card-container ${className}`}>
        <div className="card-header">
          {image && <img src={image} alt={`${title} 이미지`} className="chapter-image" />}
          <span className={`chapter-title ${className}`}>{title}</span>
        </div>
      </div>
      <div className="chapter-content">
        <div className="chapter-tags">
          {tags.map((tag) => (
            <span className={`tag-box ${className}`} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

ChapterCard.propTypes = {
  className: PropTypes.string,
  image: PropTypes.string,
  title: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
};
