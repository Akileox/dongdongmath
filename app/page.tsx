import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy, Users, Clock, Target } from "lucide-react"
import { PublicNavbar } from "@/components/layout/public-navbar"

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-100">
      <PublicNavbar />

      {/* Hero Section: Dark track concept */}
      <section className="relative h-screen flex items-center justify-center bg-black text-white overflow-hidden">
        {/* Background Overlay - Abstract Track/Darkness */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-80" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

        {/* Decorative 'Track' Lines */}
        <div className="absolute inset-0 opacity-20 transform -skew-x-12">
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute left-2/4 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/10" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1 border border-white/30 rounded-full text-sm font-light tracking-wide text-gray-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            2027학년도 수강생 모집 중
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight font-sans">
            결국, 승부는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">끝에서 뒤집힙니다.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            11월의 기초공사부터 수능 날의 마지막 스퍼트까지.<br />
            당신의 '1등급 역전극', 저희 TeamDJ가 앞에서 끌고 뒤에서 밀겠습니다.
          </p>

          <Link href="#curriculum">
            <Button size="lg" className="h-14 px-10 text-lg bg-white text-black hover:bg-gray-200 rounded-none transform transition-transform hover:-translate-y-1">
              커리큘럼 확인하기 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Philosophy Section: Proven by Numbers */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-sans">말뿐인 열정이 아닙니다</h2>
            <p className="text-gray-500">Team DJ는 오직 결과로 증명합니다.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
            <StatCard label="여름방학 퇴원생" value="0명" sub="낙오자는 없습니다" />
            <StatCard label="스파르타 특강" value="80%" sub="압도적인 재수강률" />
            <StatCard label="1등급 배출" value="TOP" sub="25년 화금반 기준" />
            <StatCard label="전 타임 마감" value="SOLD OUT" sub="검증된 몰입도" />
          </div>
        </div>
      </section>

      {/* Curtain Divider */}
      <div className="h-24 bg-gray-50 skew-y-2 transform origin-top-left" />

      {/* Curriculum Section */}
      <section id="curriculum" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-sans text-gray-900 border-l-4 border-black pl-6">
              요행은 없습니다.<br />
              압도적인 공부량만이 답입니다.
            </h2>
            <p className="text-gray-500 pl-7">2026 이동재T 수능/내신 커리큘럼</p>
          </div>

          <div className="space-y-16">
            {/* 1. Regular Season */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                정규반 (Regular Season)
              </h3>
              <div className="space-y-8">
                <CurriculumItem
                  badge="예비 고1"
                  title="The Runner"
                  desc="격차를 벌릴 유일한 골든타임"
                  detail="기초 체력을 다지는 스파르타 시스템. (The Starter)"
                />
                <CurriculumItem
                  badge="고1 ~ 고2"
                  title="The Pacemaker"
                  desc="내신 1등급, 빈틈없이 독점하다"
                  detail="매시간 실전 모의고사 & 1:1 무한 클리닉."
                />
              </div>
            </div>

            {/* 2. Vacation Sparta */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                스파르타반 (Vacation Sparta)
              </h3>
              <CurriculumItem
                badge="방학 집중"
                title="Sparta Camp"
                desc="단기간 폭발적인 성적 향상"
                detail="아침 9시부터 저녁 6시까지, 33강 완성 몰입형 프로그램."
              />
            </div>

            {/* 3. Final */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                고3 파이널 (The Final)
              </h3>
              <CurriculumItem
                badge="고3 / N수"
                title="The Finisher"
                desc="마지막 한 문제까지 집요하게"
                detail="킬러 문항을 압도하는 실전적 풀이와 파이널 전략."
              />
            </div>

          </div>
        </div>
      </section>

      {/* Footer Message */}
      <section className="py-32 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl font-serif leading-relaxed text-gray-300 mb-10">
              "숨이 턱 끝까지 차오르는 순간,<br />
              진짜 수학이 시작됩니다.<br />
              지금, 그 짜릿한 역전의 레이스에 합류하세요."
            </p>
            <Link href="/questions">
              <Button size="lg" variant="outline" className="h-12 px-8 border-white bg-transparent text-white hover:bg-white hover:text-black transition-colors rounded-none">
                상담 신청하기
              </Button>
            </Link>
            <p className="mt-8 text-xs text-gray-600">
              &copy; 2026 TEAM DJ Math Institute. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="p-8 border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 text-center group">
      <p className="text-sm text-gray-500 mb-2 font-medium">{label}</p>
      <h3 className="text-4xl md:text-5xl font-bold text-black mb-4 group-hover:scale-110 transition-transform font-sans">{value}</h3>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function CurriculumItem({ badge, title, desc, detail }: { badge: string, title: string, desc: string, detail: string }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 md:items-start group">
      <div className="flex-shrink-0">
        <span className="inline-block px-4 py-2 bg-black text-white text-sm font-bold tracking-wider">
          {badge}
        </span>
      </div>
      <div className="flex-1 p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-2xl font-bold mb-2 font-sans text-gray-900">{title}</h3>
        <p className="text-lg font-medium text-gray-700 mb-3">"{desc}"</p>
        <p className="text-gray-500 leading-relaxed">
          {detail}
        </p>
      </div>
    </div>
  )
}
