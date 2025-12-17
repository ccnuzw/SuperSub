{
  "name": "performance",
  "version": "1.0.0",
  "description": "SuperSub 性能监控和优化配置",
  "scripts": {
    "analyze": "NODE_ENV=analyze vite build",
    "perf:monitor": "npm run dev",
    "perf:test": "lhci autorun",
    "perf:bundle": "n vite-bundle-analyzer dist --mode json",
    "perf:memory": "npm run dev",
    "perf:report": "./scripts/performance.sh report"
  },
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.9.2",
    "vite-bundle-analyzer": "^0.7.0",
    "cssnano": "^6.0.1",
    "terser": "^5.19.2"
  },
  "lhci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/nodes",
        "http://localhost:3000/subscriptions",
        "http://localhost:3000/profiles"
      ],
      "startServerCommand": "npm run dev",
      "startServerReadyPattern": "Local:",
      "startServerReadyTimeout": 30000
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.8}],
        "categories:seo": ["warn", {"minScore": 0.8}],
        "categories:pwa": "off"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}