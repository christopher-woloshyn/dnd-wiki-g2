import { campaignSessions } from '/js/sessionData.js';

function initSessionNavigation() {
  // 1. Get current filename (e.g. "arc1-01.html")
  const path = window.location.pathname.toLowerCase();
  const currentFilename = path.substring(path.lastIndexOf('/') + 1);

  // 2. Locate index
  const currentIndex = campaignSessions.findIndex(s => {
    const sessionPath = s.file.toLowerCase();
    return sessionPath === path || sessionPath.endsWith('/' + currentFilename) || sessionPath.endsWith(currentFilename);
  });

  const prevSession = currentIndex > 0 ? campaignSessions[currentIndex - 1] : null;
  const nextSession = (currentIndex !== -1 && currentIndex < campaignSessions.length - 1) 
    ? campaignSessions[currentIndex + 1] 
    : null;

  // 3. Populate Dropdowns
  const allSelects = document.querySelectorAll('.session-select');
  allSelects.forEach(select => {
    select.innerHTML = '';

    if (currentIndex === -1) {
      const defaultOpt = document.createElement('option');
      defaultOpt.textContent = "— Select Session —";
      defaultOpt.disabled = true;
      defaultOpt.selected = true;
      select.appendChild(defaultOpt);
    }

    campaignSessions.forEach((session, idx) => {
      const option = document.createElement('option');
      option.value = session.file;
      option.textContent = session.title;
      if (idx === currentIndex) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.onchange = (e) => {
      window.location.href = e.target.value;
    };
  });

  // 4. Configure Previous Buttons
  const allPrevBtns = document.querySelectorAll('.prev-session');
  allPrevBtns.forEach(btn => {
    if (prevSession) {
      btn.href = prevSession.file;
      btn.style.visibility = 'visible';
    } else {
      btn.style.visibility = 'hidden';
    }
  });

  // 5. Configure Next Buttons
  const allNextBtns = document.querySelectorAll('.next-session');
  allNextBtns.forEach(btn => {
    if (nextSession) {
      btn.href = nextSession.file;
      btn.style.visibility = 'visible';
    } else {
      btn.style.visibility = 'hidden';
    }
  });

  // 6. Keyboard Navigation
  document.onkeydown = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft' && prevSession) {
      window.location.href = prevSession.file;
    } else if (e.key === 'ArrowRight' && nextSession) {
      window.location.href = nextSession.file;
    }
  };
}

// Synchronized Accordion Animation
function initSmoothAccordions() {
  document.querySelectorAll('.arc-details').forEach((el) => {
    const summary = el.querySelector('summary');
    const content = el.querySelector('.session-list');
    if (!summary || !content) return;

    let animation = null;
    let isClosing = false;
    let isExpanding = false;

    if (el.open) el.classList.add('is-open');

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      el.style.overflow = 'hidden';

      const computed = window.getComputedStyle(el);
      const verticalPaddingBorder = 
        parseFloat(computed.paddingTop) + 
        parseFloat(computed.paddingBottom) + 
        parseFloat(computed.borderTopWidth) + 
        parseFloat(computed.borderBottomWidth);
      const closedHeight = `${summary.offsetHeight + verticalPaddingBorder}px`;

      if (isClosing || !el.open) {
        isExpanding = true;
        isClosing = false;
        el.classList.add('is-open');
        
        const startHeight = `${el.offsetHeight}px`;
        el.open = true;
        el.style.height = 'auto';
        const endHeight = `${el.offsetHeight}px`;
        el.style.height = startHeight;

        if (animation) animation.cancel();
        animation = el.animate(
          { height: [startHeight, endHeight] },
          { duration: 320, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
        );

        animation.onfinish = () => {
          el.style.height = '';
          el.style.overflow = '';
          isExpanding = false;
          animation = null;
        };
      } else if (isExpanding || el.open) {
        isClosing = true;
        isExpanding = false;
        el.classList.remove('is-open');

        const startHeight = `${el.offsetHeight}px`;
        const endHeight = closedHeight;

        if (animation) animation.cancel();
        animation = el.animate(
          { height: [startHeight, endHeight] },
          { duration: 280, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
        );

        animation.onfinish = () => {
          el.open = false;
          el.style.height = '';
          el.style.overflow = '';
          isClosing = false;
          animation = null;
        };
      }
    });
  });
}

// Menu Active Session Highlight
document.addEventListener("menuLoaded", () => {
  const currentFilename = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1).toLowerCase();
  
  document.querySelectorAll('.session-link').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href.endsWith(currentFilename)) {
      link.classList.add('current-page');
      const parentGroup = link.closest('.arc-group');
      if (parentGroup) parentGroup.classList.add('open');
    }
  });
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSessionNavigation();
    initSmoothAccordions();
  });
} else {
  initSessionNavigation();
  initSmoothAccordions();
}