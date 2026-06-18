export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/svg+xml";

export default function Icon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0f172a"/>
      <path d="M8 20L12 16L16 20L24 12" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="12" r="2" fill="#10b981"/>
      <path d="M8 24H24" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}
