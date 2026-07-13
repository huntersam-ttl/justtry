import "./styles.css";
import { supabase, supabaseReady, storageUrl } from "./supabase.js";
import { createTypes, fallbackEvents, fallbackFeatured, originalSeries } from "./data.js";

const app = document.querySelector("#app");
const state = {
  content: [],
  events: [],
  applications: [],
  collaborations: [],
  series: [],
  session: null
};

const pages = [
  ["Home", "/"],
  ["Stories", "/stories"],
  ["Shows", "/shows"],
  ["Events", "/events"],
  ["About", "/about"],
  ["Join / Collaborate", "/join"],
  ["Admin", "/admin"]
];

function route() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function go(path) {
  history.pushState({}, "", path);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadPublicData() {
  if (!supabaseReady) return;

  const [contentRes, eventsRes, seriesRes] = await Promise.all([
    supabase.from("content_items").select("*").eq("status", "published").order("published_date", { ascending: false }),
    supabase.from("events").select("*").in("status", ["published", "planned"]).order("date", { ascending: true }),
    supabase.from("series").select("*").order("created_at", { ascending: false })
  ]);

  state.content = contentRes.data || [];
  state.events = eventsRes.data || [];
  state.series = seriesRes.data || [];
}

async function loadAdminData() {
  if (!supabaseReady || !state.session) return;

  const [contentRes, eventsRes, appsRes, collabRes, seriesRes] = await Promise.all([
    supabase.from("content_items").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase.from("team_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("collaboration_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("series").select("*").order("created_at", { ascending: false })
  ]);

  state.content = contentRes.data || state.content;
  state.events = eventsRes.data || state.events;
  state.applications = appsRes.data || [];
  state.collaborations = collabRes.data || [];
  state.series = seriesRes.data || state.series;
}

function shell(inner) {
  return `
    <header class="site-header">
      <a class="brand" data-link href="/">
        <span class="brand-mark">JT</span>
        <span><strong>Just Try</strong><small>Media Hub</small></span>
      </a>
      <nav class="nav">${pages.map(([label, path]) => `<a data-link class="${route() === path ? "active" : ""}" href="${path}">${label}</a>`).join("")}</nav>
      <button class="menu-button" data-menu>Menu</button>
    </header>
    <main>${inner}</main>
    <footer class="footer">
      <div>
        <p class="eyebrow">Just Try Media</p>
        <h2>Stories for people still building.</h2>
      </div>
      <div class="footer-links">
        <a data-link href="/stories">Stories</a>
        <a data-link href="/shows">Shows</a>
        <a data-link href="/events">Events</a>
        <a data-link href="/join">Work With Us</a>
      </div>
    </footer>
  `;
}

function cardImage(item, label = "Coming soon") {
  const image = storageUrl(item.thumbnail_image || item.poster_image);
  if (image) return `<img src="${image}" alt="">`;
  return `<div class="visual-fallback"><span>${label}</span></div>`;
}

function contentCard(item) {
  return `
    <article class="content-card">
      <div class="card-media">${cardImage(item, item.type || item.category || "Story")}</div>
      <div class="card-body">
        <div class="meta-line"><span>${item.type || "feature"}</span><span>${item.category || "Just Try"}</span></div>
        <h3>${item.title}</h3>
        <p>${item.excerpt || "A Just Try Media story is being shaped. Check back soon."}</p>
        ${item.video_url || item.external_link ? `<a class="text-link" href="${item.video_url || item.external_link}" target="_blank" rel="noreferrer">Watch / Read</a>` : ""}
      </div>
    </article>
  `;
}

function eventCard(item) {
  return `
    <article class="event-card">
      <div>
        <p class="eyebrow">${item.date || "TBA"} · ${item.location || "Just Try"}</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
      ${item.ticket_link ? `<a class="button ghost" href="${item.ticket_link}" target="_blank" rel="noreferrer">Details</a>` : `<span class="pill">${item.status || "planned"}</span>`}
    </article>
  `;
}

function homePage() {
  const featured = state.content.filter((item) => item.featured).slice(0, 3);
  const cards = featured.length ? featured : fallbackFeatured;
  const events = state.events.length ? state.events.slice(0, 2) : fallbackEvents;
  const series = state.series.length ? state.series : originalSeries;

  return shell(`
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-copy">
        <p class="eyebrow">Documentaries · Shows · Events · Stories</p>
        <h1>For the ones still trying.</h1>
        <p>A media hub for documentaries, shows, events, stories, and people building from zero.</p>
        <div class="actions">
          <a data-link class="button primary" href="/stories">Explore Stories</a>
          <a data-link class="button secondary" href="/join">Work With Us</a>
        </div>
      </div>
      <div class="hero-panel">
        <span>Now building</span>
        <strong>Original stories, live formats, founder films, creator culture.</strong>
      </div>
    </section>

    ${sectionHeader("Featured Content", "Fresh films, stories, and formats from the hub.")}
    <section class="grid three">${cards.map(contentCard).join("")}</section>

    ${sectionHeader("What We Create", "Flexible formats for culture, creators, events, and businesses with something real to say.")}
    <section class="create-grid">${createTypes.map((type) => `<article><span>${type.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span><h3>${type}</h3><p>Premium storytelling built for digital audiences, communities, and moments that deserve a proper record.</p></article>`).join("")}</section>

    ${sectionHeader("Original Series", "Recurring formats designed to grow into a recognisable Just Try slate.")}
    <section class="series-grid">${series.map((item) => `<article><p class="eyebrow">Original Series</p><h3>${item.title}</h3><p>${item.description || item.excerpt || "A Just Try original format in development."}</p></article>`).join("")}</section>

    ${sectionHeader("Events", "Upcoming moments plus event coverage for organisers who want the story to last.")}
    <section class="stack">${events.map(eventCard).join("")}</section>

    <section class="split-band">
      <div>
        <p class="eyebrow">Join the Hub</p>
        <h2>Hosts, editors, videographers, designers, writers, marketers, outreach people.</h2>
        <p>Just Try is building a creative network around real stories and practical ambition.</p>
        <a data-link class="button primary" href="/join">Apply to Join</a>
      </div>
      <div>
        <p class="eyebrow">Collaborate</p>
        <h2>Creators, artists, event organisers, brands, small businesses, and founders.</h2>
        <p>Bring a story, launch, event, person, product, or messy early idea. We shape it into media.</p>
        <a data-link class="button secondary" href="/join#collaborate">Start a Collaboration</a>
      </div>
    </section>
  `);
}

function sectionHeader(title, text) {
  return `<div class="section-heading"><p class="eyebrow">${title}</p><h2>${text}</h2></div>`;
}

function listingPage(kind) {
  const titleMap = {
    "/stories": ["Stories", "Creator stories, founder stories, blogs, features, and culture pieces."],
    "/shows": ["Shows", "Original formats, conversations, challenges, diaries, and recurring series."],
    "/events": ["Events", "Upcoming events, event films, and coverage services."]
  };
  const [title, intro] = titleMap[route()] || titleMap["/stories"];
  const items = route() === "/events"
    ? state.events
    : state.content.filter((item) => kind.includes(item.type) || kind.includes(item.category));
  const fallback = route() === "/events" ? fallbackEvents : fallbackFeatured;

  return shell(`
    <section class="page-hero">
      <p class="eyebrow">Just Try Media</p>
      <h1>${title}</h1>
      <p>${intro}</p>
    </section>
    <section class="${route() === "/events" ? "stack" : "grid three"}">
      ${(items.length ? items : fallback).map(route() === "/events" ? eventCard : contentCard).join("")}
    </section>
  `);
}

function aboutPage() {
  return shell(`
    <section class="page-hero compact">
      <p class="eyebrow">About</p>
      <h1>A media hub for the attempt, not just the arrival.</h1>
      <p>Just Try Media documents people, cultures, communities, events, and early-stage ambition with cinematic care and editorial taste.</p>
    </section>
    <section class="about-grid">
      <article><h3>Editorial</h3><p>We care about story, rhythm, honesty, and the details that make people feel real.</p></article>
      <article><h3>Cinematic</h3><p>Films, photos, shows, and digital-first formats that look considered without feeling distant.</p></article>
      <article><h3>Youthful</h3><p>A voice built for creators, students, founders, communities, and people making their first serious moves.</p></article>
    </section>
  `);
}

function joinPage() {
  return shell(`
    <section class="page-hero compact">
      <p class="eyebrow">Join / Collaborate</p>
      <h1>Build the hub with us.</h1>
      <p>Apply to join the creative team or send a collaboration request for a story, event, creator, artist, brand, or founder project.</p>
    </section>
    <section class="form-grid">
      ${formShell("join-form", "Join the Hub", ["name", "email", "role", "location", "portfolio_url", "message"])}
      ${formShell("collab-form", "Collaborate", ["name", "email", "project_type", "budget_range", "timeline", "message"])}
    </section>
  `);
}

function formShell(id, title, fields) {
  return `
    <form class="panel-form" id="${id}">
      <h2>${title}</h2>
      ${fields.map((field) => field === "message"
        ? `<label>${label(field)}<textarea name="${field}" rows="5" required></textarea></label>`
        : `<label>${label(field)}<input name="${field}" ${field === "email" ? "type=\"email\"" : "type=\"text\""} ${["name", "email"].includes(field) ? "required" : ""}></label>`
      ).join("")}
      <button class="button primary" type="submit">Submit</button>
      <p class="form-status" aria-live="polite"></p>
    </form>
  `;
}

function label(name) {
  return name.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".form-status");
  const data = Object.fromEntries(new FormData(form));

  if (!supabaseReady) {
    status.textContent = "Supabase is not connected yet. Add your project URL/key to enable submissions.";
    return;
  }

  const table = form.id === "join-form" ? "team_applications" : "collaboration_requests";
  const { error } = await supabase.from(table).insert(data);
  status.textContent = error ? error.message : "Submitted. We will review it from the admin dashboard.";
  if (!error) form.reset();
}

async function adminPage() {
  if (!supabaseReady) {
    return shell(`<section class="page-hero compact"><p class="eyebrow">Admin</p><h1>Connect Supabase to enable the dashboard.</h1><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, apply the SQL migration, then redeploy.</p></section>`);
  }

  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  if (!state.session) return shell(loginView());

  await loadAdminData();
  return shell(dashboardView());
}

function loginView() {
  return `
    <section class="page-hero compact">
      <p class="eyebrow">Admin</p>
      <h1>Sign in to manage Just Try Media.</h1>
    </section>
    <section class="admin-shell single">
      <form class="panel-form" id="login-form">
        <label>Email<input name="email" type="email" required></label>
        <label>Password<input name="password" type="password" required></label>
        <button class="button primary" type="submit">Login</button>
        <p class="form-status"></p>
      </form>
    </section>
  `;
}

function dashboardView() {
  const published = state.content.filter((item) => item.status === "published").length;
  const featured = state.content.filter((item) => item.featured).length;
  return `
    <section class="admin-hero">
      <div><p class="eyebrow">Admin Dashboard</p><h1>Just Try Media control room.</h1></div>
      <button class="button secondary" data-logout>Logout</button>
    </section>
    <section class="stats">
      <article><span>${state.content.length}</span><p>Content Items</p></article>
      <article><span>${published}</span><p>Published</p></article>
      <article><span>${featured}</span><p>Featured</p></article>
      <article><span>${state.applications.length + state.collaborations.length}</span><p>Requests</p></article>
    </section>
    <section class="admin-grid">
      ${contentManager()}
      ${eventManager()}
      ${seriesManager()}
      ${requestManager("Team Applications", state.applications, ["name", "email", "role", "location", "portfolio_url", "message"])}
      ${requestManager("Collaboration Requests", state.collaborations, ["name", "email", "project_type", "budget_range", "timeline", "message"])}
    </section>
  `;
}

function contentManager() {
  return `
    <div class="admin-panel wide">
      <h2>Posts / Videos / Blogs</h2>
      <form class="mini-form" id="content-form">
        ${["title", "slug", "category", "excerpt", "thumbnail_image", "video_url", "external_link"].map((field) => `<input name="${field}" placeholder="${label(field)}">`).join("")}
        <label class="file-field">Upload Thumbnail<input name="thumbnail_file" type="file" accept="image/*"></label>
        <select name="type">${["documentary", "show", "event", "blog", "feature", "short"].map((x) => `<option>${x}</option>`).join("")}</select>
        <textarea name="body" placeholder="Body"></textarea>
        <label class="check"><input type="checkbox" name="featured"> Featured</label>
        <select name="status"><option>draft</option><option>published</option></select>
        <button class="button primary" type="submit">Save Content</button>
      </form>
      ${tableList(state.content, "content_items")}
    </div>
  `;
}

function eventManager() {
  return `
    <div class="admin-panel">
      <h2>Events</h2>
      <form class="mini-form" id="event-form">
        ${["title", "slug", "date", "location", "poster_image", "ticket_link"].map((field) => `<input name="${field}" placeholder="${label(field)}">`).join("")}
        <label class="file-field">Upload Poster<input name="poster_file" type="file" accept="image/*"></label>
        <textarea name="description" placeholder="Description"></textarea>
        <select name="status"><option>planned</option><option>published</option><option>archived</option></select>
        <button class="button primary" type="submit">Save Event</button>
      </form>
      ${tableList(state.events, "events")}
    </div>
  `;
}

function seriesManager() {
  return `
    <div class="admin-panel">
      <h2>Series</h2>
      <form class="mini-form" id="series-form">
        <input name="title" placeholder="Title">
        <input name="slug" placeholder="Slug">
        <input name="poster_image" placeholder="Poster Image">
        <label class="file-field">Upload Poster<input name="poster_file" type="file" accept="image/*"></label>
        <textarea name="description" placeholder="Description"></textarea>
        <select name="status"><option>planned</option><option>active</option><option>paused</option></select>
        <button class="button primary" type="submit">Save Series</button>
      </form>
      ${tableList(state.series, "series")}
    </div>
  `;
}

function tableList(items, table) {
  if (!items.length) return `<p class="empty">Nothing saved yet.</p>`;
  return `<div class="admin-list">${items.slice(0, 8).map((item) => `
    <article>
      <strong>${item.title || item.name}</strong>
      <span>${item.status || item.type || item.email || "new"}</span>
      ${["content_items", "events"].includes(table) ? `<button data-toggle="${table}" data-id="${item.id}" data-status="${item.status === "published" ? "draft" : "published"}">${item.status === "published" ? "Unpublish" : "Publish"}</button>` : ""}
    </article>
  `).join("")}</div>`;
}

function requestManager(title, items, fields) {
  return `
    <div class="admin-panel wide">
      <h2>${title}</h2>
      ${items.length ? items.map((item) => `<article class="request-card">${fields.map((field) => item[field] ? `<p><strong>${label(field)}:</strong> ${item[field]}</p>` : "").join("")}</article>`).join("") : `<p class="empty">No requests yet.</p>`}
    </div>
  `;
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const formData = new FormData(form);
  if (data.featured === "on") data.featured = true;
  if (!("featured" in data) && form.id === "content-form") data.featured = false;
  if (form.id === "content-form" && !data.published_date && data.status === "published") data.published_date = new Date().toISOString();

  const table = { "content-form": "content_items", "event-form": "events", "series-form": "series" }[form.id];
  const uploadField = form.id === "content-form" ? "thumbnail_file" : "poster_file";
  const storageColumn = form.id === "content-form" ? "thumbnail_image" : "poster_image";
  const uploadedPath = await uploadMediaFile(formData.get(uploadField), table);
  if (uploadedPath) data[storageColumn] = uploadedPath;
  delete data.thumbnail_file;
  delete data.poster_file;

  const { error } = await supabase.from(table).insert(data);
  if (error) alert(error.message);
  else render();
}

async function uploadMediaFile(file, folder) {
  if (!file || !file.name || !file.size) return "";
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) {
    alert(error.message);
    return "";
  }
  return path;
}

async function handleLogin(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const { error } = await supabase.auth.signInWithPassword(data);
  event.currentTarget.querySelector(".form-status").textContent = error ? error.message : "Logged in.";
  if (!error) render();
}

async function toggleStatus(button) {
  const { error } = await supabase.from(button.dataset.toggle).update({ status: button.dataset.status }).eq("id", button.dataset.id);
  if (error) alert(error.message);
  else render();
}

async function render() {
  await loadPublicData();
  const current = route();
  let view = homePage();
  if (current === "/stories") view = listingPage(["blog", "feature", "short", "Creator Stories", "Founder Stories", "Culture"]);
  if (current === "/shows") view = listingPage(["show", "documentary"]);
  if (current === "/events") view = listingPage(["event"]);
  if (current === "/about") view = aboutPage();
  if (current === "/join") view = joinPage();
  if (current === "/admin") view = await adminPage();
  app.innerHTML = view;
  bind();
}

function bind() {
  document.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => {
    if (link.host === location.host) {
      event.preventDefault();
      go(link.getAttribute("href"));
    }
  }));
  document.querySelector("[data-menu]")?.addEventListener("click", () => document.querySelector(".nav")?.classList.toggle("open"));
  document.querySelectorAll("#join-form, #collab-form").forEach((form) => form.addEventListener("submit", submitForm));
  document.querySelector("#login-form")?.addEventListener("submit", handleLogin);
  document.querySelectorAll("#content-form, #event-form, #series-form").forEach((form) => form.addEventListener("submit", handleAdminSubmit));
  document.querySelector("[data-logout]")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    render();
  });
  document.querySelectorAll("[data-toggle]").forEach((button) => button.addEventListener("click", () => toggleStatus(button)));
}

window.addEventListener("popstate", render);
render();
