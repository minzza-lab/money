import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 개발 및 빌드 도구 설정
// 더 자세한 정보: https://vite.dev/config/
export default defineConfig({
  // React 플러그인을 사용하여 JSX 변환 및 Fast Refresh 활성화
  // Fast Refresh: 코드를 수정하면 상태를 잃지 않으면서 자동으로 업데이트됨
  plugins: [react()],
})
