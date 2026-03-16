import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ESLint 설정: 코드 품질을 자동으로 검사하고 오류를 찾습니다
// npm run lint 명령어로 실행됩니다
export default defineConfig([
  // dist 폴더는 무시 (빌드 결과물이므로 검사 필요 없음)
  globalIgnores(['dist']),
  {
    // TypeScript 파일(.ts, .tsx)에만 규칙 적용
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,           // JavaScript 권장 규칙
      tseslint.configs.recommended,     // TypeScript 권장 규칙
      reactHooks.configs.flat.recommended,  // React Hooks 사용 규칙
      reactRefresh.configs.vite,        // Vite Fast Refresh 규칙
    ],
    languageOptions: {
      ecmaVersion: 2020,                // JavaScript 2020 버전까지 지원
      globals: globals.browser,         // 브라우저 전역 객체 허용 (예: window, document)
    },
  },
])
