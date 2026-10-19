/* The R-1 wishlist: one email field. Signups go to the same private sheet as Jar's waitlist, tagged app "r1". */
(() => {
  "use strict";

  // Google Apps Script web app that appends each signup to the waitlist sheet (scripts/jar-waitlist.gs).
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbwM0haVn57iStqymBUlJqIybs-K-UnaUDZKR9pA4Kxe8m5EcLke5V5-0N2_kyEaz0vFzg/exec";
  const KEY = "r1.wishlist.email";

  const form = document.getElementById("form"), input = document.getElementById("email"), note = document.getElementById("note");
  const submit = document.getElementById("submit"), trap = document.getElementById("website");
  const done = document.getElementById("done"), who = document.getElementById("who");
  const base = note.textContent;
  const store = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch {} };
  const saved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

  function showDone(email) {
    who.textContent = email;
    form.hidden = true; note.hidden = true; done.hidden = false;
  }
  document.getElementById("again").addEventListener("click", () => {
    store(null);
    done.hidden = true; form.hidden = false; note.hidden = false;
    note.textContent = base; note.classList.remove("err");
    input.focus();
  });
  input.addEventListener("input", () => { note.textContent = base; note.classList.remove("err"); });

  async function send(email) {
    const res = await fetch(ENDPOINT, { method: "POST", body: new URLSearchParams({ email, app: "r1", website: trap.value }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "rejected");
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (submit.disabled) return;
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      note.textContent = email ? "Check the address. It should look like name@example.com" : "Enter your email to join the wishlist";
      note.classList.add("err"); input.focus(); return;
    }
    submit.disabled = true; note.classList.remove("err"); note.textContent = "Adding you to the list…";
    try { await send(email); }
    catch {
      note.textContent = "Couldn't reach the list. Check your connection and try again.";
      note.classList.add("err"); submit.disabled = false; return;
    }
    submit.disabled = false;
    store(email); input.value = "";
    showDone(email);
  });

  const known = saved();
  if (known) showDone(known);
})();
