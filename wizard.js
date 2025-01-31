(function() {
  // ----- Custom Element Definition (Shadow DOM Tooltip) -----
  class MyWizardTooltip extends HTMLElement {
    constructor() {
      super();
      this.shadowRootEl = this.attachShadow({ mode: 'open' });
    }
    setContent(html, theme) {
      const chosenTheme = (theme === 'light' || theme === 'dark') ? theme : 'dark';
      this.setAttribute('data-theme', chosenTheme);

      const css = `
        :host {
          position: absolute;
          top: 0; left: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease-in-out;
          z-index: 9999;
          visibility: hidden;
          display: block;
        }
        :host(.visible) {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
        }

        .tooltip-body {
          background-color: var(--bg-color, #333);
          color: var(--text-color, #fff);
          padding: 12px;
          border-radius: 4px;
          font-size: 14px;
          max-width: 300px;
          white-space: normal;
          word-wrap: break-word;
          word-break: break-word;
          position: relative;
        }

        /* Light theme => white tooltip, dark text, border, 2-layer arrow */
        :host([data-theme="light"]) .tooltip-body {
          --bg-color: #fff;
          --text-color: #333;
          border: 1px solid #ccc;
        }
        /* Dark theme => dark tooltip, light text, single arrow */
        :host([data-theme="dark"]) .tooltip-body {
          --bg-color: #333;
          --text-color: #fff;
        }

        /* Dark theme => single pseudo-element for arrow */
        :host([data-theme="dark"]) .tooltip-body[data-position="top"]::after,
        :host([data-theme="dark"]) .tooltip-body[data-position="bottom"]::after {
          content: "";
          position: absolute;
          border-style: solid;
        }
        :host([data-theme="dark"]) .tooltip-body[data-position="top"]::after {
          border-width: 6px 6px 0 6px;
          border-color: #333 transparent transparent transparent;
          bottom: -6px;
          left: var(--arrow-left, 50%);
          transform: translateX(-50%);
        }
        :host([data-theme="dark"]) .tooltip-body[data-position="bottom"]::after {
          border-width: 0 6px 6px 6px;
          border-color: transparent transparent #333 transparent;
          top: -6px;
          left: var(--arrow-left, 50%);
          transform: translateX(-50%);
        }

        /* Light theme => two pseudo-elements (outline + white arrow) */
        :host([data-theme="light"]) .tooltip-body[data-position="top"],
        :host([data-theme="light"]) .tooltip-body[data-position="bottom"] {
          position: relative;
        }
        :host([data-theme="light"]) .tooltip-body[data-position="top"]::before,
        :host([data-theme="light"]) .tooltip-body[data-position="top"]::after,
        :host([data-theme="light"]) .tooltip-body[data-position="bottom"]::before,
        :host([data-theme="light"]) .tooltip-body[data-position="bottom"]::after {
          content: "";
          position: absolute;
          border-style: solid;
        }
        /* Outline arrow => ::before (7px) */
        :host([data-theme="light"]) .tooltip-body[data-position="top"]::before {
          border-width: 7px 7px 0 7px;
          border-color: #ccc transparent transparent transparent;
          bottom: -7px;
          left: var(--arrow-left, 50%);
          transform: translateX(-50%);
          z-index: 0;
        }
        :host([data-theme="light"]) .tooltip-body[data-position="bottom"]::before {
          border-width: 0 7px 7px 7px;
          border-color: transparent transparent #ccc transparent;
          top: -7px;
          left: var(--arrow-left, 50%);
          transform: translateX(-50%);
          z-index: 0;
        }
        /* Main white arrow => ::after (6px) */
        :host([data-theme="light"]) .tooltip-body[data-position="top"]::after {
          border-width: 6px 6px 0 6px;
          border-color: #fff transparent transparent transparent;
          bottom: -6px;
          left: var(--arrow-left, 50%);
          transform: translateX(-50%);
          z-index: 1;
        }
        :host([data-theme="light"]) .tooltip-body[data-position="bottom"]::after {
          border-width: 0 6px 6px 6px;
          border-color: transparent transparent #fff transparent;
          top: -6px;
          left: var(--arrow-left, 50%);
          transform: translateX(-50%);
          z-index: 1;
        }

        .tooltip-content {
          margin-bottom: 8px;
        }
        .tooltip-buttons {
          text-align: right;
        }
        .tooltip-buttons button {
          margin-left: 6px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          background-color: #555;
          border: none;
          border-radius: 4px;
          color: #fff;
        }
        .tooltip-buttons button:hover {
          background-color: #666;
        }

        @media (max-width: 600px) {
          .tooltip-body {
            max-width: 90vw;
            font-size: 13px;
          }
        }
      `;

      this.shadowRootEl.innerHTML = `
        <style>${css}</style>
        <div class="tooltip-body" id="tooltipBody">
          ${html}
        </div>
      `;
    }

    getBodyElement() {
      return this.shadowRootEl.querySelector('#tooltipBody');
    }
    shadowQuery(selector) {
      return this.shadowRootEl.querySelector(selector);
    }
  }
  customElements.define('my-wizard-tooltip', MyWizardTooltip);

  // ----- Wizard Logic -----
  let currentTooltip = null;
  let wizardSteps = [];
  let currentStepIndex = -1;
  let isWizardActive = false;
  let wizardId = null;
  let chosenTheme = 'dark';
  let autoScroll = false;

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return true;
  }

  function createTooltipElement(htmlContent) {
    const tooltipEl = document.createElement('my-wizard-tooltip');
    tooltipEl.setContent(htmlContent, chosenTheme);
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function clampToViewport(top, left, width, height, margin) {
    let clampedTop = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    let clampedLeft = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    return { top: clampedTop, left: clampedLeft };
  }

  function positionTooltip(tooltipEl, targetEl, offset) {
    const rect = targetEl.getBoundingClientRect();
    const bodyEl = tooltipEl.getBodyElement();

    tooltipEl.style.visibility = 'hidden';
    tooltipEl.style.display = 'block';

    let initWidth = bodyEl.offsetWidth;
    let initHeight = bodyEl.offsetHeight;

    let spaceTop = rect.top;
    let spaceBottom = window.innerHeight - rect.bottom;
    let chosenPosition = spaceTop > spaceBottom ? 'top' : 'bottom';

    let top = 0;
    let left = rect.left + window.scrollX + (rect.width - initWidth) / 2;

    if (chosenPosition === 'top') {
      top = rect.top + window.scrollY - initHeight - offset;
      if (top < 0) {
        chosenPosition = 'bottom';
        top = rect.bottom + window.scrollY + offset;
      }
    } else {
      top = rect.bottom + window.scrollY + offset;
      if (top + initHeight > window.innerHeight) {
        chosenPosition = 'top';
        top = rect.top + window.scrollY - initHeight - offset;
      }
    }

    const margin = 8;
    let clamped = clampToViewport(top, left, initWidth, initHeight, margin);
    top = clamped.top;
    left = clamped.left;

    bodyEl.dataset.position = chosenPosition;
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';

    // Arrow offset
    let hostCenterX = rect.left + rect.width / 2;
    let arrowLeft = hostCenterX - left;
    arrowLeft = Math.max(8, Math.min(arrowLeft, initWidth - 8));
    bodyEl.style.setProperty('--arrow-left', arrowLeft + 'px');

    tooltipEl.style.display = 'none';
    tooltipEl.style.visibility = '';
  }

  function showTooltipForElement(targetEl, messageHTML, showPrev, showNext) {
    const prevBtnHtml = `<button id="wizardPrevBtn">← Prev</button>`;
    const nextBtnHtml = `<button id="wizardNextBtn">Next →</button>`;
    const closeBtnHtml = `<button id="wizardCloseBtn">× Close</button>`;

    const htmlContent = `
      <div class="tooltip-content">${messageHTML}</div>
      <div class="tooltip-buttons">
        ${prevBtnHtml}
        ${nextBtnHtml}
        ${closeBtnHtml}
      </div>
    `;

    const tooltipEl = createTooltipElement(htmlContent);
    positionTooltip(tooltipEl, targetEl, 8);

    requestAnimationFrame(() => {
      tooltipEl.style.display = 'block';
      tooltipEl.classList.add('visible');
    });

    if (!showPrev) tooltipEl.shadowQuery('#wizardPrevBtn').style.display = 'none';
    if (!showNext) tooltipEl.shadowQuery('#wizardNextBtn').style.display = 'none';

    return tooltipEl;
  }

  function removeTooltip(tooltipEl) {
    if (!tooltipEl) return;
    tooltipEl.classList.remove('visible');
    setTimeout(() => {
      if (tooltipEl && tooltipEl.parentNode) {
        tooltipEl.parentNode.removeChild(tooltipEl);
      }
    }, 200);
  }

  function skipForwardIfInvisible() {
    while (currentStepIndex < wizardSteps.length) {
      let el = document.querySelector(wizardSteps[currentStepIndex].selector);
      if (el && isElementVisible(el)) break;
      currentStepIndex++;
    }
  }
  function skipBackwardIfInvisible() {
    while (currentStepIndex >= 0) {
      let el = document.querySelector(wizardSteps[currentStepIndex].selector);
      if (el && isElementVisible(el)) break;
      currentStepIndex--;
    }
  }

  function hasPreviousVisibleStep() {
    let idx = currentStepIndex - 1;
    while (idx >= 0) {
      let el = document.querySelector(wizardSteps[idx].selector);
      if (el && isElementVisible(el)) return true;
      idx--;
    }
    return false;
  }
  function hasNextVisibleStep() {
    let idx = currentStepIndex + 1;
    while (idx < wizardSteps.length) {
      let el = document.querySelector(wizardSteps[idx].selector);
      if (el && isElementVisible(el)) return true;
      idx++;
    }
    return false;
  }

  function hideCurrentTooltip() {
    if (currentTooltip) {
      removeTooltip(currentTooltip);
      currentTooltip = null;
    }
  }

  function finishWizard() {
    isWizardActive = false;
    hideCurrentTooltip();
    if (wizardId) {
      localStorage.setItem('wizardCompleted-' + wizardId, 'true');
    }
    wizardSteps = [];
    currentStepIndex = -1;
    wizardId = null;
  }

  function nextStep() {
    currentStepIndex++;
    skipForwardIfInvisible();
    if (currentStepIndex >= wizardSteps.length) {
      finishWizard();
    } else {
      showCurrentStep();
    }
  }
  function prevStep() {
    currentStepIndex--;
    skipBackwardIfInvisible();
    if (currentStepIndex < 0) {
      finishWizard();
    } else {
      showCurrentStep();
    }
  }

  function finalizeShowStep(el, messageHTML) {
    const prevVis = hasPreviousVisibleStep();
    const nextVis = hasNextVisibleStep();
    currentTooltip = showTooltipForElement(el, messageHTML, prevVis, nextVis);

    let prevBtn = currentTooltip.shadowQuery('#wizardPrevBtn');
    let nextBtn = currentTooltip.shadowQuery('#wizardNextBtn');
    let closeBtn = currentTooltip.shadowQuery('#wizardCloseBtn');

    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (closeBtn) closeBtn.addEventListener('click', finishWizard);
  }

  function showCurrentStep() {
    hideCurrentTooltip();
    if (!isWizardActive || currentStepIndex < 0 || currentStepIndex >= wizardSteps.length) {
      finishWizard();
      return;
    }
    let step = wizardSteps[currentStepIndex];
    let el = document.querySelector(step.selector);
    if (!el || !isElementVisible(el)) {
      console.warn("Skipping step at index", currentStepIndex, " -> next");
      nextStep();
      return;
    }

    if (autoScroll) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        finalizeShowStep(el, step.text);
      }, 300);
    } else {
      finalizeShowStep(el, step.text);
    }
  }

  /**
   * startWizard(steps, wizardId, forceStart, theme, options)
   */
  function startWizard(steps, id, forceStart, theme, options) {
    if (!Array.isArray(steps) || steps.length === 0) {
      console.warn("No steps provided for the wizard.");
      return;
    }
    if (id && !forceStart) {
      let completed = localStorage.getItem('wizardCompleted-' + id) === 'true';
      if (completed) {
        console.log("Wizard", id, "already completed. Skipping.");
        return;
      }
    }

    wizardSteps = steps;
    currentStepIndex = 0;
    isWizardActive = true;
    wizardId = id || null;
    chosenTheme = (theme === 'light') ? 'light' : 'dark';
    autoScroll = (options && options.autoScroll === true);

    skipForwardIfInvisible();
    showCurrentStep();
  }

  window.WizardModule = {
    startWizard,
    finishWizard
  };
})();
