const MOBILE_USER_AGENT_REGEX =
  /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Mobi)/i;

export function isMobileUserAgent(userAgent = "") {
  return MOBILE_USER_AGENT_REGEX.test(userAgent);
}

