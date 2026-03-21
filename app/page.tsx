import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink font-sans selection:bg-accent selection:text-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-end">
          <h1 className="font-mono text-xl tracking-tight font-bold">HONG GILDONG</h1>
          <nav className="hidden sm:flex gap-6 font-mono text-xs text-muted">
            <a href="#projects" className="hover:text-accent transition-colors">PROJECTS</a>
            <a href="#about" className="hover:text-accent transition-colors">ABOUT</a>
            <a href="#contact" className="hover:text-accent transition-colors">CONTACT</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-32">
        {/* Hero Section */}
        <section id="hero" className="space-y-8 animate-fade-in-up">
          <div className="font-mono text-xs text-accent tracking-widest uppercase">01 — Introduction</div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            안녕하세요.<br />
            경험을 설계하는 <span className="text-accent italic">프론트엔드 개발자</span> 홍길동입니다.
          </h2>
          <p className="max-w-2xl text-lg text-ink/80 leading-relaxed">
            사용자에게 시각적 즐거움과 원활한 경험을 제공하는 웹 인터페이스를 구축합니다. 
            최고의 성능과 모던한 디자인 패턴을 지향하며 끊임없이 성장하고 있습니다.
          </p>
          <div className="pt-4">
            <a href="#projects" className="inline-block bg-ink text-bg font-mono text-sm px-6 py-3 hover:bg-accent transition-colors duration-300">
              [VIEW PROJECTS]
            </a>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="space-y-12">
          <div className="font-mono text-xs text-accent tracking-widest uppercase">02 — Selected Works</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project 1 */}
            <div className="group bg-card border border-border overflow-hidden hover:border-ink transition-colors cursor-pointer flex flex-col">
              <div className="aspect-video bg-border w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-ink/5 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <span className="font-mono text-muted text-sm">Project Image 01</span>
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">E-Commerce Platform</h3>
                  <p className="text-sm text-ink/70 line-clamp-2">리액트와 Next.js를 활용한 고성능 쇼핑몰 플랫폼 구축 사이드 프로젝트.</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <span className="font-mono text-xs text-muted">React, Next.js</span>
                  <span className="font-mono text-xs text-accent">➔</span>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="group bg-card border border-border overflow-hidden hover:border-ink transition-colors cursor-pointer flex flex-col">
              <div className="aspect-video bg-border w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-ink/5 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <span className="font-mono text-muted text-sm">Project Image 02</span>
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Portfolio Blueprint</h3>
                  <p className="text-sm text-ink/70 line-clamp-2">개인 작업물과 이력을 시각적으로 정리한 반응형 웹사이트. 기획부터 배포까지 전 과정 진행.</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <span className="font-mono text-xs text-muted">Tailwind, Vercel</span>
                  <span className="font-mono text-xs text-accent">➔</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info & Tech Stack */}
        <section id="about" className="space-y-12">
          <div className="font-mono text-xs text-accent tracking-widest uppercase">03 — Tech Stack & Experience</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Tech Stack</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border p-4">
                  <div className="font-mono text-[10px] text-muted mb-1">FRONTEND</div>
                  <div className="font-sans font-bold text-sm">React, Next.js, TS</div>
                </div>
                <div className="bg-card border border-border p-4">
                  <div className="font-mono text-[10px] text-muted mb-1">STYLING</div>
                  <div className="font-sans font-bold text-sm">Tailwind CSS</div>
                </div>
                <div className="bg-card border border-border p-4">
                  <div className="font-mono text-[10px] text-muted mb-1">STATE MGMT</div>
                  <div className="font-sans font-bold text-sm">Zustand, React Query</div>
                </div>
                <div className="bg-card border border-border p-4">
                  <div className="font-mono text-[10px] text-muted mb-1">TOOLS</div>
                  <div className="font-sans font-bold text-sm">Git, Figma, Vercel</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Experience</h3>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 hover:bg-card transition-colors border-l-2 border-transparent hover:border-accent">
                  <div className="font-mono text-xs text-muted whitespace-nowrap pt-1">2024 - 2026</div>
                  <div>
                    <h4 className="font-bold">프론트엔드 개발자</h4>
                    <p className="text-xs text-ink/70 mt-1">Tech Startup Corp. - 사내 어드민 페이지 및 주요 서비스 웹 프론트엔드 구축 담당.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 hover:bg-card transition-colors border-l-2 border-transparent hover:border-accent">
                  <div className="font-mono text-xs text-muted whitespace-nowrap pt-1">2023 - 2024</div>
                  <div>
                    <h4 className="font-bold">프론트엔드 인턴</h4>
                    <p className="text-xs text-ink/70 mt-1">Web Agency - 다양한 클라이언트의 랜딩 페이지 및 반응형 웹 사이트 퍼블리싱.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="space-y-8 bg-ink text-bg p-8 md:p-16">
          <div className="font-mono text-xs text-muted tracking-widest uppercase">04 — Contact</div>
          <h2 className="text-3xl md:text-5xl font-bold">Let's work together.</h2>
          <p className="text-bg/80 max-w-lg leading-relaxed">
            새로운 프로젝트 제안이나 협업 문의를 환영합니다.<br/> 언제든지 편하게 연락주세요.
          </p>
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-sm">
            <a href="mailto:hello@example.com" className="border border-border/20 p-4 hover:border-accent transition-colors">
              hello@example.com
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="border border-border/20 p-4 hover:border-accent transition-colors">
              github.com/honggildong
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] text-muted">
          <div>© 2026 HONG GILDONG. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <span>RESUME</span>
            <span>LINKEDIN</span>
            <span>GITHUB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
