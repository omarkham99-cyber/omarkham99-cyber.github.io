/* Prefetch a project page when its tile is hovered so it loads fast on click.
   The tile-part reveal itself is done natively by the browser's cross-document
   View Transitions (see @view-transition in the CSS), which captures the real
   destination page so it shows through as the tiles separate (no gray flash). */
(function () {
  var prefetched = {};
  function prefetch(href) {
    if (!href || prefetched[href]) return;
    prefetched[href] = 1;
    var l = document.createElement("link");
    l.rel = "prefetch"; l.href = href;
    document.head.appendChild(l);
  }
  document.querySelectorAll(".grid").forEach(function (grid) {
    grid.addEventListener("mouseover", function (e) {
      var tile = e.target.closest(".tile");
      if (tile) prefetch(tile.getAttribute("href"));
    });
    // Record which tile was clicked so the destination page can ripple the
    // tile-part transition outward from it. Plain left-click only (so
    // cmd/ctrl-click to open a new tab doesn't leave a stale origin).
    grid.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var tile = e.target.closest(".tile");
      if (!tile) return;
      var idx = Array.prototype.indexOf.call(grid.querySelectorAll(".tile"), tile);
      try { sessionStorage.setItem("cpFrom", idx); } catch (err) {}
    });
  });
})();

/* Custom minimal video player (no native-controls scrim) */
(function () {
  function fmt(t) { t = Math.floor(t || 0); var m = Math.floor(t / 60), s = t % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  document.querySelectorAll(".cp-player").forEach(function (p) {
    var v = p.querySelector("video");
    var track = p.querySelector(".cp-track"), fill = p.querySelector(".cp-fill");
    var cur = p.querySelector(".cp-cur"), dur = p.querySelector(".cp-dur");
    var mute = p.querySelector(".cp-mute"), fs = p.querySelector(".cp-fs");
    var toggle = function () { if (v.paused) v.play(); else v.pause(); };
    p.classList.add("paused");
    v.addEventListener("loadedmetadata", function () { dur.textContent = fmt(v.duration); });
    if (v.readyState >= 1) dur.textContent = fmt(v.duration);
    v.addEventListener("play", function () { p.classList.add("playing"); p.classList.remove("paused"); });
    v.addEventListener("pause", function () { p.classList.remove("playing"); p.classList.add("paused"); });
    v.addEventListener("timeupdate", function () {
      fill.style.width = (v.duration ? (v.currentTime / v.duration) * 100 : 0) + "%";
      cur.textContent = fmt(v.currentTime);
    });
    p.querySelector(".cp-big").addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    p.querySelector(".cp-pp").addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    v.addEventListener("click", toggle);
    function seek(e) { var r = track.getBoundingClientRect(); var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; v.currentTime = Math.max(0, Math.min(1, x / r.width)) * v.duration; }
    var dragging = false;
    track.addEventListener("mousedown", function (e) { dragging = true; seek(e); });
    document.addEventListener("mousemove", function (e) { if (dragging) seek(e); });
    document.addEventListener("mouseup", function () { dragging = false; });
    track.addEventListener("click", seek);
    mute.addEventListener("click", function (e) { e.stopPropagation(); v.muted = !v.muted; mute.classList.toggle("muted", v.muted); });
    fs.addEventListener("click", function (e) {
      e.stopPropagation();
      if (document.fullscreenElement) document.exitFullscreen();
      else if (p.requestFullscreen) p.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
  });
})();

/* Lightbox for project galleries */
(function () {
  var gallery = document.querySelector(".gallery");
  if (!gallery) return;

  var imgs = Array.prototype.map.call(
    gallery.querySelectorAll("button"),
    function (b) { return b.getAttribute("data-full"); }
  );
  var i = 0;

  var lb = document.createElement("div");
  lb.className = "lb";
  lb.innerHTML =
    '<button class="lb-btn close" aria-label="Close">&times;</button>' +
    '<button class="lb-btn prev" aria-label="Previous">&#8249;</button>' +
    '<img alt="">' +
    '<button class="lb-btn next" aria-label="Next">&#8250;</button>' +
    '<div class="count"></div>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector("img");
  var count = lb.querySelector(".count");

  function show(n) {
    i = (n + imgs.length) % imgs.length;
    lbImg.src = imgs[i];
    count.textContent = (i + 1) + " / " + imgs.length;
  }
  function open(n) { show(n); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
  function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }

  gallery.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    open(Array.prototype.indexOf.call(gallery.querySelectorAll("button"), btn));
  });
  lb.querySelector(".next").addEventListener("click", function (e) { e.stopPropagation(); show(i + 1); });
  lb.querySelector(".prev").addEventListener("click", function (e) { e.stopPropagation(); show(i - 1); });
  lb.querySelector(".close").addEventListener("click", close);
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(i + 1);
    else if (e.key === "ArrowLeft") show(i - 1);
  });

  // Touch swipe
  var x0 = null;
  lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
