"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  getProfile,
  setUsername,
  setBio,
  setBgmYoutubeUrl,
  BIO_MAX_LENGTH,
} from "@/lib/user";

interface Status {
  kind: "ok" | "error";
  message: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signIn } = useAuth();

  const [savedUsername, setSavedUsername] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [usernameStatus, setUsernameStatus] = useState<Status | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [savedBio, setSavedBio] = useState<string>("");
  const [bioInput, setBioInput] = useState<string>("");
  const [bioStatus, setBioStatus] = useState<Status | null>(null);
  const [bioSaving, setBioSaving] = useState(false);

  const [savedBgm, setSavedBgm] = useState<string>("");
  const [bgmInput, setBgmInput] = useState<string>("");
  const [bgmStatus, setBgmStatus] = useState<Status | null>(null);
  const [bgmSaving, setBgmSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const profile = await getProfile(user.uid);
      if (cancelled) return;
      const u = profile?.username ?? "";
      setSavedUsername(u);
      setUsernameInput(u);
      const b = profile?.bio ?? "";
      setSavedBio(b);
      setBioInput(b);
      const g = profile?.bgmYoutubeUrl ?? "";
      setSavedBgm(g);
      setBgmInput(g);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleUsernameSave = async () => {
    if (!user) return;
    const trimmed = usernameInput.trim().toLowerCase();
    setUsernameSaving(true);
    setUsernameStatus(null);
    const result = await setUsername(user.uid, trimmed, savedUsername || undefined);
    setUsernameSaving(false);
    if (!result.ok) {
      setUsernameStatus({ kind: "error", message: result.reason });
      return;
    }
    setSavedUsername(trimmed);
    setUsernameInput(trimmed);
    setUsernameStatus({ kind: "ok", message: "저장됐어요!" });
  };

  const handleBioSave = async () => {
    if (!user) return;
    setBioSaving(true);
    setBioStatus(null);
    const result = await setBio(user.uid, bioInput);
    setBioSaving(false);
    if (!result.ok) {
      setBioStatus({ kind: "error", message: result.reason });
      return;
    }
    setSavedBio(bioInput.trim());
    setBioStatus({ kind: "ok", message: "저장됐어요!" });
  };

  const handleBgmSave = async () => {
    if (!user) return;
    setBgmSaving(true);
    setBgmStatus(null);
    const result = await setBgmYoutubeUrl(user.uid, bgmInput);
    setBgmSaving(false);
    if (!result.ok) {
      setBgmStatus({ kind: "error", message: result.reason });
      return;
    }
    const trimmed = bgmInput.trim();
    setSavedBgm(trimmed);
    setBgmInput(trimmed);
    setBgmStatus({
      kind: "ok",
      message: trimmed ? "저장됐어요!" : "BGM 을 해제했어요.",
    });
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          로그인이 필요해요
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          프로필을 수정하려면 먼저 로그인해 주세요.
        </p>
        <button
          type="button"
          onClick={signIn}
          className="mt-8 cursor-pointer rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Google로 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-20 pt-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          프로필
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          공개 페이지에 표시되는 정보를 설정해요.
        </p>
      </div>

      {/* Username */}
      <section className="mb-12 rounded-2xl bg-card p-6 ring-1 ring-border/60 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          내 페이지 주소
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 URL이 <span className="font-mono">/내_username</span> 형태로 만들어져요. 3~20자 영문 소문자, 숫자, _, - 만 가능해요.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center overflow-hidden rounded-md border border-input bg-background pl-3 focus-within:ring-2 focus-within:ring-ring/40">
            <span className="select-none text-sm text-muted-foreground">/</span>
            <Input
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (usernameStatus) setUsernameStatus(null);
              }}
              placeholder="parksieon"
              className="border-0 shadow-none focus-visible:ring-0"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <Button
            type="button"
            onClick={handleUsernameSave}
            disabled={
              usernameSaving ||
              !usernameInput.trim() ||
              usernameInput.trim().toLowerCase() === savedUsername
            }
            className="cursor-pointer"
          >
            {usernameSaving ? "저장 중..." : savedUsername ? "변경" : "설정"}
          </Button>
        </div>
        {usernameStatus && (
          <p
            className={
              "mt-2 text-[13px] " +
              (usernameStatus.kind === "ok"
                ? "text-emerald-600"
                : "text-destructive")
            }
          >
            {usernameStatus.message}
          </p>
        )}
        {savedUsername && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            현재 공개 URL:{" "}
            <Link
              href={`/${savedUsername}`}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              /{savedUsername}
            </Link>
          </p>
        )}
      </section>

      {/* Bio */}
      <section className="mb-12 rounded-2xl bg-card p-6 ring-1 ring-border/60 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          소개글
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 페이지의 이름 아래에 표시돼요. 최대 {BIO_MAX_LENGTH}자.
        </p>
        <div className="mt-5 space-y-2">
          <textarea
            value={bioInput}
            onChange={(e) => {
              setBioInput(e.target.value);
              if (bioStatus) setBioStatus(null);
            }}
            placeholder="예: 코드로 세상을 더 행복하게 만들고 싶은 학생입니다."
            rows={3}
            maxLength={BIO_MAX_LENGTH + 50}
            className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {bioInput.length} / {BIO_MAX_LENGTH}
            </span>
            <Button
              type="button"
              onClick={handleBioSave}
              disabled={bioSaving || bioInput.trim() === savedBio}
              className="cursor-pointer"
            >
              {bioSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
        {bioStatus && (
          <p
            className={
              "mt-2 text-[13px] " +
              (bioStatus.kind === "ok"
                ? "text-emerald-600"
                : "text-destructive")
            }
          >
            {bioStatus.message}
          </p>
        )}
      </section>

      {/* BGM */}
      <section className="mb-12 rounded-2xl bg-card p-6 ring-1 ring-border/60 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          배경 음악
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 페이지(<span className="font-mono">/내_username</span>) 방문자에게
          작은 플레이어로 표시돼요. YouTube 영상 URL 을 붙여넣으세요. 비워두면 해제.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Input
            value={bgmInput}
            onChange={(e) => {
              setBgmInput(e.target.value);
              if (bgmStatus) setBgmStatus(null);
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button
            type="button"
            onClick={handleBgmSave}
            disabled={bgmSaving || bgmInput.trim() === savedBgm}
            className="cursor-pointer"
          >
            {bgmSaving ? "저장 중..." : savedBgm ? "변경" : "설정"}
          </Button>
        </div>
        {bgmStatus && (
          <p
            className={
              "mt-2 text-[13px] " +
              (bgmStatus.kind === "ok"
                ? "text-emerald-600"
                : "text-destructive")
            }
          >
            {bgmStatus.message}
          </p>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          ⚠ 자동재생은 브라우저 정책상 막혀있어서, 방문자가 페이지에서 ▶ 버튼을
          한 번 눌러야 재생돼요.
        </p>
      </section>

      <Link
        href="/mypage"
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 관리로
      </Link>
    </div>
  );
}
