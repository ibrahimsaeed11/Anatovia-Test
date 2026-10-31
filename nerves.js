/* nerves.js — peripheral nerve lesion map: pick a nerve → muscles that weaken, sensory loss area, typical sign; shown on the 3D model.
   Draft educational content from standard anatomy/neurology texts; review by a licensed physiotherapist/physician. Loaded by study.js. */
'use strict';
(function () {
  if (window.__nervesLoaded) return; window.__nervesLoaded = true;
  const R = (s) => new RegExp(s);
  /* [id, region, en, ar, roots, siteEn, siteAr, trunkRx, [muscleRx...], [cutaneousRx...], motorEN, motorAR, sensEN, sensAR] */
  const N = [
    ['axillary', 'ul', 'Axillary nerve', 'العصب الإبطي', 'C5–C6', 'Surgical neck of humerus fracture, shoulder dislocation', 'كسر عنق العضد الجراحي أو خلع الكتف',
      '^Axillary nerve', ['^Deltoid', '^Teres minor'], ['^Superior lateral brachial cutaneous'],
      'Weak abduction (≈15–90°) and external rotation; flattened shoulder contour from deltoid wasting.', 'ضعف تبعيد الذراع (من حوالي 15° لـ 90°) والتدوير الخارجي؛ وتسطّح شكل الكتف من ضمور الدالية.',
      'Loss over a patch on the lateral upper arm ("regimental badge" area).', 'فقدان إحساس في بقعة على جانب أعلى الذراع (منطقة «شارة الجندي»).'],
    ['musculocutaneous', 'ul', 'Musculocutaneous nerve', 'العصب العضلي الجلدي', 'C5–C7', 'Rare; anterior shoulder dislocation, humeral injuries', 'نادر؛ خلع الكتف الأمامي وإصابات العضد',
      '^Musculocutaneous nerve', ['^Biceps brachii', '^Brachialis', '^Coracobrachialis'], ['^Lateral antebrachial cutaneous'],
      'Weak elbow flexion (especially supinated) and supination; biceps reflex lost.', 'ضعف ثني المرفق (خصوصًا والساعد متسطّح) وضعف التسطيح؛ وفقدان منعكس ذات الرأسين.',
      'Loss on the lateral (radial) side of the forearm.', 'فقدان إحساس على الجانب الوحشي (الكعبري) من الساعد.'],
    ['radial_groove', 'ul', 'Radial nerve (humeral shaft / spiral groove)', 'العصب الكعبري (جسم العضد / الميزاب الحلزوني)', 'C5–T1', 'Mid-shaft humeral fracture; "Saturday-night palsy"', 'كسر منتصف عظمة العضد؛ شلل «ليلة السبت» (الضغط على الذراع)',
      '^Radial nerve', ['^Brachioradialis', '^Extensor carpi radialis', '^Extensor carpi ulnaris', '^Extensor digitorum$', '^Extensor digiti minimi', '^Extensor pollicis', '^Abductor pollicis longus', '^Extensor indicis', '^Supinator', '^Anconeus'], ['^Radial nerve – superficial', '^Radial nerve – dorsal digital', '^Posterior antebrachial cutaneous', '^Inferior lateral brachial cutaneous'],
      'Wrist drop and finger drop (cannot extend wrist/MCP joints); triceps is spared because its branches leave before the groove; grip is weak because the wrist cannot stabilise.', 'سقوط الرسغ والأصابع (مش قادر يفرد الرسغ ولا مفاصل الأصابع)؛ العضلة ثلاثية الرؤوس سليمة لأن فروعها بتنزل قبل الميزاب؛ والقبضة ضعيفة لأن الرسغ مش ثابت.',
      'Loss over the dorsum of the hand (lateral side, first web space) and posterior forearm.', 'فقدان إحساس على ضهر اليد (الجانب الوحشي ومنطقة بين الإبهام والسبابة) وخلف الساعد.'],
    ['radial_axilla', 'ul', 'Radial nerve (high / axilla)', 'العصب الكعبري (عالي / الإبط)', 'C5–T1', 'Crutch palsy, shoulder dislocation', 'ضغط العكاز أو خلع الكتف',
      '^Radial nerve', ['^Triceps brachii', '^Anconeus', '^Brachioradialis', '^Extensor carpi radialis', '^Extensor carpi ulnaris', '^Extensor digitorum$', '^Supinator', '^Extensor pollicis'], ['^Radial nerve – superficial', '^Posterior antebrachial cutaneous', '^Inferior lateral brachial cutaneous'],
      'Everything in the spiral-groove lesion plus triceps weakness (weak elbow extension, triceps reflex lost).', 'كل ضعف إصابة الميزاب الحلزوني، ويضاف عليه ضعف ثلاثية الرؤوس (ضعف فرد المرفق وفقدان منعكسها).',
      'Posterior arm and forearm, and the dorsum of the lateral hand.', 'خلف الذراع والساعد وضهر اليد من الجهة الوحشية.'],
    ['pin', 'ul', 'Posterior interosseous nerve (deep radial)', 'العصب بين العظمين الخلفي', 'C7–C8', 'Supinator (arcade of Frohse) entrapment, proximal radius fracture', 'انحباس عند عضلة التسطيح أو كسر رأس الكعبرة',
      '^(Posterior interosseous nerve|Radial nerve – deep)', ['^Extensor digitorum$', '^Extensor digiti minimi', '^Extensor carpi ulnaris', '^Extensor pollicis', '^Abductor pollicis longus', '^Extensor indicis', '^Supinator'], [],
      'Finger drop without wrist drop: the wrist still extends but deviates radially (ECRL spared).', 'سقوط الأصابع من غير سقوط الرسغ: الرسغ بيتفرد بس بيميل ناحية الكعبرة (الباسطة الكعبرية الطويلة سليمة).',
      'No sensory loss (purely motor nerve).', 'مفيش فقدان إحساس (عصب حركي بحت).'],
    ['median_wrist', 'ul', 'Median nerve (wrist / carpal tunnel)', 'العصب الأوسط (الرسغ / النفق الرسغي)', 'C6–T1', 'Carpal tunnel syndrome, wrist lacerations', 'متلازمة النفق الرسغي وجروح الرسغ',
      '^Median nerve', ['^Abductor pollicis brevis', '^Opponens pollicis', '^Flexor pollicis brevis', '^Lumbricals of hand'], ['^Median nerve – (proper|common) palmar digital'],
      'Thenar wasting ("ape hand"), weak thumb opposition and abduction (LOAF muscles: lumbricals 1–2, opponens, abductor pollicis brevis, flexor pollicis brevis).', 'ضمور عضلات الإبهام («يد القرد») وضعف التقابل وتبعيد الإبهام (عضلات LOAF: الدودية 1–2 والمقابلة والمبعدة القصيرة والثانية القصيرة).',
      'Palmar thumb, index, middle and lateral half of ring finger (plus their fingertips dorsally); the thenar skin is spared in carpal tunnel (palmar branch leaves before the tunnel).', 'راحة الإبهام والسبابة والوسطى ونص البنصر الوحشي (وأطرافها من ضهر اليد)؛ وجلد منطقة الإبهام بيفضل سليم في النفق الرسغي لأن الفرع الراحي بيخرج قبل النفق.'],
    ['median_elbow', 'ul', 'Median nerve (elbow / proximal forearm)', 'العصب الأوسط (المرفق / أعلى الساعد)', 'C6–T1', 'Supracondylar humeral fracture, pronator teres entrapment', 'كسر ما فوق لقيمة العضد أو انحباس عند الكابّة المستديرة',
      '^Median nerve', ['^Pronator teres', '^Flexor carpi radialis', '^Palmaris longus', '^Flexor digitorum superficialis', '^Flexor pollicis longus', '^Pronator quadratus', '^Abductor pollicis brevis', '^Opponens pollicis', '^Flexor pollicis brevis', '^Lumbricals of hand'], ['^Median nerve – (proper|common) palmar digital', '^Median nerve – palmar'],
      'All wrist-lesion deficits plus weak pronation and wrist flexion (ulnar deviation); trying to make a fist gives the "hand of benediction" (index and middle fingers stay straight).', 'كل ضعف إصابة الرسغ، ويضاف عليه ضعف الكبّ وثني الرسغ (بيميل زندي)؛ ولما يحاول يقفل إيده تظهر «يد البركة» (السبابة والوسطى بتفضل مفرودة).',
      'Palm (including the thenar eminence), palmar thumb, index, middle and lateral half of ring finger.', 'راحة اليد (بما فيها منطقة الإبهام) وراحة الإبهام والسبابة والوسطى ونص البنصر الوحشي.'],
    ['aint', 'ul', 'Anterior interosseous nerve', 'العصب بين العظمين الأمامي', 'C8–T1', 'Forearm fracture, Kiloh–Nevin syndrome', 'كسور الساعد أو متلازمة كيلوه-نيفن',
      '^(Anterior interosseous nerve|Median nerve)', ['^Flexor pollicis longus', '^Flexor digitorum profundus', '^Pronator quadratus'], [],
      'Cannot form an "OK" sign (pulp-to-pulp pinch lost: IP of thumb and DIP of index stay extended); weak pronation in flexion.', 'مش قادر يعمل علامة «OK» (القرصة بين أطراف الإبهام والسبابة بتضيع)؛ وضعف الكبّ.',
      'No sensory loss (purely motor branch).', 'مفيش فقدان إحساس (فرع حركي بحت).'],
    ['ulnar_elbow', 'ul', 'Ulnar nerve (elbow)', 'العصب الزندي (المرفق)', 'C8–T1', 'Medial epicondyle fracture, cubital tunnel syndrome', 'كسر اللقيمة الإنسية أو متلازمة النفق المرفقي',
      '^Ulnar nerve', ['^Flexor carpi ulnaris', '^Flexor digitorum profundus', '^Abductor digiti minimi of hand', '^Flexor digiti minimi brevis of hand', '^Opponens digiti minimi of hand', '^Adductor pollicis', '^Palmar interossei', '^Dorsal interossei of hand', '^Lumbricals of hand'], ['^Ulnar nerve – (dorsal|proper palmar|common palmar|palmar|superficial)'],
      'Weak finger abduction/adduction and grip; Froment sign (thumb IP flexes to hold paper); claw hand of ring and little fingers (less marked than at the wrist — "ulnar paradox" because FDP is also weak).', 'ضعف فتح وضم الأصابع والقبضة؛ علامة فرومنت (مفصل الإبهام بينثني وهو ماسك ورقة)؛ ويد مخلبية في البنصر والخنصر (أقل وضوحًا من إصابة الرسغ لأن FDP ضعيفة كمان).',
      'Medial 1½ fingers (little and medial half of ring), palmar and dorsal, and the ulnar border of the hand.', 'الخنصر ونص البنصر الإنسي (من الراحة والضهر) والحافة الزندية لليد.'],
    ['ulnar_wrist', 'ul', 'Ulnar nerve (wrist / Guyon canal)', 'العصب الزندي (الرسغ / قناة غيون)', 'C8–T1', 'Wrist lacerations, Guyon canal compression (cyclists)', 'جروح الرسغ أو ضغط قناة غيون (راكبي الدراجات)',
      '^Ulnar nerve', ['^Abductor digiti minimi of hand', '^Flexor digiti minimi brevis of hand', '^Opponens digiti minimi of hand', '^Adductor pollicis', '^Palmar interossei', '^Dorsal interossei of hand', '^Lumbricals of hand'], ['^Ulnar nerve – (proper palmar|common palmar|superficial)'],
      'Marked claw hand (ring and little fingers: MCP hyperextended, IPs flexed), hypothenar and interosseous wasting, Froment sign positive.', 'يد مخلبية واضحة (مفصل البنصر والخنصر المشطي منفرد والسلاميات مثنية)، وضمور عضلات الخنصر والبينية، وعلامة فرومنت إيجابية.',
      'Palmar side of the little finger and medial ring finger; the dorsal ulnar hand is spared (dorsal branch leaves before the wrist).', 'راحة الخنصر والبنصر الإنسي؛ وضهر اليد الزندي سليم لأن الفرع الظهري بيخرج قبل الرسغ.'],
    ['long_thoracic', 'ul', 'Long thoracic nerve', 'العصب الصدري الطويل', 'C5–C7', 'Mastectomy / axillary surgery, backpack palsy', 'جراحات الثدي والإبط أو ضغط الشنطة',
      '^Long thoracic nerve', ['^Serratus anterior'], [],
      'Winged scapula (medial border lifts off the chest wall when pushing against a wall); cannot raise the arm above ~90°.', 'لوح مجنّح (الحافة الإنسية تطلع من الصدر لما يدفع حيطة)؛ ومش قادر يرفع الذراع فوق حوالي 90°.',
      'No sensory loss (purely motor).', 'مفيش فقدان إحساس (حركي بحت).'],
    ['suprascapular', 'ul', 'Suprascapular nerve', 'العصب فوق اللوح', 'C5–C6', 'Suprascapular notch entrapment, overhead athletes', 'انحباس عند الثلمة فوق اللوح أو رياضيي الرمي',
      '^Suprascapular nerve', ['^Supraspinatus', '^Infraspinatus'], [],
      'Weak initiation of abduction and weak external rotation; wasting of the supra/infraspinous fossae.', 'ضعف بداية التبعيد وضعف التدوير الخارجي؛ وضمور في الحفرتين فوق وتحت الشوكة.',
      'No true cutaneous area (deep shoulder pain only).', 'مفيش منطقة جلدية (ألم عميق في الكتف بس).'],
    ['accessory', 'ul', 'Accessory nerve (XI)', 'العصب الإضافي (XI)', 'CN XI (C3–C4)', 'Posterior triangle neck surgery / lymph-node biopsy', 'جراحات المثلث الخلفي للرقبة أو أخذ عينة غدة',
      '^Accessory nerve', ['^Trapezius', '^Sternocleidomastoid'], [],
      'Drooping shoulder, weak shrug and arm abduction above 90°, mild scapular winging; weak head rotation to the opposite side.', 'كتف واقع، وضعف رفع الكتف وتبعيد الذراع فوق 90°، وتجنّح خفيف للوح؛ وضعف لف الرأس للجهة المقابلة.',
      'No sensory loss (motor only).', 'مفيش فقدان إحساس (حركي بس).'],
    ['femoral', 'll', 'Femoral nerve', 'العصب الفخذي', 'L2–L4', 'Pelvic fracture, hip surgery, retroperitoneal haematoma', 'كسر الحوض أو جراحات الورك أو نزيف خلف البريتوان',
      '^Femoral nerve', ['^Iliacus', '^Psoas major', '^Pectineus', '^Sartorius', '^Rectus femoris', '^Vastus'], ['^Femoral nerve – anterior cutaneous', '^Saphenous nerve'],
      'Weak knee extension (knee gives way, difficulty on stairs) and hip flexion; quadriceps wasting; patellar reflex lost.', 'ضعف فرد الركبة (الركبة بتخون ويتعب في السلم) وثني الورك؛ وضمور الفخذية الرباعية؛ وفقدان منعكس الرضفة.',
      'Anterior thigh and medial leg/foot (saphenous branch).', 'مقدمة الفخذ والجانب الإنسي من الساق والقدم (فرع الصافن).'],
    ['obturator', 'll', 'Obturator nerve', 'العصب السدادي', 'L2–L4', 'Pelvic surgery, obturator hernia, pelvic fracture', 'جراحات الحوض أو فتق سدادي أو كسر الحوض',
      '^Obturator nerve', ['^Adductor longus', '^Adductor brevis', '^Adductor magnus', '^Gracilis', '^Obturator externus', '^Pectineus'], ['^Obturator nerve'],
      'Weak hip adduction; the leg tends to swing outward (circumducting gait).', 'ضعف تقريب الورك؛ والرجل بتميل لبرا (مشية دائرية).',
      'Small patch on the medial thigh.', 'بقعة صغيرة على الجانب الإنسي من الفخذ.'],
    ['sup_gluteal', 'll', 'Superior gluteal nerve', 'العصب الأليوي العلوي', 'L4–S1', 'Misplaced gluteal injection, hip surgery', 'حقنة غلط في الإلية أو جراحات الورك',
      '^Superior gluteal nerve', ['^Gluteus medius', '^Gluteus minimus', '^Tensor fasciae latae'], [],
      'Trendelenburg sign: standing on the affected leg, the pelvis drops on the opposite side (waddling gait if bilateral).', 'علامة ترندلنبرج: لما يقف على الرجل المصابة الحوض بينزل في الجهة التانية (مشية متمايلة لو الاتنين).',
      'No sensory loss (motor only).', 'مفيش فقدان إحساس (حركي بس).'],
    ['sciatic', 'll', 'Sciatic nerve', 'العصب الوركي', 'L4–S3', 'Posterior hip dislocation, acetabular fracture, injection injury', 'خلع الورك الخلفي أو كسر الحُق أو إصابة حقنة',
      '^(Sciatic nerve|Tibial nerve|Common fibular)', ['^Semitendinosus', '^Semimembranosus', '^Biceps femoris', '^Adductor magnus', '^Tibialis', '^Extensor digitorum longus', '^Extensor hallucis longus', '^Fibularis', '^Gastrocnemius', '^Soleus', '^Plantaris', '^Popliteus', '^Flexor digitorum longus', '^Flexor hallucis longus'], ['^(Superficial fibular|Deep fibular|Sural|Medial plantar|Lateral plantar)'],
      'Weak knee flexion (hamstrings) and loss of all movement below the knee: foot drop plus no plantarflexion; ankle reflex lost.', 'ضعف ثني الركبة (الخلفية) وفقدان كل حركات تحت الركبة: سقوط القدم وعدم تحريك القدم لتحت؛ وفقدان منعكس الكاحل.',
      'Whole leg and foot except the medial side (saphenous nerve is from the femoral).', 'الساق والقدم كلها ما عدا الجانب الإنسي (الصافن من الفخذي).'],
    ['common_fibular', 'll', 'Common fibular (peroneal) nerve', 'العصب الشظوي المشترك', 'L4–S2', 'Fibular-neck fracture, tight cast, crossing legs', 'كسر عنق الشظية أو جبس ضيق أو تربيع الرجلين',
      '^(Common fibular|Deep fibular nerve$|Superficial fibular nerve$)', ['^Tibialis anterior', '^Extensor digitorum longus', '^Extensor hallucis longus', '^Fibularis', '^Extensor digitorum brevis'], ['^(Superficial fibular|Deep fibular – dorsal|Medial dorsal cutaneous|Intermediate dorsal cutaneous|Sural communicating)'],
      'Foot drop (cannot dorsiflex or evert), steppage gait with high-knee lifting.', 'سقوط القدم (مش قادر يثني القدم لفوق ولا يقلبها لبرا) ومشية عالية بيرفع فيها ركبته.',
      'Lateral leg and dorsum of the foot; web space between the 1st and 2nd toes (deep fibular).', 'الجانب الوحشي من الساق وضهر القدم؛ والمسافة بين الإبهام والتانية (الشظوي العميق).'],
    ['tibial', 'll', 'Tibial nerve', 'العصب الظنبوبي', 'L4–S3', 'Popliteal injury, tarsal tunnel syndrome', 'إصابة المأبض أو متلازمة النفق الرصغي',
      '^(Tibial nerve|Medial plantar nerve|Lateral plantar nerve)', ['^Gastrocnemius', '^Soleus', '^Plantaris', '^Popliteus', '^Tibialis posterior', '^Flexor digitorum longus', '^Flexor hallucis longus', '^Flexor digitorum brevis', '^Abductor hallucis', '^Flexor hallucis brevis', '^Flexor accessorius', '^Lumbricals of foot'], ['^(Medial plantar|Lateral plantar|Sural nerve|Medial sural)'],
      'Cannot plantarflex or invert, cannot stand on tiptoe; toes cannot flex (claw toes); ankle reflex lost.', 'مش قادر يثني القدم لتحت ولا يقلبها لجوه ولا يقف على أطراف صوابعه؛ والصوابع مش بتتثني (صوابع مخلبية)؛ وفقدان منعكس الكاحل.',
      'Sole of the foot and heel (and the lateral foot via the sural nerve).', 'باطن القدم والكعب (والجانب الوحشي للقدم عن طريق العصب الربلي).'],
    ['facial', 'hd', 'Facial nerve (VII)', 'العصب الوجهي (VII)', 'CN VII', 'Bell\'s palsy, parotid surgery, temporal bone fracture', 'شلل بيل أو جراحة النكفية أو كسر العظم الصدغي',
      '^(Facial nerve|Chorda tympani)', ['^Orbicularis oculi', '^Frontalis', '^Corrugator', '^Orbicularis oris', '^Zygomaticus', '^Buccinator', '^Risorius', '^Depressor anguli oris', '^Mentalis', '^Platysma', '^Occipitalis'], [],
      'Lower-motor-neuron lesion: whole half of the face droops, forehead cannot wrinkle, eye cannot close, mouth deviates to the healthy side (an upper-motor-neuron lesion spares the forehead).', 'إصابة العصب الحركي السفلي: نص الوجه كله بيقع والجبهة مش بتتجعد والعين مش بتتقفل والفم بيميل للجهة السليمة (إصابة العصب العلوي بتسيب الجبهة سليمة).',
      'Loss of taste on the anterior two-thirds of the tongue (chorda tympani); no facial skin sensory loss (that is the trigeminal nerve).', 'فقدان التذوق في ثلثي اللسان الأماميين (الحبل الطبلي)؛ مفيش فقدان إحساس جلد الوجه (ده للتوأمي).'],
  ];
  const REG = { ul: ['Upper limb & neck', 'الطرف العلوي والرقبة'], ll: ['Lower limb', 'الطرف السفلي'], hd: ['Face', 'الوجه'] };
  const NERVES = N.map((a) => ({ id: a[0], reg: a[1], en: a[2], ar: a[3], roots: a[4], siteEn: a[5], siteAr: a[6], trunk: R(a[7]), mus: a[8].map(R), cut: a[9].map(R), mEn: a[10], mAr: a[11], sEn: a[12], sAr: a[13] }));
  window.NERVE_MAP = NERVES;

  /* ───────────── UI ───────────── */
  const { S, P, esc, name1 } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const sideOK = (e) => e.side !== 'l';
  const uniq = (arr) => { const s = new Set(); return arr.filter((e) => (s.has(e.baseEn) ? false : (s.add(e.baseEn), true))); };
  const pick = (sys, rxs) => rxs.flatMap((rx) => P.filter((e) => e.sys === sys && sideOK(e) && rx.test(e.baseEn)));
  const parts = (n) => ({ trunk: pick('nerve', [n.trunk]), mus: uniq(pick('muscle', n.mus)), cut: pick('nerve', n.cut) });
  function list() {
    A.modal(() => {
      let h = `<h2>🗺️ ${T('Peripheral nerve map', 'خريطة الأعصاب المحيطية')}</h2><p class="lead">${T('Pick a nerve to see what weakens and where sensation is lost if it is cut', 'اختار عصب وشوف إيه اللي يضعف ومكان فقدان الإحساس لو اتقطع')}</p>`;
      for (const g of Object.keys(REG)) h += `<div class="mgroup">${esc(T(...REG[g]))}</div><div class="row">` + NERVES.filter((n) => n.reg === g).map((n) => `<button class="opt" data-act="nopen" data-id="${n.id}">${!A.isPremium() && n.id !== A.FREE_NERVE ? '🔒 ' : ''}${esc(T(n.en, n.ar))}</button>`).join('') + '</div>';
      return h + `<p class="tiny">${T('Draft educational content – confirm with your supervisor / current textbooks.', 'محتوى تعليمي مبدئي — راجعه مع المشرف أو المراجع الحديثة.')}</p>`;
    });
  }
  A.acts.nopen = (el) => {
    const n = NERVES.find((x) => x.id === el.dataset.id); if (!n) return;
    if (!A.isPremium() && n.id !== A.FREE_NERVE) return A.paywall('The full nerve map is part of Premium. Free sample: the median nerve at the wrist.', 'خريطة الأعصاب كاملة ضمن النسخة المميزة. العينة المجانية: العصب الأوسط عند الرسغ.');
    const pt = parts(n);
    A.modal(() => `<h2>⚡ ${esc(T(n.en, n.ar))}</h2><p class="lead">${esc(n.roots)} · ${T('Injury', 'سبب الإصابة')}: ${esc(T(n.siteEn, n.siteAr))}</p>` +
      `<h4>💪 ${T('If cut — muscles that weaken', 'لو اتقطع — العضلات اللي تضعف')}</h4>` +
      (pt.mus.length ? `<div class="pills">${pt.mus.map((e) => `<span class="pill2" data-act="goto" data-i="${e.i}">${esc(name1(e))}</span>`).join('')}</div>` : `<p class="tiny">${T('No muscle in the model.', 'مفيش عضلات في المجسم.')}</p>`) +
      `<div class="tpos"><b>${T('What you see', 'اللي بيظهر')}</b><div>${esc(T(n.mEn, n.mAr))}</div></div>` +
      `<h4>🖐️ ${T('Sensory loss', 'فقدان الإحساس')}</h4><div class="tpos" style="background:rgba(255,80,200,.1);border-color:rgba(255,80,200,.4)"><div>${esc(T(n.sEn, n.sAr))}</div></div>` +
      `<p class="tiny">🟦 ${T('Nerve', 'العصب')} · 🟨 ${T('weak muscles', 'عضلات ضعيفة')} · 🟪 ${T('sensory branches', 'فروع الإحساس')}</p>` +
      `<button type="button" class="btn primary wide" data-act="nshow" data-id="${n.id}">🔍 ${T('Show on the 3D model', 'اعرضه على المجسم')}</button>` +
      `<button type="button" class="btn wide" style="margin-top:8px" data-act="nlist">‹ ${T('Back', 'رجوع')}</button>`);
  };
  A.acts.nlist = list;
  A.acts.nshow = async (el) => {
    const n = NERVES.find((x) => x.id === el.dataset.id); if (!n) return;
    if (!A.isPremium()) return A.paywall('Showing the nerve and its muscles on the 3D model is part of Premium.', 'عرض العصب وعضلاته على المجسم ضمن النسخة المميزة.');
    const pt = parts(n); A.closeModal(); S.sel = -1; A.deselect();
    const need = new Set(['nerve', pt.mus.length ? 'muscle' : null].filter(Boolean));
    for (const s of SYSTEMS) S.layers[s] = need.has(s) ? 'on' : (s === 'bone' ? 'ghost' : 'off');
    for (const s of need) await A.ensure(s); await A.ensure('bone');
    S.region = null; S.iso = -1; S.moveSet = null;
    const hl = new Map();
    pt.trunk.forEach((e) => hl.set(e.i, [0.2, 0.85, 1, 0.9])); pt.mus.forEach((e) => hl.set(e.i, [1, 0.78, 0.18, 0.8])); pt.cut.forEach((e) => hl.set(e.i, [1, 0.25, 0.85, 0.9]));
    S.hl = hl; S.focus = new Set(hl.keys()); A.apply();
    const first = pt.trunk[0] || pt.mus[0]; if (first) A.flyToPart(first);
    if (A.toast) A.toast('⚡ ' + T(n.en, n.ar));
  };
  A.hubExtra = A.hubExtra || {}; A.hubExtra.nmap = list;
})();
