# To-do List 웹페이지 프로젝트

To-do list 웹페이지를 **만들고 배포하기 위한 실행 계획**과 현재 구현 상태를 정리합니다.

## 목표
- 핵심 기능을 빠르게 구현하고
- 간단한 배포 파이프라인을 통해 공개 URL로 배포합니다.

## 실행 계획

### 1) 목표 및 범위 정의
- 필수 기능
  - 할 일 추가
  - 완료 체크
  - 삭제
  - 필터(전체/완료/미완료)
- 데이터 저장 방식
  - 초기: `localStorage`
  - 확장: 서버 저장소 및 계정 로그인 연동

### 2) 기술 스택 결정
- 확정 스택
  - Frontend: React + Vite (TypeScript)
  - State: React `useState`
  - Storage: `localStorage` (초기) + 향후 서버 연동 대비
  - Styling: Vanilla CSS
  - Deployment: Vercel
  - Auth: Supabase (이메일/비밀번호)

### 3) UI/UX 설계
- 와이어프레임 스케치
- 모바일 반응형 고려
- 접근성 체크(키보드 이동, ARIA)

#### 와이어프레임 초안
```
------------------------------------------------
 To-do List
 [ + 새 할 일 입력 __________________ ] (추가)

 [전체] [미완료] [완료]

 - [ ] 할 일 예시 1            (삭제)
 - [x] 할 일 예시 2            (삭제)
 - [ ] 할 일 예시 3            (삭제)

 완료: 1 / 전체: 3
------------------------------------------------
```

### 4) 구현
- 기본 기능 우선 완성
- 상태는 `localStorage`에 저장
- 로그인/회원가입(실제 로그인) 추가
  - Supabase Auth(이메일/비밀번호)
  - 비밀번호 재설정 지원
- 필요 시 필터/정렬 기능 확장

### 5) 테스트
- 주요 동작 점검
  - 추가/완료/삭제
  - 새로고침 후 상태 유지
- 모바일 및 브라우저 호환 확인

### 6) 배포
- Git 저장소 생성
- Vercel 배포 설정
  - Vercel 로그인 후 `New Project` 선택
  - GitHub 저장소 연결
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables: 필요 시 등록
  - `Deploy` 클릭
- 배포 URL 확인 및 공유

### 7) 개선 로드맵
- 계정 로그인 및 동기화
- 드래그 정렬
- 다크 모드

## Supabase 설정
1. Supabase 프로젝트 생성
2. Auth 설정에서 `Confirm Email` 비활성화 (이메일 인증 필요 없음)
3. Auth 설정의 URL Configuration에서 Redirect URLs에 로컬/배포 URL 추가
4. `.env`에 아래 값 설정 (`.env.example` 참고)

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 로컬 실행
```
npm install
npm run dev
```
