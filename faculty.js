/* faculty.js — universities + faculties list, and the one-time "choose your university & faculty" screen.
   The choice is saved ONCE on the account (users/{uid}.uni / .fac / .facAt) and then locked by firestore.rules; only an admin can change it.
   The same data file is read by admin.html (there `A` does not exist, so only the data part runs). */
'use strict';
(() => {
  /* code|Arabic|English  — codes are permanent; names may change later */
  const G = {
    gov: ['cairo|القاهرة|Cairo University', 'alex|الإسكندرية|Alexandria University', 'asu|عين شمس|Ain Shams University', 'asyut|أسيوط|Assiut University', 'tanta|طنطا|Tanta University', 'mansoura|المنصورة|Mansoura University', 'zagazig|الزقازيق|Zagazig University', 'capital|العاصمة (حلوان سابقًا)|Capital University (formerly Helwan)', 'minia|المنيا|Minia University', 'menofia|المنوفية|Menoufia University', 'suezcanal|قناة السويس|Suez Canal University', 'qena|قنا|Qena University', 'bsu|بني سويف|Beni-Suef University', 'fayoum|الفيوم|Fayoum University', 'benha|بنها|Benha University', 'kfs|كفر الشيخ|Kafrelsheikh University', 'sohag|سوهاج|Sohag University', 'portsaid|بورسعيد|Port Said University', 'damanhour|دمنهور|Damanhour University', 'aswan|أسوان|Aswan University', 'damietta|دمياط|Damietta University', 'suez|السويس|Suez University', 'sadat|مدينة السادات|Sadat City University', 'arish|العريش|Arish University', 'newvalley|الوادي الجديد|New Valley University', 'matrouh|مطروح|Matrouh University', 'luxor|الأقصر|Luxor University', 'hurghada|الغردقة|Hurghada University', 'azhar|الأزهر|Al-Azhar University'],
    prv: ['oct6|6 أكتوبر|October 6 University', 'msa|أكتوبر للعلوم الحديثة والآداب (MSA)|MSA University', 'must|مصر للعلوم والتكنولوجيا (MUST)|MUST University', 'miu|مصر الدولية (MIU)|MIU University', 'guc|الألمانية بالقاهرة|German University in Cairo', 'acu|الأهرام الكندية|Ahram Canadian University', 'bue|البريطانية في مصر|British University in Egypt', 'mti|الحديثة للتكنولوجيا والمعلومات|Modern University for Technology & Information', 'sinai|سيناء|Sinai University', 'pharos|فاروس|Pharos University', 'nahda|النهضة|Nahda University', 'future|المستقبل|Future University', 'rus|المصرية الروسية|Russian University in Egypt', 'delta|الدلتا للعلوم والتكنولوجيا|Delta University for Science & Technology', 'heliopolis|هليوبوليس|Heliopolis University', 'newgiza|الجيزة الجديدة|New Giza University', 'deraya|دراية|Deraya University', 'badr|بدر بالقاهرة|Badr University in Cairo', 'horus|حورس|Horus University', 'chinese|المصرية الصينية|Egyptian Chinese University', 'merit|ميريت|Merit University', 'sphinx|سفنكس|Sphinx University', 'salam|السلام|Salam University', 'badrasy|بدر بأسيوط|Badr University in Assiut', 'salhia|الصالحية الجديدة|New Salhia University', 'hayah|الحياة|Hayah University', 'may|مايو|May University', 'riyada|الريادة|Al-Riyada University', 'ibtikar|الابتكار|Innovation University', 'madina|المدينة بالقاهرة|Al-Madina University', 'rashid|رشيد|Rashid University', 'badya|باديا|Badya University', 'nilevalley|وادي النيل بالفيوم|Nile Valley University', 'lotus|اللوتس|Lotus University', 'obour|العبور|Obour University', 'memphis|ممفيس|Memphis University', 'eastcap|شرق العاصمة|East Capital University'],
    ahl: ['kso|الملك سلمان الدولية|King Salman International University', 'alamein|العلمين الدولية|Alamein International University', 'galala|الجلالة|Galala University', 'newmansoura|المنصورة الجديدة|New Mansoura University', 'elearn|المصرية للتعلم الإلكتروني الأهلية|Egyptian E-Learning University', 'nile|النيل الأهلية|Nile University', 'french|الفرنسية الأهلية في مصر|French University in Egypt', 'infor|مصر للمعلوماتية|Egypt University of Informatics', 'a_capital|حلوان الأهلية|Helwan National University', 'a_mansoura|المنصورة الأهلية|Mansoura National University', 'a_benha|بنها الأهلية|Benha National University', 'a_menofia|المنوفية الأهلية|Menoufia National University', 'a_bsu|بني سويف الأهلية|Beni-Suef National University', 'a_asyut|أسيوط الأهلية|Assiut National University', 'a_svu|جنوب الوادي الأهلية|South Valley National University', 'a_minia|المنيا الأهلية|Minia National University', 'a_eastps|شرق بورسعيد الأهلية|East Port Said National University', 'a_alex|الإسكندرية الأهلية|Alexandria National University', 'a_zagazig|الزقازيق الأهلية|Zagazig National University', 'a_newism|الإسماعيلية الجديدة الأهلية|New Ismailia National University', 'a_suez|السويس الأهلية|Suez National University', 'a_damanhour|دمنهور الأهلية|Damanhour National University', 'a_cairo|القاهرة الأهلية|Cairo National University', 'a_asu|عين شمس الأهلية|Ain Shams National University', 'a_sohag|سوهاج الأهلية|Sohag National University', 'a_kfs|كفر الشيخ الأهلية|Kafrelsheikh National University', 'a_newvalley|الوادي الجديد الأهلية|New Valley National University', 'a_fayoum|الفيوم الأهلية|Fayoum National University', 'a_tanta|طنطا الأهلية|Tanta National University', 'a_luxor|الأقصر الأهلية|Luxor National University', 'a_damietta|دمياط الأهلية|Damietta National University', 'a_sadat|مدينة السادات الأهلية|Sadat City National University'],
    intl: ['auc|الجامعة الأمريكية بالقاهرة (AUC)|American University in Cairo', 'zewail|زويل للعلوم والتكنولوجيا|Zewail City', 'ejust|المصرية اليابانية (E-JUST)|Egypt-Japan University (E-JUST)', 'giu|الألمانية الدولية (GIU)|German International University', 'berlin|برلين الألمانية بالجونة|Berlin University in El Gouna', 'senghor|سنجور بالإسكندرية|Senghor University', 'eslsca|إسلسكا|ESLSCA University', 'aou|العربية المفتوحة|Arab Open University', 'aast|الأكاديمية العربية للعلوم والتكنولوجيا|AASTMT'],
  };
  const GN = { gov: ['حكومية', 'Public'], prv: ['خاصة', 'Private'], ahl: ['أهلية', 'National (Ahlia)'], intl: ['دولية واتفاقيات خاصة', 'International & special'] };
  const FAC = ['pt|العلاج الطبيعي|Physical Therapy', 'med|الطب البشري|Medicine', 'dent|طب الأسنان|Dentistry', 'nurs|التمريض|Nursing', 'vet|الطب البيطري|Veterinary Medicine', 'ahs|العلوم الطبية التطبيقية / الصحية|Applied Health Sciences', 'pe|التربية الرياضية|Physical Education', 'pharm|الصيدلة|Pharmacy', 'other|كلية أخرى|Other faculty'];
  const UNIS = {}, UL = [];
  Object.keys(G).forEach((g) => G[g].forEach((s) => { const p = s.split('|'); UNIS[p[0]] = { c: p[0], ar: p[1], en: p[2], g }; UL.push(UNIS[p[0]]); }));
  const FACS = {}; FAC.forEach((s) => { const p = s.split('|'); FACS[p[0]] = { c: p[0], ar: p[1], en: p[2] }; });
  window.ANAT_UNIS = UNIS; window.ANAT_FACS = FACS; window.ANAT_UGROUPS = G; window.ANAT_GN = GN;

  if (typeof A === 'undefined' || window.__facLoaded) return;   // admin.html: data only
  window.__facLoaded = 1;
  const { S, esc } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  A.uniName = (c) => { const u = UNIS[c]; return u ? (ar() ? u.ar : u.en) : (c || ''); };
  A.facName = (c) => { const f = FACS[c]; return f ? (ar() ? f.ar : f.en) : (c || ''); };
  A.facLabel = (u, f) => A.facName(f) + ' — ' + A.uniName(u);

  let err = '', busy = false;
  function render() {
    const opts = Object.keys(G).map((g) => `<optgroup label="${esc(ar() ? GN[g][0] : GN[g][1])}">` + G[g].map((s) => { const u = UNIS[s.split('|')[0]]; return `<option value="${u.c}">${esc(ar() ? u.ar : u.en)}</option>`; }).join('') + '</optgroup>').join('');
    return `<h2>🎓 ${T('Your university & faculty', 'جامعتك وكليتك')}</h2>` +
      `<p class="lead">${T('Choose once — it is used for the faculty competition and it cannot be changed later (contact us if you chose wrong).', 'اختار مرة واحدة — بتتستخدم في منافسة الكليات ومش هتقدر تغيّرها بعد كده (كلمنا لو اخترت غلط).')}</p>` +
      `<div class="acc-form"><select id="fcU"><option value="">${T('— University —', '— الجامعة —')}</option>${opts}<option value="other">${T('Other / not listed', 'أخرى / مش موجودة')}</option></select>` +
      `<select id="fcF"><option value="">${T('— Faculty —', '— الكلية —')}</option>${FAC.map((s) => { const f = FACS[s.split('|')[0]]; return `<option value="${f.c}">${esc(ar() ? f.ar : f.en)}</option>`; }).join('')}</select>` +
      (err ? `<div class="acc-msg bad">${esc(err)}</div>` : '') +
      `<button class="btn primary wide" data-act="fcsave" ${busy ? 'disabled' : ''}>${T('Confirm', 'تأكيد')}</button><button class="acc-link" data-act="fclater">${T('Later', 'بعدين')}</button></div>`;
  }
  A.facPrompt = () => { err = ''; busy = false; A.modal(render); };
  A.acts.fclater = () => A.closeModal();
  A.acts.fcsave = async () => {
    const u = (document.getElementById('fcU') || {}).value, f = (document.getElementById('fcF') || {}).value;
    if (!u || !f) { err = T('Choose your university and faculty.', 'اختار الجامعة والكلية.'); return A.modal(render); }
    const nm = (u === 'other' ? T('Other', 'أخرى') : A.uniName(u)) + ' — ' + A.facName(f);
    if (!confirm(T('Save "' + nm + '"?\nYou will NOT be able to change it later.', 'تحفظ «' + nm + '»؟\nمش هتقدر تغيّرها بعد كده.'))) return;
    busy = true; err = ''; A.modal(render);
    try { await A.setFac(u, f); A.closeModal(); A.toast(T('Saved ✔', 'تم الحفظ ✔')); }
    catch (e) { busy = false; err = T('Could not save — check your connection.', 'تعذّر الحفظ — اتأكد من الإنترنت.'); A.modal(render); }
  };
})();
