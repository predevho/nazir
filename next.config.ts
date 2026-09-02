import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 폰트 파일은 내용이 바뀌면 파일명을 바꾸는 운영이므로 영구 캐시로 둔다.
        // 재방문 시 재다운로드가 없어져 첫 방문 이후의 폰트 비용이 0이 된다.
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
