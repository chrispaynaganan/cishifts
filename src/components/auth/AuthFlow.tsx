"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/primitives";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { AuthField, passwordStrength, StrengthMeter, type AuthFieldHandle } from "./AuthField";
import { AuthHero } from "./AuthHero";

type Step = "signup" | "welcome" | "login";

const DEMO = { username: "scheduler", email: "scheduler@acme.com", password: "scheduler2023!" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 26 },
  },
};

export function AuthFlow() {
  return (
    <ToastProvider>
      <AuthFlowInner />
    </ToastProvider>
  );
}

function AuthFlowInner() {
  const [step, setStep] = useState<Step>("signup");
  const [account, setAccount] = useState({ username: "", email: "" });
  const [curtain, setCurtain] = useState<{ x: number; y: number } | null>(null);
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    router.prefetch("/calendar");
  }, [router]);

  const enterApp = (from: HTMLElement | null) => {
    const r = from?.getBoundingClientRect();
    setCurtain({
      x: r ? r.left + r.width / 2 : window.innerWidth / 2,
      y: r ? r.top + r.height / 2 : window.innerHeight / 2,
    });
    window.setTimeout(() => router.push("/calendar"), reduce ? 50 : 900);
  };

  return (
    <main className="flex min-h-dvh bg-white p-4 sm:p-7.5 lg:py-10.5">
      <AuthHero />
      <div className="relative flex flex-1 items-center justify-center px-2 py-10 sm:px-6 lg:pl-9">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 32, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -32, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-89"
          >
            {step === "signup" && (
              <SignUp
                onDone={(acc) => {
                  setAccount(acc);
                  setStep("welcome");
                }}
                onLogin={() => setStep("login")}
                onFacebook={enterApp}
              />
            )}
            {step === "welcome" && (
              <Welcome email={account.email || DEMO.email} onVerified={() => setStep("login")} />
            )}
            {step === "login" && (
              <Login
                defaultUsername={account.username}
                onSignUp={() => setStep("signup")}
                onDone={enterApp}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {curtain && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-white"
            initial={{ clipPath: `circle(0px at ${curtain.x}px ${curtain.y}px)` }}
            animate={{ clipPath: `circle(150vmax at ${curtain.x}px ${curtain.y}px)` }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Image src="/assets/logo.png" alt="CIShifts" width={200} height={79} priority />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div variants={rise} className="flex w-full flex-col gap-4 tracking-display">
      <MobileLogo />
      <h2 className="text-display font-medium text-black text-trim">{title}</h2>
      <p className="text-xl text-muted text-trim">{subtitle}</p>
    </motion.div>
  );
}

function MobileLogo() {
  return (
    <Image src="/assets/logo.png" alt="CIShifts" width={140} height={55} className="mb-6 lg:hidden" />
  );
}

function RememberMe() {
  const [on, setOn] = useState(false);
  return (
    <motion.div variants={rise} className="w-full px-4.75 py-1.5">
      <label className="flex w-fit cursor-pointer items-center gap-2.5 select-none">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`grid size-4.5 place-items-center rounded-check border-[1.5px] transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30 ${
            on ? "border-brand bg-brand" : "border-black"
          }`}
        >
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
            <motion.path
              d="M2.5 6.2 5 8.6l4.6-5"
              fill="none"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: on ? 1 : 0 }}
              transition={{ duration: 0.22 }}
            />
          </svg>
        </span>
        <span className="text-base tracking-ui text-ink-body text-trim">Remember Me</span>
      </label>
    </motion.div>
  );
}

