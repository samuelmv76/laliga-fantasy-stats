import { useState } from 'react'

function hueFromName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash % 360
}

function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Si existe /crests/<equipo>.png (colócalo tú, con licencia para usarlo) se
// muestra el escudo real. Si no, cae a una insignia con las iniciales del
// equipo y un color estable derivado del nombre.
export default function TeamCrest({ team, size = 18 }: { team: string; size?: number }) {
  const [broken, setBroken] = useState(false)

  if (!broken) {
    return (
      <img
        className="inline-flex shrink-0 object-contain"
        src={`/crests/${slugify(team)}.png`}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[30%] font-display font-bold leading-none text-white"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `oklch(0.55 0.13 ${hueFromName(team)})`,
      }}
    >
      {initials(team)}
    </span>
  )
}
