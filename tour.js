/* tour.js — first-run guided tour (shown once per device) + "How to use" button in the Study hub. */
'use strict';
if (!window.__tourLoaded) (() => {
  window.__tourLoaded = 1;
  const { S, $, t, esc } = A;
  const ar = () => S.lang === 'ar';
  Object.assign(STR, {
    tour: { en: 'How to use', ar: 'شرح الاستخدام' },
    tourSub: { en: 'A quick tour of the app', ar: 'جولة سريعة تعرّفك على التطبيق' },
  });
  const STEPS = [
    { i: '🖐️', en: ['Rotate & zoom', 'Drag with one finger to rotate the body. Use two fingers to zoom in and to move it around. Double-tap an empty area to reset the view.'], ar: ['لف وقرّب', 'اسحب بصباع واحد عشان تلف المجسم. استخدم صباعين للتقريب والتحريك. دوس مرتين على مكان فاضي عشان ترجّع الوضع الأصلي.'] },
    { i: '👆', en: ['Tap any structure', 'Tap a bone, muscle, vessel or organ to see its name and information. Use "Isolate" to see it alone, or "Hide" to remove the layer in front of it.'], ar: ['دوس على أي عضو', 'دوس على عظمة أو عضلة أو وعاء أو عضو عشان تشوف اسمه ومعلوماته. استخدم «عزل» عشان تشوفه لوحده، أو «إخفاء» عشان تشيل الطبقة اللي قدامه.'] },
    { i: '🧅', en: ['Layers', 'The buttons at the top (Bones, Muscles, Vessels, Nerves…) have three states: tap once for a faded layer, again to hide it, and again to show it fully.'], ar: ['الطبقات', 'الأزرار اللي فوق (العظام، العضلات، الأوعية، الأعصاب…) ليها 3 حالات: دوسة تخلّيها شفافة، ودوسة تخفيها، ودوسة تظهرها كاملة.'] },
    { i: '🔍', en: ['Search', 'Type any name in the search box, in Arabic or English, and the model flies straight to it.'], ar: ['البحث', 'اكتب أي اسم في خانة البحث بالعربي أو الإنجليزي، والمجسم هيروح له على طول.'] },
    { i: '📚', en: ['Study & quizzes', 'The "Study" button has quizzes, flashcards, clinical cases, your notes, favourites, badges and your progress. You can reopen this tour from there any time.'], ar: ['المذاكرة والاختبارات', 'زرار «المذاكرة» فيه اختبارات وبطاقات وحالات سريرية وملاحظاتك والمفضلة والشارات وتقدمك. وتقدر تفتح الجولة دي تاني من هناك في أي وقت.'] },
  ];
  let step = 0, el = null;
  const draw = () => {
    const s = STEPS[step], last = step === STEPS.length - 1, rtl = ar();
    const [h, p] = rtl ? s.ar : s.en;
    el.innerHTML = `<div class="tour-card" role="dialog" aria-modal="true" dir="${rtl ? 'rtl' : 'ltr'}">
      <div class="tour-em">${s.i}</div><h2>${esc(h)}</h2><p>${esc(p)}</p>
      <div class="tour-dots">${STEPS.map((_, k) => `<i class="${k === step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tour-row"><button type="button" class="tour-skip" data-t="skip">${rtl ? 'تخطي' : 'Skip'}</button>
      <button type="button" class="tour-next" data-t="next">${last ? (rtl ? 'يلا نبدأ' : "Let's go") : (rtl ? 'التالي' : 'Next')}</button></div></div>`;
  };
  const finish = () => { if (el) { el.remove(); el = null; } try { Store.d.tourSeen = 1; Store.save(); } catch (e) { /* ignore */ } };
  function start() {
    if (el) return;
    step = 0; el = document.createElement('div'); el.className = 'tour'; document.body.appendChild(el); draw();
    el.addEventListener('click', (ev) => {
      const b = ev.target.closest('button[data-t]'); if (!b) return;
      if (b.dataset.t === 'skip') finish();
      else if (step >= STEPS.length - 1) finish(); else { step++; draw(); }
    });
  }
  A.startTour = () => { A.closeModal(); start(); };
  A.hubExtra = Object.assign(A.hubExtra || {}, { tour: () => A.startTour() });
  /* first run: wait until the loading screen is gone */
  const wait = setInterval(() => {
    const l = $('loading'); if (!l || !l.classList.contains('done')) return;
    clearInterval(wait);
    if (!Store.d.tourSeen) { const go = () => { if (window.__gateOn) return setTimeout(go, 600); setTimeout(start, 900); }; setTimeout(go, 400); }   // wait until the sign-in gate is closed
  }, 300);
})();
