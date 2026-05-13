export interface LinkSeed {
  id: string;
  title: string;
  url: string;
  iconName: string;
}

export const seedLinks: LinkSeed[] = [
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/parksieon/mylink",
    iconName: "Github",
  },
  {
    id: "email",
    title: "Email",
    url: "mailto:parksieon03@gmail.com",
    iconName: "Mail",
  },
  {
    id: "capstone",
    title: "캡스톤 프로젝트 (진행중)",
    url: "https://vatican-mind-applicant-ingredients.trycloudflare.com/",
    iconName: "Rocket",
  },
  {
    id: "learning-notes",
    title: "학습 정리",
    url: "/learning-notes",
    iconName: "BookOpen",
  },
];
