<script>
/* Bearming Archive | Version 1.3.1 */

(function () {

  "use strict";

  const PARAM_YEAR = "y";
  const PARAM_SEARCH = "s";
  const PARAM_PAGE = "p";

  const POSTS_PER_PAGE = 25;
  const SEARCH_DEBOUNCE_MS = 140;

  const ID_WRAPPER = "bearming-archive";
  const ID_YEAR = "bearming-archive-year";
  const ID_SEARCH = "bearming-archive-search";
  const ID_PAGINATION = "bearming-pagination";
  const ID_PREV = "bearming-archive-prev";
  const ID_NEXT = "bearming-archive-next";
  const ID_INFO = "bearming-archive-info";
  const ID_EMPTY = "bearming-archive-empty";

  const showEl = (el) => { el.hidden = false; };
  const hideEl = (el) => { el.hidden = true; };

  function init() {
    if (!document.body.classList.contains("blog")) return;

    const main = document.querySelector("main");
    if (!main) return;

    if (main.querySelector("#" + ID_WRAPPER)) return;

    const sourceList =
      main.querySelector("ul.embedded.blog-posts") ||
      main.querySelector("ul.blog-posts");
    if (!sourceList) return;

    const rawItems = Array.from(sourceList.querySelectorAll("li"));
    if (!rawItems.length) return;

    const legacySearch = main.querySelector("#searchInput");
    if (legacySearch) legacySearch.remove();

    const tagsBlock = main.querySelector("#tags")?.closest("small");

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const parseDatetime = (dt) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dt);
      return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(dt);
    };

    const readParams = () => new URLSearchParams(location.search);

    const writeParams = (p) => {
      const url = new URL(location.href);
      url.pathname = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
      url.search = p.toString();
      history.replaceState(null, "", url.toString());
    };

    const setDisabled = (btn, disabled) => {
      btn.disabled = !!disabled;
    };

    const groups = Object.create(null);
    const years = Object.create(null);
    const allItems = [];

    for (let i = 0; i < rawItems.length; i++) {
      const li = rawItems[i];

      li.style.display = "";

      const time = li.querySelector("time[datetime]");
      if (!time) continue;

      const dt = time.getAttribute("datetime");
      if (!dt) continue;

      const date = parseDatetime(dt);
      if (Number.isNaN(date.getTime())) continue;

      const year = String(date.getUTCFullYear());
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const monthKey = year + "-" + month;

      const label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });

      const anchor = li.querySelector("a");
      li.dataset.bearmingArchiveYear = year;
      li.dataset.bearmingArchiveText = (anchor?.textContent || "").trim().toLowerCase();

      years[year] = (years[year] || 0) + 1;

      if (!groups[monthKey]) groups[monthKey] = { label, date, items: [] };
      groups[monthKey].items.push(li);

      allItems.push(li);
    }

    if (!allItems.length) return;

    const sortedMonths = Object.keys(groups).sort((a, b) => groups[b].date - groups[a].date);

    sourceList.remove();

    const wrapper = document.createElement("div");
    wrapper.id = ID_WRAPPER;
    wrapper.className = "bearming-archive";
    main.appendChild(wrapper);

    const currentYear = String(new Date().getUTCFullYear());
    const postsThisYear = years[currentYear] || 0;

    const card = document.createElement("div");
    card.className = "bearming-panel";

    const intro = document.createElement("p");
    intro.className = "bearming-panel-intro";
    intro.innerHTML = allItems.length + " posts since 28 February 2023, with " + postsThisYear + " of them from this year. If you\u2019re into details, check out the <a href='/stats/'>Blogging by numbers</a> page.";

    const controls = document.createElement("div");
    controls.className = "bearming-panel-controls";

    const selectWrap = document.createElement("div");
    selectWrap.className = "bearming-panel-select";

    const yearSelect = document.createElement("select");
    yearSelect.id = ID_YEAR;
    yearSelect.setAttribute("aria-label", "Filter posts by year");
    yearSelect.setAttribute("aria-controls", wrapper.id);

    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All posts";
    yearSelect.appendChild(optAll);

    Object.keys(years)
      .sort((a, b) => Number(b) - Number(a))
      .forEach((y) => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y + " (" + years[y] + ")";
        yearSelect.appendChild(opt);
      });

    selectWrap.appendChild(yearSelect);

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.id = ID_SEARCH;
    searchInput.placeholder = "Search\u2026";
    searchInput.autocomplete = "off";
    searchInput.spellcheck = false;
    searchInput.setAttribute("aria-label", "Search posts");
    searchInput.setAttribute("aria-controls", wrapper.id);

    controls.appendChild(selectWrap);
    controls.appendChild(searchInput);

    card.appendChild(intro);
    card.appendChild(controls);
    wrapper.appendChild(card);

    const emptyMsg = document.createElement("p");
    emptyMsg.id = ID_EMPTY;
    emptyMsg.className = "bearming-panel-empty";
    hideEl(emptyMsg);
    wrapper.appendChild(emptyMsg);

    const months = [];

    for (let mi = 0; mi < sortedMonths.length; mi++) {
      const key = sortedMonths[mi];
      const g = groups[key];

      const h3 = document.createElement("h3");
      h3.className = "bearming-panel-heading";
      h3.textContent = g.label;

      const ul = document.createElement("ul");
      ul.className = "blog-posts";

      for (let j = 0; j < g.items.length; j++) {
        g.items[j].hidden = false;
        ul.appendChild(g.items[j]);
      }

      wrapper.appendChild(h3);
      wrapper.appendChild(ul);

      months.push({ h3, ul });
    }

    const pagination = document.createElement("div");
    pagination.id = ID_PAGINATION;
    pagination.className = "bearming-pagination";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.id = ID_PREV;
    prevBtn.textContent = "Previous";
    prevBtn.setAttribute("aria-controls", wrapper.id);

    const info = document.createElement("span");
    info.id = ID_INFO;
    info.setAttribute("aria-live", "polite");

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.id = ID_NEXT;
    nextBtn.textContent = "Next";
    nextBtn.setAttribute("aria-controls", wrapper.id);

    pagination.appendChild(prevBtn);
    pagination.appendChild(info);
    pagination.appendChild(nextBtn);
    wrapper.appendChild(pagination);

    if (tagsBlock) wrapper.appendChild(tagsBlock);

    let currentPage = 1;
    let debounceId = null;

    const getFiltered = () => {
      const yr = yearSelect.value;
      const term = searchInput.value.trim().toLowerCase();

      if (!yr && !term) return allItems;

      return allItems.filter((item) => {
        if (yr && item.dataset.bearmingArchiveYear !== yr) return false;
        if (term && !(item.dataset.bearmingArchiveText || "").includes(term)) return false;
        return true;
      });
    };

    const updateEmptyMessage = () => {
      const yr = yearSelect.value;
      const term = searchInput.value.trim();
      const parts = [];
      if (yr) parts.push(yr);
      if (term) parts.push("\u201C" + term + "\u201D");
      emptyMsg.textContent = "No posts found" + (parts.length ? " for " + parts.join(", ") : "") + ".";
    };

    const renderPageItems = (pageItems, hasAnyResults) => {
      allItems.forEach(hideEl);
      pageItems.forEach(showEl);

      months.forEach(({ h3, ul }) => {
        const anyVisible = Array.from(ul.children).some((c) => !c.hidden);
        ul.hidden = h3.hidden = !anyVisible;
      });

      hasAnyResults ? hideEl(emptyMsg) : showEl(emptyMsg);
    };

    const syncUrl = () => {
      const yr = yearSelect.value;
      const term = searchInput.value.trim();
      const p = readParams();
      yr ? p.set(PARAM_YEAR, yr) : p.delete(PARAM_YEAR);
      term ? p.set(PARAM_SEARCH, term) : p.delete(PARAM_SEARCH);
      currentPage > 1 ? p.set(PARAM_PAGE, String(currentPage)) : p.delete(PARAM_PAGE);
      writeParams(p);
    };

    const update = () => {
      const filtered = getFiltered();
      const hasAnyResults = filtered.length > 0;
      const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
      currentPage = clamp(currentPage, 1, totalPages);

      const start = (currentPage - 1) * POSTS_PER_PAGE;
      renderPageItems(filtered.slice(start, start + POSTS_PER_PAGE), hasAnyResults);

      if (hasAnyResults) {
        info.textContent = "Page " + currentPage + " of " + totalPages;
        setDisabled(prevBtn, currentPage === 1);
        setDisabled(nextBtn, currentPage === totalPages);
        filtered.length <= POSTS_PER_PAGE ? hideEl(pagination) : showEl(pagination);
      } else {
        info.textContent = "";
        hideEl(pagination);
      }

      updateEmptyMessage();
      syncUrl();
    };

    const p0 = readParams();
    yearSelect.value = p0.get(PARAM_YEAR) || "";
    searchInput.value = p0.get(PARAM_SEARCH) || "";

    const page0 = parseInt(p0.get(PARAM_PAGE) || "1", 10);
    currentPage = Number.isFinite(page0) && page0 > 0 ? page0 : 1;

    yearSelect.addEventListener("change", () => {
      currentPage = 1;
      update();
    });

    searchInput.addEventListener("input", () => {
      currentPage = 1;
      if (debounceId) window.clearTimeout(debounceId);
      if (!searchInput.value.trim()) {
        update();
        return;
      }
      debounceId = window.setTimeout(update, SEARCH_DEBOUNCE_MS);
    });

    prevBtn.addEventListener("click", () => {
      if (prevBtn.disabled) return;
      currentPage -= 1;
      update();
    });

    nextBtn.addEventListener("click", () => {
      if (nextBtn.disabled) return;
      currentPage += 1;
      update();
    });

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();
</script>
