"use client";

import { useState } from "react";

/** 干员头像,带 onError 兜底:图标加载失败(比如自定义干员没配 icon)就退化成首字母圆形头像 */
export default function OperatorAvatar({
  icon,
  name,
  color,
  size = 28,
}: {
  icon?: string;
  name: string;
  color: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);

  if (icon && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={name}
        onError={() => setErrored(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
