"use client";

export default function SentryTest() {
  return (
    <button onClick={() => { throw new Error("Frontend Sentry test error"); }}>
      Trigger Error
    </button>
  );
}
