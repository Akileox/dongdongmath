# 설정 및 할 일 목록 (Setup Guide)

이 프로젝트를 실행하기 위해 필요한 API 키와 설정 단계입니다.

## 1. 환경 변수 설정 (`.env.local`)
다음 키값을 `.env.local` 파일에 프젝 루트에 생성하여 입력해야 합니다.

| 변수명 | 설명 | 비고 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon (Public) Key | Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | **중요**: 학생 일괄 등록 기능에 필수 (절대 노출 금지) |
| `GEMINI_API_KEY` | Google Gemini API Key | (선택) 추후 AI 답변 연동 시 사용 |

## 2. 데이터베이스 설정 (Supabase)
Supabase의 **SQL Editor**에서 다음 스크립트를 실행하여 테이블을 생성해야 합니다.
(프로젝트 내 `supabase/schema.sql` 파일 참고)

1.  **profiles**: 사용자 프로필 테이블 생성
2.  **lectures**: 강의 정보 테이블 생성
3.  **questions**: 질문/답변 테이블 생성
4.  **RLS Policies**: 보안 정책 적용 (Row Level Security)

## 3. 초기 관리자 설정
1.  Supabase 대시보드 > Authentication > Users에서 회원가입을 하거나, 회원가입 코드로 사용자를 생성합니다.
2.  Table Editor > `profiles` 테이블에서 해당 사용자의 `role`을 `student`에서 `admin`으로 변경합니다.
    -   이렇게 해야 `/dashboard/admin` 페이지에 접근할 수 있습니다.

## 4. 빌드 및 배포
-   **로컬 실행**:
    ```bash
    npm run dev
    ```
-   **배포 (Vercel)**:
    -   Vercel 대시보드에서 위 환경 변수들을 모두 입력해야 배포가 성공합니다.