function PrimaryCta({
  children,
  loading,
  success,
  onClick,
  buttonRef,
  className = "",
}: {
  children: ReactNode;
  loading?: boolean;
  success?: ReactNode;
  onClick?: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <motion.button
      ref={buttonRef}
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={loading || !!success}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      animate={{ backgroundColor: success ? "#1a8000" : "#d42704" }}
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-full p-4 text-base leading-none font-medium tracking-ui text-white shadow-brand/30 transition-shadow hover:shadow-lg ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span key="l" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Spinner />
          </motion.span>
        ) : success ? (
          <motion.span
            key="s"
            className="flex items-center gap-2 text-trim"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.span>
        ) : (
          <motion.span key="d" className="text-trim" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function FacebookButton({ onClick }: { onClick: (el: HTMLElement) => void }) {
  return (
    <motion.button
      type="button"
      onClick={(e) => onClick(e.currentTarget)}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full items-center justify-center gap-4 rounded-full border border-facebook bg-white px-2.5 py-3.5 text-base leading-none font-medium tracking-ui text-facebook transition-colors duration-200 hover:bg-facebook/5"
    >
      <img
        src="/assets/icon-facebook.svg"
        alt=""
        width={8.25}
        height={15}
        className="h-3.75 w-2 transition-transform duration-300 group-hover:-rotate-12"
      />
      <span className="text-trim">Log In Via Facebook</span>
    </motion.button>
  );
}

function Footer({ children }: { children: ReactNode }) {
  const toast = useToast();
  return (
    <motion.div variants={rise} className="flex w-full flex-col gap-6">
      <div className="flex min-h-9 w-full flex-col gap-4 text-center text-sm tracking-ui">{children}</div>
      <div className="flex w-full items-center text-xs tracking-ui text-muted">
        <p className="flex flex-1 justify-center border-r border-line-copy p-2.5 text-trim">
          Copyright @ CIShifts 2024
        </p>
        <button
          type="button"
          onClick={() => toast("The privacy policy isn’t part of this prototype.")}
          className="flex flex-1 justify-center p-2.5 transition-colors hover:text-ink"
        >
          <span className="text-trim">Privacy Policy</span>
        </button>
      </div>
    </motion.div>
  );
}

function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative font-medium text-brand after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-300 hover:after:scale-x-100"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function SignUp({
  onDone,
  onLogin,
  onFacebook,
}: {
  onDone: (acc: { username: string; email: string }) => void;
  onLogin: () => void;
  onFacebook: (el: HTMLElement) => void;
}) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [typing, setTyping] = useState<keyof typeof form | null>(null);
  const [invalid, setInvalid] = useState<Partial<Record<keyof typeof form, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const refs = {
    username: useRef<AuthFieldHandle>(null),
    email: useRef<AuthFieldHandle>(null),
    password: useRef<AuthFieldHandle>(null),
  };
  const busy = useRef(false);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setInvalid((i) => ({ ...i, [k]: false }));
  };

  /** Recreates frames 2–5 of the Figma flow by typing the demo account in. */
  const autoType = async () => {
    for (const key of ["username", "email", "password"] as const) {
      setTyping(key);
      const text = DEMO[key];
      for (let i = 1; i <= text.length; i++) {
        setForm((f) => ({ ...f, [key]: text.slice(0, i) }));
        await sleep(key === "password" ? 70 : 45);
      }
      await sleep(220);
    }
    setTyping(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    let data = form;
    if (!form.username && !form.email && !form.password) {
      await autoType();
      data = DEMO;
    } else {
      const bad = {
        username: !form.username.trim(),
        email: !/^\S+@\S+\.\S+$/.test(form.email),
        password: passwordStrength(form.password) < 2,
      };
      if (bad.username || bad.email || bad.password) {
        setInvalid(bad);
        (Object.keys(bad) as (keyof typeof bad)[]).forEach((k) => bad[k] && refs[k].current?.shake());
        busy.current = false;
        return;
      }
    }
    setLoading(true);
    await sleep(900);
    onDone({ username: data.username, email: data.email });
  };

  return (
    <motion.form variants={stagger} initial="hidden" animate="show" onSubmit={submit} noValidate className="flex flex-col gap-12">
      <Heading title="Hello there!" subtitle="Sign up now and explore the possibilities!" />
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-4">
          <motion.div variants={rise}>
            <AuthField ref={refs.username} icon="user" placeholder="username" value={form.username} onChange={set("username")} autoComplete="username" invalid={invalid.username} highlighted={typing === "username"} />
          </motion.div>
          <motion.div variants={rise}>
            <AuthField ref={refs.email} icon="mail" type="email" placeholder="email" value={form.email} onChange={set("email")} autoComplete="email" invalid={invalid.email} highlighted={typing === "email"} />
          </motion.div>
          <motion.div variants={rise} className="flex flex-col gap-4">
            <AuthField ref={refs.password} icon="lock" type="password" placeholder="password" value={form.password} onChange={set("password")} autoComplete="new-password" invalid={invalid.password} highlighted={typing === "password"} />
            <AnimatePresence>{form.password && <StrengthMeter password={form.password} />}</AnimatePresence>
          </motion.div>
          <RememberMe />
        </div>
        <motion.div variants={rise} className="flex w-full flex-col gap-4">
          <PrimaryCta loading={loading}>Log In</PrimaryCta>
          <FacebookButton onClick={onFacebook} />
        </motion.div>
        <Footer>
          <p>
            Already have an account? <TextLink onClick={onLogin}>Login</TextLink>
          </p>
        </Footer>
      </div>
    </motion.form>
  );
}

