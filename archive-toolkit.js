<script>
/* Archive toolkit | robertbirming.com */
(function () {
  "use strict";

  var PARAM_YEAR = "y";
  var PARAM_SEARCH = "s";
  var PARAM_PAGE = "p";

  var POSTS_PER_PAGE = 25;
  var SEARCH_DEBOUNCE_MS = 140;

  var ID_WRAPPER = "bearming-archive";
  var ID_YEAR = "bearming-archive-year";
  var ID_SEARCH = "bearming-archive-search";
  var ID_PAGINATION = "bearming-archive-pagination";
  var ID_PREV = "bearming-archive-prev";
  var ID_NEXT = "bearming-archive-next";
  var ID_INFO = "bearming-archive-info";
  var ID_EMPTY = "bearming-archive-empty";

  var showEl = function (el) { el.hidden = false; };
  var hideEl = function (el) { el.hidden = true; };

  function init() {
    if (!document.body.classList.contains("blog")) return;

    var main = document.querySelector("main");
    if (!main) return;

    if (main.querySelector("#" + ID_WRAPPER)) return;

    var sourceList =
      main.querySelector("ul.embedded.blog-posts") ||
      main.querySelector("ul.blog-posts");
    if (!sourceList) return;

    var rawItems = Array.from(sourceList.querySelectorAll("li"));
    if (!rawItems.length) return;

    var legacySearch = main.querySelector("#searchInput");
    if (legacySearch) legacySearch.remove();

    var tagsEl = main.querySelector("#tags");
    var tagsBlock = tagsEl ? tagsEl.closest("small") : null;

    var clamp = function (n, min, max) { return Math.min(max, Math.max(min, n)); };

    var parseDatetime = function (dt) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dt);
      return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(dt);
    };

    var readParams = function () { return new URLSearchParams(location.search); };

    var writeParams = function (p) {
      var url = new URL(location.href);
      url.pathname = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
      url.search = p.toString();
      history.replaceState(null, "", url.toString());
    };

    var setDisabled = function (btn, disabled) {
      btn.disabled = !!disabled;
      btn.setAttribute("aria-disabled", disabled ? "true" : "false");
    };

    var groups = Object.create(null);
    var years = Object.create(null);
    var allItems = [];

    for (var i = 0; i < rawItems.length; i++) {
      var li = rawItems[i];

      var time = li.querySelector("time[datetime]");
      if (!time) continue;

      var dt = time.getAttribute("datetime");
      if (!dt) continue;

      var date = parseDatetime(dt);
      if (Number.isNaN(date.getTime())) continue;

      var year = String(date.getUTCFullYear());
      var month = String(date.getUTCMonth() + 1).padStart(2, "0");
      var monthKey = year + "-" + month;

      var label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });

      li.dataset.bearmingArchiveYear = year;
      li.dataset.bearmingArchiveText = (li.textContent || "").toLowerCase();

      years[year] = (years[year] || 0) + 1;

      if (!groups[monthKey]) groups[monthKey] = { label: label, date: date, items: [] };
      groups[monthKey].items.push(li);

      allItems.push(li);
    }

    if (!allItems.length) return;

    var sortedMonths = Object.keys(groups).sort(function (a, b) {
      return groups[b].date - groups[a].date;
    });

    sourceList.remove();

    var wrapper = document.createElement("div");
    wrapper.id = ID_WRAPPER;
    wrapper.className = "bearming-archive";
    main.appendChild(wrapper);

    var controls = document.createElement("div");
    controls.className = "bearming-archive-controls";

    var selectWrap = document.createElement("div");
    selectWrap.className = "bearming-archive-select";

    var yearSelect = document.createElement("select");
    yearSelect.id = ID_YEAR;
    yearSelect.setAttribute("aria-label", "Filter posts by year");
    yearSelect.setAttribute("aria-controls", wrapper.id);

    var optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All posts (" + allItems.length + ")";
    yearSelect.appendChild(optAll);

    Object.keys(years)
      .sort(function (a, b) { return Number(b) - Number(a); })
      .forEach(function (y) {
        var opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y + " (" + years[y] + ")";
        yearSelect.appendChild(opt);
      });

    selectWrap.appendChild(yearSelect);

    var searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.id = ID_SEARCH;
    searchInput.placeholder = "Search\u2026";
    searchInput.autocomplete = "off";
    searchInput.spellcheck = false;
    searchInput.setAttribute("aria-label", "Search posts");
    searchInput.setAttribute("aria-controls", wrapper.id);

    controls.appendChild(selectWrap);
    controls.appendChild(searchInput);
    wrapper.appendChild(controls);

    var emptyMsg = document.createElement("p");
    emptyMsg.id = ID_EMPTY;
    emptyMsg.className = "bearming-archive-empty";
    hideEl(emptyMsg);
    wrapper.appendChild(emptyMsg);

    var monthHeaders = [];
    var monthLists = [];

    for (var mi = 0; mi < sortedMonths.length; mi++) {
      var key = sortedMonths[mi];
      var g = groups[key];

      var h3 = document.createElement("h3");
      h3.className = "bearming-archive-month";
      h3.textContent = g.label;

      var ul = document.createElement("ul");
      ul.className = "blog-posts";

      for (var j = 0; j < g.items.length; j++) {
        g.items[j].hidden = false;
        ul.appendChild(g.items[j]);
      }

      wrapper.appendChild(h3);
      wrapper.appendChild(ul);

      monthHeaders.push(h3);
      monthLists.push(ul);
    }

    var pagination = document.createElement("div");
    pagination.id = ID_PAGINATION;
    pagination.className = "bearming-archive-pagination";

    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.id = ID_PREV;
    prevBtn.textContent = "Previous";
    prevBtn.setAttribute("aria-controls", wrapper.id);

    var info = document.createElement("span");
    info.id = ID_INFO;
    info.setAttribute("aria-live", "polite");

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.id = ID_NEXT;
    nextBtn.textContent = "Next";
    nextBtn.setAttribute("aria-controls", wrapper.id);

    pagination.appendChild(prevBtn);
    pagination.appendChild(info);
    pagination.appendChild(nextBtn);
    wrapper.appendChild(pagination);

    if (tagsBlock) wrapper.appendChild(tagsBlock);

    var currentPage = 1;
    var debounceId = null;

    var getFiltered = function () {
      var yr = yearSelect.value;
      var term = searchInput.value.trim().toLowerCase();

      if (!yr && !term) return allItems;

      var out = [];
      for (var fi = 0; fi < allItems.length; fi++) {
        var item = allItems[fi];
        if (yr && item.dataset.bearmingArchiveYear !== yr) continue;
        if (term && (item.dataset.bearmingArchiveText || "").indexOf(term) === -1) continue;
        out.push(item);
      }
      return out;
    };

    var updateEmptyMessage = function () {
      var yr = yearSelect.value;
      var term = searchInput.value.trim();
      var parts = [];
      if (yr) parts.push(yr);
      if (term) parts.push("\u201C" + term + "\u201D");
      emptyMsg.textContent = "No posts found" + (parts.length ? " for " + parts.join(", ") : "") + ".";
    };

    var renderPageItems = function (pageItems, hasAnyResults) {
      for (var ri = 0; ri < allItems.length; ri++) hideEl(allItems[ri]);
      for (var pi = 0; pi < pageItems.length; pi++) showEl(pageItems[pi]);

      for (var gi = 0; gi < monthLists.length; gi++) {
        var mUl = monthLists[gi];
        var anyVisible = false;
        for (var ci = 0; ci < mUl.children.length; ci++) {
          if (!mUl.children[ci].hidden) { anyVisible = true; break; }
        }
        if (anyVisible) {
          showEl(mUl);
          showEl(monthHeaders[gi]);
        } else {
          hideEl(mUl);
          hideEl(monthHeaders[gi]);
        }
      }

      if (hasAnyResults) hideEl(emptyMsg);
      else showEl(emptyMsg);
    };

    var syncUrl = function () {
      var yr = yearSelect.value;
      var term = searchInput.value.trim();
      var p = readParams();
      yr ? p.set(PARAM_YEAR, yr) : p.delete(PARAM_YEAR);
      term ? p.set(PARAM_SEARCH, term) : p.delete(PARAM_SEARCH);
      currentPage > 1 ? p.set(PARAM_PAGE, String(currentPage)) : p.delete(PARAM_PAGE);
      writeParams(p);
    };

    var update = function () {
      var filtered = getFiltered();
      var hasAnyResults = filtered.length > 0;
      var totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
      currentPage = clamp(currentPage, 1, totalPages);

      var start = (currentPage - 1) * POSTS_PER_PAGE;
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

    var p0 = readParams();
    yearSelect.value = p0.get(PARAM_YEAR) || "";
    searchInput.value = p0.get(PARAM_SEARCH) || "";
    var page0 = parseInt(p0.get(PARAM_PAGE) || "1", 10);
    currentPage = Number.isFinite(page0) && page0 > 0 ? page0 : 1;

    yearSelect.addEventListener("change", function () {
      currentPage = 1;
      update();
    });

    searchInput.addEventListener("input", function () {
      currentPage = 1;
      if (debounceId) window.clearTimeout(debounceId);
      if (!searchInput.value.trim()) {
        update();
        return;
      }
      debounceId = window.setTimeout(update, SEARCH_DEBOUNCE_MS);
    });

    prevBtn.addEventListener("click", function () {
      if (prevBtn.disabled) return;
      currentPage -= 1;
      update();
    });

    nextBtn.addEventListener("click", function () {
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
