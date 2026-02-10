import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

type Filter = "all" | "active" | "done";

type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = "todo.items.v1";

type AuthView = "sign_in" | "sign_up" | "reset" | "update_password";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Todo[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && typeof t.id === "string");
  } catch {
    return [];
  }
}

function saveTodos(items: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function App() {
  const [items, setItems] = useState<Todo[]>(() => loadTodos());
  const [filter, setFilter] = useState<Filter>("all");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [view, setView] = useState<AuthView>("sign_in");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const MAX_TITLE_LENGTH = 50;

  useEffect(() => {
    saveTodos(items);
  }, [items]);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSessionEmail(data.session?.user.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSessionEmail(session?.user.email ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setView("update_password");
      }
    });
    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((t) => t.done).length;
    return { total, done };
  }, [items]);

  const visible = useMemo(() => {
    if (filter === "active") return items.filter((t) => !t.done);
    if (filter === "done") return items.filter((t) => t.done);
    return items;
  }, [filter, items]);

  function normalizeTitle(title: string) {
    return title.trim().toLowerCase();
  }

  function addTodo() {
    const title = input.trim();
    const normalized = normalizeTitle(title);
    if (!title) {
      setError("할 일을 입력해주세요.");
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setError(`최대 ${MAX_TITLE_LENGTH}자까지 입력할 수 있어요.`);
      return;
    }
    const isDuplicate = items.some(
      (t) => normalizeTitle(t.title) === normalized,
    );
    if (isDuplicate) {
      setError("이미 같은 할 일이 있어요.");
      return;
    }

    const newItem: Todo = {
      id: crypto.randomUUID(),
      title,
      done: false,
      createdAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
    setInput("");
    setError("");
  }

  function toggleTodo(id: string) {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  function removeTodo(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addTodo();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    if (signInError) {
      setAuthError(signInError.message);
      return;
    }
    setAuthPassword("");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });
    if (signUpError) {
      setAuthError(signUpError.message);
      return;
    }
    if (data.session) {
      setAuthNotice("회원가입이 완료되었습니다.");
    } else {
      setAuthNotice("회원가입이 완료되었습니다. 이메일 확인 후 로그인해주세요.");
      setView("sign_in");
    }
    setAuthPassword("");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      authEmail,
      {
        redirectTo: window.location.origin,
      },
    );
    if (resetError) {
      setAuthError(resetError.message);
      return;
    }
    setAuthNotice("비밀번호 재설정 이메일을 보냈습니다.");
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      setAuthError(updateError.message);
      return;
    }
    setAuthNotice("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    setView("sign_in");
    setNewPassword("");
    await supabase.auth.signOut();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSessionEmail(null);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>To-do List</h1>
        <p>React + Vite 기반 MVP</p>
      </header>

      {!sessionEmail ? (
        <section className="auth">
          <div className="auth__tabs">
            <button
              className={view === "sign_in" ? "is-active" : ""}
              onClick={() => setView("sign_in")}
              type="button"
            >
              로그인
            </button>
            <button
              className={view === "sign_up" ? "is-active" : ""}
              onClick={() => setView("sign_up")}
              type="button"
            >
              회원가입
            </button>
            <button
              className={view === "reset" ? "is-active" : ""}
              onClick={() => setView("reset")}
              type="button"
            >
              비밀번호 재설정
            </button>
          </div>

          {view === "sign_in" ? (
            <form className="auth__form" onSubmit={handleSignIn}>
              <input
                type="email"
                placeholder="이메일"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
              <button type="submit">로그인</button>
            </form>
          ) : null}

          {view === "sign_up" ? (
            <form className="auth__form" onSubmit={handleSignUp}>
              <input
                type="email"
                placeholder="이메일"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                minLength={6}
                required
              />
              <button type="submit">회원가입</button>
            </form>
          ) : null}

          {view === "reset" ? (
            <form className="auth__form" onSubmit={handleReset}>
              <input
                type="email"
                placeholder="이메일"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
              <button type="submit">재설정 이메일 보내기</button>
            </form>
          ) : null}

          {view === "update_password" ? (
            <form className="auth__form" onSubmit={handleUpdatePassword}>
              <input
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <button type="submit">비밀번호 변경</button>
            </form>
          ) : null}

          {authError ? (
            <p className="auth__error" role="alert" aria-live="polite">
              {authError}
            </p>
          ) : null}
          {authNotice ? <p className="auth__notice">{authNotice}</p> : null}
        </section>
      ) : (
        <section className="auth auth--signed">
          <p className="auth__signed-in">
            로그인됨: <strong>{sessionEmail}</strong>
          </p>
          <button onClick={handleSignOut} type="button">
            로그아웃
          </button>
        </section>
      )}

      <form className="app__input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="새 할 일을 입력하세요"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError("");
          }}
          aria-label="새 할 일 입력"
          maxLength={MAX_TITLE_LENGTH}
        />
        <button type="submit" disabled={!input.trim() || !sessionEmail}>
          추가
        </button>
      </form>
      {error ? (
        <p className="app__error" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <section className="app__filters" aria-label="필터">
        <button
          className={filter === "all" ? "is-active" : ""}
          onClick={() => setFilter("all")}
          type="button"
        >
          전체
        </button>
        <button
          className={filter === "active" ? "is-active" : ""}
          onClick={() => setFilter("active")}
          type="button"
        >
          미완료
        </button>
        <button
          className={filter === "done" ? "is-active" : ""}
          onClick={() => setFilter("done")}
          type="button"
        >
          완료
        </button>
      </section>

      <ul className="app__list">
        {visible.length === 0 ? (
          <li className="app__empty">할 일이 없습니다.</li>
        ) : (
          visible.map((item) => (
            <li key={item.id} className={item.done ? "is-done" : ""}>
              <label>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleTodo(item.id)}
                />
                <span>{item.title}</span>
              </label>
              <button onClick={() => removeTodo(item.id)} type="button">
                삭제
              </button>
            </li>
          ))
        )}
      </ul>

      <footer className="app__footer">
        완료: {stats.done} / 전체: {stats.total}
      </footer>
    </div>
  );
}

export default App;
