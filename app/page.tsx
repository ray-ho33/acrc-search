import { SearchExperience } from "@/components/SearchExperience";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-slate-900 px-6 py-10 text-white shadow-xl sm:px-10">
          <p className="text-sm font-semibold text-indigo-100">
            고충처리 자료 검색 지원 시스템
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            의결례를 의미 기반으로 검색합니다.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-indigo-50">
            M2에서 수집한 권익위 의결례와 Gemini 임베딩을 사용해, 단어가
            정확히 일치하지 않아도 의미가 가까운 자료를 찾아봅니다.
          </p>
        </section>

        <SearchExperience />
      </div>
    </main>
  );
}