function Welcome({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const brand = "CIShifts!".split("");

  const verify = async () => {
    setState("sending");
    await sleep(1100);
    setState("done");
    await sleep(800);
    onVerified();
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex w-full flex-col items-center gap-12">
      <div className="flex w-full flex-col gap-8">
        <motion.h2 variants={rise} className="text-5xl leading-12.5 font-medium tracking-display text-black">
          <MobileLogo />
          Welcome to{" "}
          <span className="inline-flex text-brand">
            {brand.map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ y: -28, opacity: 0, rotate: -12 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.35 + i * 0.05, type: "spring", stiffness: 520, damping: 18 }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </motion.h2>
        <motion.p variants={rise} className="text-base tracking-ui text-muted">
          You have successfully created your account. To continue the registration, we have you a
          email from the address you provided (<span className="font-semibold text-ink-body">{email}</span>) for
          verification.
        </motion.p>
      </div>
      <motion.div variants={rise} className="w-full">
        <PrimaryCta
          onClick={verify}
          loading={state === "sending"}
          success={
            state === "done" ? (
              <>
                <CheckIcon /> Email verified
              </>
            ) : undefined
          }
          className="h-10.75"
        >
          Verify your Email
        </PrimaryCta>
      </motion.div>
    </motion.div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <motion.path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35 }}
      />
    </svg>
  );
}

function Login({
  defaultUsername,
  onSignUp,
  onDone,
}: {
  defaultUsername: string;
  onSignUp: () => void;
  onDone: (el: HTMLElement | null) => void;
}) {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [typing, setTyping] = useState<"username" | "password" | null>(null);
  const [invalid, setInvalid] = useState({ username: false, password: false });
  const [loading, setLoading] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const userRef = useRef<AuthFieldHandle>(null);
  const passRef = useRef<AuthFieldHandle>(null);
  const busy = useRef(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    if (!password) {
      if (!username) {
        setTyping("username");
        for (let i = 1; i <= DEMO.username.length; i++) {
          setUsername(DEMO.username.slice(0, i));
          await sleep(45);
        }
        await sleep(200);
      }
      setTyping("password");
      for (let i = 1; i <= DEMO.password.length; i++) {
        setPassword(DEMO.password.slice(0, i));
        await sleep(40);
      }
      await sleep(250);
      setTyping(null);
    } else if (!username) {
      setInvalid({ username: true, password: false });
      userRef.current?.shake();
      busy.current = false;
      return;
    }
    setLoading(true);
    await sleep(700);
    onDone(btn.current);
  };

  return (
    <motion.form variants={stagger} initial="hidden" animate="show" onSubmit={submit} noValidate className="flex flex-col gap-12">
      <Heading title="Hello there!" subtitle="Login using your account" />
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-4">
          <motion.div variants={rise}>
            <AuthField ref={userRef} icon="user" placeholder="username" value={username} onChange={(v) => { setUsername(v); setInvalid((i) => ({ ...i, username: false })); }} autoComplete="username" invalid={invalid.username} highlighted={typing === "username"} />
          </motion.div>
          <motion.div variants={rise}>
            <AuthField ref={passRef} icon="lock" type="password" placeholder="password" value={password} onChange={setPassword} autoComplete="current-password" invalid={invalid.password} highlighted={typing === "password"} />
          </motion.div>
          <RememberMe />
        </div>
        <motion.div variants={rise} className="flex w-full flex-col gap-4">
          <PrimaryCta loading={loading} buttonRef={btn}>
            Log In
          </PrimaryCta>
          <FacebookButton onClick={onDone} />
        </motion.div>
        <Footer>
          <p>
            Don’t have an account yet? <TextLink onClick={onSignUp}>Sign up</TextLink>
          </p>
          <p>
            <TextLink onClick={() => toast("Demo tip: any password works here.", { tone: "info" })}>
              Forgot your password?
            </TextLink>
          </p>
        </Footer>
      </div>
    </motion.form>
  );
}
