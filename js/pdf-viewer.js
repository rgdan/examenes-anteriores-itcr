import { subjectLabel, professorLabel, parcialLabel } from "./utils.js";

/**
 * Detects if the user is browsing from a mobile or tablet device.
 *
 * @returns {boolean}
 */
export function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && /Macintosh/i.test(navigator.userAgent))
  );
}

/**
 * Opens the PDF viewer modal and loads the given PDF item.
 *
 * @param {ExamItem} item
 */
export function openPdfViewer(item) {
  const modal = document.getElementById("pdf-viewer-modal");
  const titleEl = document.getElementById("pdf-modal-title");
  const iframe = document.getElementById("pdf-modal-iframe");
  const loader = document.getElementById("pdf-modal-loader");
  const downloadBtn = document.getElementById("pdf-modal-download");

  const subjectName = subjectLabel(item.school, item.subject);
  const profName = item.professor ? professorLabel(item.professor) : "Cátedra";
  const kindLabel = item.kind === "enunciado" ? "Enunciado" : "Solución";
  const displayTitle = `${subjectName} (${profName}) - ${parcialLabel(item.parcial)} ${item.year} - ${kindLabel}`;

  titleEl.textContent = displayTitle;
  titleEl.title = displayTitle;

  loader.style.display = "flex";
  const encodedPath = encodeURI(item.path);
  iframe.src = encodedPath;

  if (downloadBtn) {
    downloadBtn.href = encodedPath;
  }

  iframe.onload = () => {
    loader.style.display = "none";
  };

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

/**
 * Closes the PDF viewer modal and clears the iframe source.
 */
export function closePdfViewer() {
  const modal = document.getElementById("pdf-viewer-modal");
  const iframe = document.getElementById("pdf-modal-iframe");
  const downloadBtn = document.getElementById("pdf-modal-download");

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  iframe.src = "";
  if (downloadBtn) {
    downloadBtn.href = "";
  }
}

/** Sets up the event listeners for the PDF viewer modal. */
export function setupPdfViewerModal() {
  const closeBtn = document.getElementById("pdf-modal-close");
  const modal = document.getElementById("pdf-viewer-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closePdfViewer);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closePdfViewer();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && modal.classList.contains("active")) {
      closePdfViewer();
    }
  });
}
