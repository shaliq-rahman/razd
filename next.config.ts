import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home directory makes Turbopack infer the wrong
  // workspace root. Pin it to this project.
  turbopack: { root: __dirname },
  // This project documents itself in README.md and docs/; no generated agent files.
  agentRules: false,
}

export default nextConfig
