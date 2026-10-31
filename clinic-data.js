/* clinic-data.js — assessment (ROM / MMT / special tests) and exercise data.
   DRAFT educational content compiled from standard textbook values (AAOS / Norkin & White ROM, Kendall/Oxford MMT, common orthopaedic tests).
   Values vary between sources and individuals; every entry must be reviewed by a licensed physiotherapist before clinical use. */
'use strict';

/* MMT scale (Oxford / Kendall) */
window.MMT_SCALE = [
  ['5', 'Normal', 'طبيعية', 'Full ROM against gravity with maximal resistance.', 'مدى حركة كامل ضد الجاذبية مع مقاومة قصوى.'],
  ['4', 'Good', 'جيدة', 'Full ROM against gravity with moderate resistance.', 'مدى كامل ضد الجاذبية مع مقاومة متوسطة.'],
  ['3', 'Fair', 'مقبولة', 'Full ROM against gravity only, no added resistance.', 'مدى كامل ضد الجاذبية فقط بدون مقاومة.'],
  ['2', 'Poor', 'ضعيفة', 'Full ROM with gravity eliminated.', 'مدى كامل مع إلغاء الجاذبية.'],
  ['1', 'Trace', 'أثر', 'Visible or palpable contraction, no movement.', 'انقباض ملموس أو مرئي بدون حركة.'],
  ['0', 'Zero', 'صفر', 'No contraction.', 'لا يوجد انقباض.'],
];

/* Joints: rom = [en, ar, normal]; mmt = [movement en, ar, muscles en, ar, root, muscleRegex]; tests = [en, ar, tests en, ar, positive en, ar, ref?]
   ref = ['ligament'|'bone'|'muscle', regex on base name] -> "show in 3D" link */
window.JOINTS = [
  {
    id: 'shoulder', en: 'Shoulder', ar: 'الكتف', reg: 'upper', bones: /^(Scapula|Clavicle|Humerus)/i,
    rom: [['Flexion', 'ثني (أمام)', '0–180°'], ['Extension', 'بسط (خلف)', '0–60°'], ['Abduction', 'تبعيد', '0–180°'], ['Adduction', 'تقريب', '0–50°'], ['External rotation', 'تدوير خارجي', '0–90°'], ['Internal rotation', 'تدوير داخلي', '0–70°']],
    mmt: [
      ['Flexion', 'ثني', 'Anterior deltoid, coracobrachialis', 'الدالية الأمامية، الغرابية العضدية', 'C5–C6', /^(Deltoid \(Clavicular|Coracobrachialis)/],
      ['Extension', 'بسط', 'Latissimus dorsi, teres major', 'العريضة الظهرية، المدورة الكبرى', 'C6–C8', /^(Latissimus|Teres major)/],
      ['Abduction', 'تبعيد', 'Deltoid (middle), supraspinatus', 'الدالية (الوسطى)، فوق الشوكة', 'C5–C6', /^(Deltoid \(Acromial|Supraspinatus)/],
      ['External rotation', 'تدوير خارجي', 'Infraspinatus, teres minor', 'تحت الشوكة، المدورة الصغرى', 'C5–C6', /^(Infraspinatus|Teres minor)/],
      ['Internal rotation', 'تدوير داخلي', 'Subscapularis, pectoralis major', 'تحت الكتف، الصدرية الكبرى', 'C5–C7', /^(Subscapularis|Pectoralis major)/],
      ['Scapular protraction', 'دفع الكتف للأمام', 'Serratus anterior', 'المنشارية الأمامية', 'C5–C7', /^Serratus anterior/],
      ['Scapular retraction', 'سحب الكتف للخلف', 'Rhomboids, middle trapezius', 'المعينيتان، شبه المنحرفة الوسطى', 'C4–C5 / CN XI', /^(Rhomboid|Trapezius \(Transverse)/],
    ],
    tests: [
      ['Neer impingement', 'اختبار نير للاحتكاك', 'Subacromial impingement', 'احتكاك تحت الأخرم', 'Pain when the arm is passively flexed overhead.', 'ألم عند رفع الذراع للأعلى بشكل سلبي.', ['ligament', /Coraco-acromial/]],
      ['Hawkins–Kennedy', 'هوكنز–كينيدي', 'Subacromial impingement', 'احتكاك تحت الأخرم', 'Pain on passive internal rotation with 90° flexion.', 'ألم عند التدوير الداخلي السلبي مع ثني 90°.'],
      ['Empty can (Jobe)', 'اختبار الكوب الفارغ', 'Supraspinatus tear / tendinopathy', 'تمزق أو التهاب فوق الشوكة', 'Pain or weakness resisting elevation in scaption with thumbs down.', 'ألم أو ضعف عند مقاومة رفع الذراع والإبهام للأسفل.', ['muscle', /^Supraspinatus/]],
      ['Drop arm', 'اختبار سقوط الذراع', 'Rotator cuff tear', 'تمزق الكفة المدورة', 'Cannot lower the arm slowly from 90° abduction.', 'عدم القدرة على إنزال الذراع ببطء من 90° تبعيد.'],
      ['Lift-off (Gerber)', 'اختبار الرفع (جربر)', 'Subscapularis', 'العضلة تحت الكتف', 'Cannot lift the hand off the lower back.', 'عدم القدرة على رفع اليد عن أسفل الظهر.', ['muscle', /^Subscapularis/]],
      ['Apprehension / relocation', 'اختبار الخوف / إعادة التموضع', 'Anterior glenohumeral instability', 'عدم ثبات الكتف الأمامي', 'Apprehension in abduction + external rotation; relieved by posterior pressure.', 'خوف من الخلع عند التبعيد والتدوير الخارجي ويزول بالضغط الخلفي.', ['ligament', /Inferior glenohumeral/]],
      ['Sulcus sign', 'علامة الأخدود', 'Inferior instability', 'عدم ثبات سفلي', 'A sulcus appears below the acromion with downward traction.', 'ظهور أخدود تحت الأخرم عند شد الذراع للأسفل.', ['ligament', /^Glenohumeral joint capsule/]],
      ["Speed's", 'اختبار سبيد', 'Biceps long-head tendinopathy', 'التهاب وتر الرأس الطويل للعضلة ذات الرأسين', 'Pain in the bicipital groove on resisted shoulder flexion with supination.', 'ألم في الميزاب الثنائي عند مقاومة الثني مع التسطيح.', ['ligament', /Tendon sheath of long head/]],
      ['Cross-body adduction', 'التقريب عبر الجسم', 'AC joint pathology', 'مشكلة المفصل الأخرمي الترقوي', 'Pain over the AC joint.', 'ألم فوق المفصل الأخرمي الترقوي.', ['ligament', /Acromioclavicular ligament/]],
    ],
  },
  {
    id: 'elbow', en: 'Elbow & forearm', ar: 'المرفق والساعد', reg: 'upper', bones: /^(Humerus|Radius|Ulna)/i,
    rom: [['Flexion', 'ثني', '0–150°'], ['Extension', 'بسط', '0° (up to ~5–10° hyperextension in some people)'], ['Supination', 'تسطيح (كب للأعلى)', '0–80°'], ['Pronation', 'كب', '0–80°']],
    mmt: [
      ['Flexion', 'ثني', 'Biceps brachii, brachialis, brachioradialis', 'ذات الرأسين، العضدية، العضدية الكعبرية', 'C5–C6', /^(Biceps brachii|Brachialis|Brachioradialis)/],
      ['Extension', 'بسط', 'Triceps brachii', 'ثلاثية الرؤوس', 'C7–C8', /^Triceps brachii/],
      ['Supination', 'تسطيح', 'Supinator, biceps brachii', 'الكابة، ذات الرأسين', 'C5–C6', /^(Supinator|Biceps brachii)/],
      ['Pronation', 'كب', 'Pronator teres, pronator quadratus', 'الكابة المدورة، الكابة المربعة', 'C6–C7', /^Pronator/],
    ],
    tests: [
      ["Cozen's / Mill's", 'كوزن / ميل', 'Lateral epicondylitis (tennis elbow)', 'التهاب اللقيمة الوحشية (مرفق التنس)', 'Pain at the lateral epicondyle on resisted wrist extension.', 'ألم عند اللقيمة الوحشية عند مقاومة بسط الرسغ.', ['muscle', /^Extensor carpi radialis brevis/]],
      ["Golfer's elbow test", 'اختبار مرفق الغولف', 'Medial epicondylitis', 'التهاب اللقيمة الإنسية', 'Pain at the medial epicondyle on resisted wrist flexion / pronation.', 'ألم عند اللقيمة الإنسية عند مقاومة ثني الرسغ والكب.', ['muscle', /^Flexor carpi radialis/]],
      ['Valgus stress', 'إجهاد الأروح', 'Ulnar (medial) collateral ligament', 'الرباط الجانبي الزندي (الإنسي)', 'Pain or excessive gapping at 20–30° flexion.', 'ألم أو فتحة زائدة عند 20–30° ثني.', ['ligament', /^Ulnar collateral ligament \(elbow\)/]],
      ['Varus stress', 'إجهاد الأفحج', 'Radial (lateral) collateral ligament', 'الرباط الجانبي الكعبري (الوحشي)', 'Pain or excessive gapping at 20–30° flexion.', 'ألم أو فتحة زائدة عند 20–30° ثني.', ['ligament', /^Radial collateral ligament \(elbow\)/]],
      ['Elbow flexion test / Tinel (cubital tunnel)', 'اختبار ثني المرفق / تينل', 'Ulnar nerve entrapment', 'انضغاط العصب الزندي', 'Tingling in the ring and little finger after 60 s of full flexion.', 'تنميل البنصر والخنصر بعد 60 ثانية ثني كامل.'],
    ],
  },
  {
    id: 'wrist', en: 'Wrist & hand', ar: 'الرسغ واليد', reg: 'upper', bones: /^(Radius|Ulna|Scaphoid|Lunate|Triquetrum|Pisiform|Trapezium|Trapezoid|Capitate|Hamate|Metacarpal)/i,
    rom: [['Flexion', 'ثني', '0–80°'], ['Extension', 'بسط', '0–70°'], ['Radial deviation', 'انحراف كعبري', '0–20°'], ['Ulnar deviation', 'انحراف زندي', '0–30°']],
    mmt: [
      ['Flexion', 'ثني', 'Flexor carpi radialis & ulnaris', 'المثنية الكعبرية والزندية للرسغ', 'C6–C8', /^Flexor carpi/],
      ['Extension', 'بسط', 'Extensor carpi radialis longus/brevis, ulnaris', 'الباسطات الكعبرية الطويلة والقصيرة والزندية', 'C6–C8', /^Extensor carpi/],
      ['Thumb abduction', 'تبعيد الإبهام', 'Abductor pollicis longus / brevis', 'المبعدة الطويلة والقصيرة للإبهام', 'C7–T1', /^Abductor pollicis/],
    ],
    tests: [
      ["Phalen's", 'اختبار فالن', 'Carpal tunnel syndrome', 'متلازمة النفق الرسغي', 'Tingling in median-nerve fingers within 60 s of wrist flexion.', 'تنميل في أصابع العصب الأوسط خلال 60 ثانية من ثني الرسغ.', ['muscle', /^Flexor retinaculum/]],
      ['Tinel (wrist)', 'تينل عند الرسغ', 'Carpal tunnel syndrome', 'متلازمة النفق الرسغي', 'Tingling on tapping over the median nerve at the wrist.', 'تنميل عند النقر على العصب الأوسط عند الرسغ.'],
      ['Finkelstein', 'اختبار فينكلشتاين', 'De Quervain tenosynovitis', 'التهاب غمد أوتار الإبهام', 'Sharp pain at the radial styloid on ulnar deviation with thumb tucked in.', 'ألم حاد عند الناتئ الإبري الكعبري عند الانحراف الزندي مع طي الإبهام.', ['muscle', /^Abductor pollicis longus/]],
      ['Watson scaphoid shift', 'اختبار واتسون', 'Scapholunate instability', 'عدم ثبات الزورقي-الهلالي', 'Painful clunk at the dorsal scaphoid.', 'طقطقة مؤلمة عند الزورقي الظهري.', ['bone', /^Scaphoid/]],
    ],
  },
  {
    id: 'hip', en: 'Hip', ar: 'الورك', reg: 'lower', bones: /^(Femur|Hip bone|Pelvis|Os coxae)/i,
    rom: [['Flexion', 'ثني', '0–120°'], ['Extension', 'بسط', '0–30°'], ['Abduction', 'تبعيد', '0–45°'], ['Adduction', 'تقريب', '0–30°'], ['Internal rotation', 'تدوير داخلي', '0–45°'], ['External rotation', 'تدوير خارجي', '0–45°']],
    mmt: [
      ['Flexion', 'ثني', 'Iliopsoas (psoas major + iliacus), rectus femoris', 'الحرقفية القطنية، المستقيمة الفخذية', 'L1–L3', /^(Psoas major|Iliacus|Rectus femoris)/],
      ['Extension', 'بسط', 'Gluteus maximus, hamstrings', 'الألوية الكبرى، أوتار الركبة', 'L5–S2', /^(Gluteus maximus|Biceps femoris|Semi)/],
      ['Abduction', 'تبعيد', 'Gluteus medius, gluteus minimus, TFL', 'الألوية الوسطى والصغرى، الموترة للفافة العريضة', 'L4–S1', /^(Gluteus medius|Gluteus minimus|Tensor fasciae)/],
      ['Adduction', 'تقريب', 'Adductor magnus / longus / brevis, gracilis, pectineus', 'المقربات، الرشيقة، الناشزة', 'L2–L4', /^(Adductor|Gracilis|Pectineus)/],
      ['External rotation', 'تدوير خارجي', 'Piriformis, obturators, gemelli, quadratus femoris', 'الكمثرية، السدادات، التوأميتان، المربعة الفخذية', 'L5–S2', /^(Piriformis|Obturator|Gemellus|Quadratus femoris)/],
      ['Internal rotation', 'تدوير داخلي', 'Gluteus minimus, TFL', 'الألوية الصغرى، الموترة للفافة العريضة', 'L4–S1', /^(Gluteus minimus|Tensor fasciae)/],
    ],
    tests: [
      ['FABER (Patrick)', 'فابر (باتريك)', 'Hip joint / sacroiliac pathology', 'مشكلة بمفصل الورك أو العجزي الحرقفي', 'Groin pain (hip) or posterior pain (SIJ) with the knee falling poorly toward the table.', 'ألم بالأربية (الورك) أو بالخلف (العجزي) مع عدم نزول الركبة.'],
      ['FADIR', 'فادير', 'Femoroacetabular impingement / labral tear', 'اصطدام الفخذ بالحُقّ / تمزق الشفا', 'Groin pain with flexion, adduction, internal rotation.', 'ألم بالأربية مع الثني والتقريب والتدوير الداخلي.', ['ligament', /Acetabular labrum/]],
      ['Thomas test', 'اختبار توماس', 'Hip flexor tightness', 'قِصَر عضلات ثني الورك', 'The straight thigh lifts off the table when the other knee is hugged.', 'ارتفاع الفخذ الممدود عن الطاولة عند ضم الركبة الأخرى.', ['muscle', /^Psoas major/]],
      ['Trendelenburg', 'علامة ترندلنبرغ', 'Gluteus medius weakness', 'ضعف الألوية الوسطى', 'The pelvis drops on the side opposite the stance leg.', 'هبوط الحوض في الجانب المقابل لقدم الارتكاز.', ['muscle', /^Gluteus medius/]],
      ["Ober's", 'اختبار أوبر', 'Iliotibial band tightness', 'قِصَر الشريط الحرقفي الظنبوبي', 'The top leg does not drop below horizontal.', 'عدم نزول الساق العلوية تحت المستوى الأفقي.', ['muscle', /^Tensor fasciae/]],
      ['Scour (quadrant)', 'اختبار الحك', 'Intra-articular hip pathology', 'مرض داخل مفصل الورك', 'Pain, catching or crepitus on a compressive arc.', 'ألم أو تعلّق أو خشخشة عند الحركة الدائرية مع الضغط.'],
    ],
  },
  {
    id: 'knee', en: 'Knee', ar: 'الركبة', reg: 'lower', bones: /^(Femur|Tibia|Fibula|Patella)/i,
    rom: [['Flexion', 'ثني', '0–135°'], ['Extension', 'بسط', '0° (hyperextension up to ~5° may be normal)']],
    mmt: [
      ['Extension', 'بسط', 'Quadriceps (rectus femoris + vasti)', 'الرباعية (المستقيمة الفخذية + الوحشية والإنسية والمتوسطة)', 'L2–L4', /^(Rectus femoris|Vastus)/],
      ['Flexion', 'ثني', 'Hamstrings (biceps femoris, semitendinosus, semimembranosus)', 'أوتار الركبة', 'L5–S2', /^(Biceps femoris|Semitendinosus|Semimembranosus)/],
    ],
    tests: [
      ['Lachman', 'لاكمان', 'ACL tear', 'تمزق الرباط الصليبي الأمامي', 'Excessive anterior tibial translation with a soft end-feel at 20–30° flexion.', 'انزلاق أمامي زائد للظنبوب بنهاية لينة عند 20–30° ثني.', ['ligament', /Anterior cruciate/]],
      ['Anterior drawer', 'الدرج الأمامي', 'ACL tear', 'تمزق الرباط الصليبي الأمامي', 'Anterior tibial translation at 90° flexion.', 'انزلاق أمامي للظنبوب عند 90° ثني.', ['ligament', /Anterior cruciate/]],
      ['Posterior drawer / sag sign', 'الدرج الخلفي / علامة الترهل', 'PCL tear', 'تمزق الرباط الصليبي الخلفي', 'Posterior tibial translation / tibia sags back.', 'انزلاق خلفي للظنبوب أو ترهله للخلف.', ['ligament', /Posterior cruciate/]],
      ['Valgus stress', 'إجهاد الأروح', 'MCL sprain', 'التواء الرباط الجانبي الإنسي', 'Pain or laxity at 0° and 30° flexion.', 'ألم أو ارتخاء عند 0° و30° ثني.', ['ligament', /^Medial collateral ligament – superficial/]],
      ['Varus stress', 'إجهاد الأفحج', 'LCL sprain', 'التواء الرباط الجانبي الوحشي', 'Pain or laxity at 0° and 30° flexion.', 'ألم أو ارتخاء عند 0° و30° ثني.', ['ligament', /^Lateral collateral ligament/]],
      ['McMurray', 'ماك موري', 'Meniscal tear', 'تمزق الغضروف الهلالي', 'Painful click or catch on flexion with rotation and extension.', 'طقطقة أو تعلّق مؤلم عند الثني مع التدوير ثم البسط.', ['ligament', /meniscus/]],
      ['Apley grind', 'اختبار أبلي', 'Meniscal injury', 'إصابة الغضروف الهلالي', 'Pain on compression with rotation (prone, knee 90°).', 'ألم عند الضغط مع التدوير (وضع الانبطاح، ركبة 90°).', ['ligament', /meniscus/]],
      ['Patellar apprehension', 'خوف الرضفة', 'Patellar instability', 'عدم ثبات الرضفة', 'Apprehension / quadriceps guarding on lateral glide.', 'خوف أو انقباض دفاعي عند إزاحة الرضفة للخارج.', ['ligament', /patellar retinaculum/]],
      ['Ballottement (patellar tap)', 'اختبار الرضفة الطافية', 'Knee effusion', 'انصباب الركبة', 'The patella floats and taps back on the femur.', 'تطفو الرضفة وتصطدم بالفخذ عند الضغط.'],
    ],
  },
  {
    id: 'ankle', en: 'Ankle & foot', ar: 'الكاحل والقدم', reg: 'lower', bones: /^(Tibia|Fibula|Talus|Calcaneus|Navicular|Cuboid|Cuneiform|Metatarsal)/i,
    rom: [['Dorsiflexion', 'ثني ظهري', '0–20°'], ['Plantarflexion', 'ثني أخمصي', '0–50°'], ['Inversion', 'قلب للداخل', '0–35°'], ['Eversion', 'قلب للخارج', '0–15°']],
    mmt: [
      ['Dorsiflexion', 'ثني ظهري', 'Tibialis anterior', 'الظنبوبية الأمامية', 'L4–L5', /^Tibialis anterior/],
      ['Plantarflexion', 'ثني أخمصي', 'Gastrocnemius, soleus', 'التوأمية، النعلية', 'S1–S2', /^(Gastrocnemius|Soleus)/],
      ['Inversion', 'قلب للداخل', 'Tibialis posterior (+ tibialis anterior)', 'الظنبوبية الخلفية', 'L4–L5', /^Tibialis posterior/],
      ['Eversion', 'قلب للخارج', 'Fibularis longus & brevis', 'الشظوية الطويلة والقصيرة', 'L5–S1', /^Fibularis (longus|brevis)/],
      ['Great-toe extension', 'بسط الإبهام', 'Extensor hallucis longus', 'الباسطة الطويلة للإبهام', 'L5', /^Extensor hallucis longus/],
    ],
    tests: [
      ['Anterior drawer (ankle)', 'الدرج الأمامي للكاحل', 'ATFL sprain', 'التواء الرباط الظنبوبي الشظوي الأمامي', 'Anterior talar translation / suction sign.', 'انزلاق أمامي للكاحل أو علامة الشفط.', ['ligament', /Anterior talofibular/]],
      ['Talar tilt', 'ميل الكاحل', 'Calcaneofibular ligament (CFL)', 'الرباط العقبي الشظوي', 'Excessive inversion tilt compared to the other side.', 'ميل قلب زائد مقارنة بالجانب الآخر.', ['ligament', /Calcaneofibular/]],
      ['Thompson (calf squeeze)', 'اختبار طومسون', 'Achilles tendon rupture', 'تمزق وتر أخيل', 'No plantarflexion when the calf is squeezed.', 'غياب الثني الأخمصي عند عصر السمانة.', ['muscle', /^Soleus/]],
      ['Squeeze test', 'اختبار العصر', 'Syndesmosis (high ankle) sprain', 'التواء الرباط الداخلي العلوي للكاحل', 'Pain at the ankle when squeezing tibia and fibula mid-calf.', 'ألم بالكاحل عند عصر الظنبوب والشظية في منتصف الساق.', ['ligament', /Anterior tibiofibular/]],
      ['External rotation (Kleiger)', 'التدوير الخارجي (كلايجر)', 'Deltoid / syndesmosis injury', 'إصابة الرباط الدالي أو الارتباط الشظوي', 'Pain on external rotation of the foot with the knee at 90°.', 'ألم عند التدوير الخارجي للقدم مع ركبة 90°.', ['ligament', /^Deltoid ligament/]],
    ],
  },
  {
    id: 'cervical', en: 'Cervical spine', ar: 'العمود الفقري العنقي', reg: 'spine', bones: /^(Atlas|Axis|Cervical|Vertebra prominens)/i,
    rom: [['Flexion', 'ثني', '0–45°'], ['Extension', 'بسط', '0–45°'], ['Lateral flexion', 'ميل جانبي', '0–45°'], ['Rotation', 'دوران', '0–80°']],
    mmt: [
      ['Flexion', 'ثني', 'Sternocleidomastoid, longus colli', 'القترائية الترقوية الخشائية، الطويلة العنقية', 'CN XI, C1–C6', /^(Sternocleidomastoid|Longus colli)/],
      ['Extension', 'بسط', 'Splenius, semispinalis, upper trapezius', 'الصفيحية، نصف الشوكية، شبه المنحرفة العلوية', 'C1–T1 / CN XI', /^(Splenius|Semispinalis|Trapezius \(Descending)/],
      ['Shoulder elevation', 'رفع الكتف', 'Upper trapezius, levator scapulae', 'شبه المنحرفة العلوية، رافعة الكتف', 'CN XI, C3–C5', /^(Trapezius \(Descending|Levator scapulae)/],
    ],
    tests: [
      ["Spurling's", 'اختبار سبيرلنغ', 'Cervical radiculopathy', 'اعتلال جذر عصبي عنقي', 'Arm pain / paraesthesia on extension + side-flexion + axial compression.', 'ألم أو تنميل بالذراع عند البسط والميل الجانبي مع ضغط محوري.'],
      ['Distraction test', 'اختبار الشد', 'Cervical radiculopathy', 'اعتلال جذر عصبي عنقي', 'Symptoms relieved by manual traction.', 'تخفّ الأعراض بالشد اليدوي للرقبة.'],
      ['ULNT 1 (median nerve)', 'شد العصب الأوسط', 'Neural tension / radiculopathy', 'شد عصبي أو اعتلال جذر', 'Reproduction of arm symptoms that change with neck side-flexion.', 'ظهور أعراض الذراع وتغيّرها مع الميل الجانبي للرقبة.'],
      ['Cervical flexion–rotation test', 'اختبار الثني والدوران', 'C1–C2 hypomobility (cervicogenic headache)', 'نقص حركة C1–C2 (صداع عنقي المنشأ)', 'Rotation range < ~32° or restricted compared to the other side.', 'مدى دوران أقل من حوالي 32° أو أقل من الجانب الآخر.'],
      ['Sharp–Purser', 'شارب–بورسر', 'Atlantoaxial instability', 'عدم ثبات المفصل الأطلسي المحوري', 'Posterior shift / clunk of the atlas; symptoms relieved.', 'إزاحة خلفية للأطلس مع طقطقة وتخفّ الأعراض.'],
    ],
  },
  {
    id: 'lumbar', en: 'Lumbar spine & SIJ', ar: 'القطنية والمفصل العجزي الحرقفي', reg: 'spine', bones: /^(Lumbar|Sacrum|Hip bone)/i,
    rom: [['Flexion', 'ثني', '0–60° (Schober ≥ 5 cm increase)'], ['Extension', 'بسط', '0–25°'], ['Lateral flexion', 'ميل جانبي', '0–25°'], ['Rotation', 'دوران', '0–30°']],
    mmt: [
      ['Trunk flexion', 'ثني الجذع', 'Rectus abdominis, obliques', 'المستقيمة البطنية، المائلتان', 'T5–L1', /^(Rectus abdominis|External oblique|Internal oblique)/],
      ['Trunk extension', 'بسط الجذع', 'Erector spinae, multifidus', 'الناصبة للفقار، المتعددة الشقوق', 'Dorsal rami', /^(Iliocostalis|Longissimus|Spinalis|Multifidus)/],
      ['Hip hiking', 'رفع الحوض', 'Quadratus lumborum', 'المربعة القطنية', 'T12–L3', /^Quadratus lumborum/],
    ],
    tests: [
      ['Straight leg raise (Lasègue)', 'رفع الساق المستقيمة', 'L5/S1 radiculopathy / disc herniation', 'اعتلال جذر L5/S1 / انزلاق غضروفي', 'Leg pain below the knee between 30–70° of hip flexion.', 'ألم بالساق تحت الركبة بين 30 و70° ثني ورك.'],
      ['Crossed SLR', 'الرفع المتقاطع', 'Disc herniation (high specificity)', 'انزلاق غضروفي (نوعية عالية)', 'Raising the healthy leg reproduces symptoms in the painful leg.', 'رفع الساق السليمة يسبب ألماً في الساق المصابة.'],
      ['Slump test', 'اختبار الانحناء', 'Neural tension (sciatic)', 'شد عصبي (الوركي)', 'Reproduction of leg symptoms that ease with neck extension.', 'ظهور أعراض الساق وتخف مع بسط الرقبة.'],
      ['Femoral nerve stretch', 'شد العصب الفخذي', 'L2–L4 radiculopathy', 'اعتلال جذر L2–L4', 'Anterior thigh pain on prone knee flexion.', 'ألم بالفخذ الأمامي عند ثني الركبة في الانبطاح.'],
      ['SIJ provocation cluster', 'مجموعة اختبارات العجزي الحرقفي', 'Sacroiliac joint pain', 'ألم المفصل العجزي الحرقفي', '≥ 3 of 5 positive: distraction, thigh thrust, compression, Gaenslen, sacral thrust.', '3 من 5 اختبارات إيجابية أو أكثر: الشد، دفع الفخذ، الضغط، غاينسلن، دفع العجز.', ['ligament', /sacro-iliac/i]],
      ['Modified Schober', 'شوبر المعدل', 'Lumbar flexion mobility (e.g. ankylosing spondylitis)', 'حركة القطنية (مثل التهاب الفقار اللاصق)', 'Increase < 5 cm over a 10-cm line on forward bending.', 'زيادة أقل من 5 سم على خط 10 سم عند الانحناء.'],
    ],
  },
];

/* Exercises: regex on muscle base name -> {s: strengthening, t: stretch}. [en, ar] pairs. */
window.EXERCISES = [
  [/^Biceps brachii|^Brachialis|^Brachioradialis/, { s: [['Dumbbell biceps curl', 'ثني المرفق بالدمبل'], ['Hammer curl (brachialis / brachioradialis)', 'هامر كيرل']], t: [['Wall biceps stretch: arm extended behind, palm on wall, turn away', 'إطالة ذات الرأسين على الحائط']] }],
  [/^Triceps brachii|^Anconeus/, { s: [['Triceps push-down / overhead dumbbell extension', 'بسط المرفق بالكيبل أو فوق الرأس'], ['Close-grip push-up', 'ضغط بقبضة ضيقة']], t: [['Overhead triceps stretch: elbow up, hand behind neck, gently press the elbow', 'إطالة الثلاثية فوق الرأس']] }],
  [/^Deltoid/, { s: [['Lateral raise to 90°', 'رفع جانبي حتى 90°'], ['Front raise / bent-over reverse fly (posterior fibres)', 'رفع أمامي / فلاي عكسي للألياف الخلفية']], t: [['Cross-body arm stretch', 'إطالة الذراع عبر الجسم']] }],
  [/^Supraspinatus/, { s: [['Scaption raise ("full can") in the scapular plane, light weight', 'رفع بمستوى اللوح (كوب ممتلئ) بوزن خفيف'], ['Side-lying abduction 0–30°', 'تبعيد جانبي مستلقياً 0–30°']], t: [['Gentle sleeper-type stretch only if tolerated; avoid forceful stretch in impingement', 'إطالة لطيفة فقط إن لم تسبب ألماً (تجنّب الشد القوي عند الاحتكاك)']] }],
  [/^Infraspinatus|^Teres minor/, { s: [['External rotation with elastic band, elbow at the side', 'تدوير خارجي بشريط مطاطي والمرفق بجانب الجسم'], ['Side-lying external rotation with light dumbbell', 'تدوير خارجي مستلقياً على الجانب بدمبل خفيف']], t: [['Cross-body / sleeper stretch (posterior capsule)', 'إطالة عبر الجسم (المحفظة الخلفية)']] }],
  [/^Subscapularis/, { s: [['Internal rotation with elastic band, elbow at the side', 'تدوير داخلي بشريط مطاطي'], ['Belly-press / lift-off exercise', 'ضغط البطن / تمرين الرفع']], t: [['Doorway external-rotation stretch at 45° abduction', 'إطالة بالتدوير الخارجي عند الباب']] }],
  [/^Pectoralis major|^Pectoralis minor/, { s: [['Push-up / chest press', 'ضغط / ضغط صدر'], ['Cable or band fly', 'فلاي بالكيبل أو الشريط']], t: [['Doorway pectoral stretch at 90° and 120° elbow height', 'إطالة الصدر عند الباب']] }],
  [/^Latissimus dorsi|^Teres major/, { s: [['Lat pull-down / assisted pull-up', 'سحب علوي / عقلة بمساعدة'], ['Straight-arm pull-down', 'سحب بذراع مستقيمة']], t: [['Overhead side-bend stretch / child\'s pose with arms reaching forward', 'إطالة الجانب فوق الرأس / وضعية الطفل']] }],
  [/^Trapezius \((Descending)/, { s: [['Shoulder shrugs with dumbbells', 'رفع الكتفين بالدمبل'], ['Upright row (light, pain-free range)', 'سحب عمودي خفيف']], t: [['Upper-trapezius stretch: tilt ear to shoulder with gentle overpressure', 'إطالة شبه المنحرفة العلوية بميل الرأس جانباً']] }],
  [/^Trapezius \((Transverse|Ascending)/, { s: [['Prone "Y" and "T" raises', 'رفع على شكل Y وT منبطحاً'], ['Seated row with scapular retraction', 'سحب جلوس مع ضم اللوحين']], t: [['Hug-yourself scapular protraction stretch', 'إطالة بعناق الذات (إبعاد اللوحين)']] }],
  [/^Rhomboid/, { s: [['Scapular retraction squeezes / band rows', 'ضم اللوحين / سحب بشريط'], ['Prone horizontal abduction', 'تبعيد أفقي منبطحاً']], t: [['Cross-arm hug stretch between the shoulder blades', 'إطالة بين اللوحين بتشبيك الذراعين']] }],
  [/^Serratus anterior/, { s: [['Push-up plus (extra protraction at the top)', 'ضغط بلس (دفع إضافي للوح)'], ['Wall slide with band / punch-out', 'انزلاق على الحائط مع شريط']], t: [['Doorway stretch of the thoracic spine and lateral chest wall', 'إطالة جدار الصدر الجانبي']] }],
  [/^Levator scapulae/, { s: [['Shoulder shrugs with scapular retraction', 'رفع الكتف مع ضم اللوح']], t: [['Look toward the armpit and gently press the head down', 'النظر نحو الإبط مع ضغط خفيف للرأس']] }],
  [/^Sternocleidomastoid|^Scalenus/, { s: [['Chin tuck (deep neck flexor activation)', 'سحب الذقن للداخل (تنشيط الثانيات العميقة)'], ['Isometric neck flexion / side-flexion against hand', 'انقباض ثابت ضد اليد']], t: [['Ear-to-shoulder with opposite shoulder depressed; add slight rotation for SCM', 'ميل الأذن للكتف مع خفض الكتف الآخر']] }],
  [/^Rectus abdominis|^Transversus abdominis|^Pyramidalis/, { s: [['Curl-up (crunch) / dead-bug', 'كرنش / ديد باغ'], ['Plank with abdominal drawing-in', 'بلانك مع شد البطن للداخل']], t: [['Cobra / prone press-up stretch', 'إطالة الكوبرا']] }],
  [/^External oblique|^Internal oblique/, { s: [['Side plank', 'بلانك جانبي'], ['Pallof press / bicycle crunch', 'بالوف برس / كرنش الدراجة']], t: [['Standing side-bend with arm overhead', 'ميل جانبي واقفاً مع رفع الذراع']] }],
  [/^Iliocostalis|^Longissimus|^Spinalis|^Multifidus|^Semispinalis/, { s: [['Bird-dog', 'بيرد دوغ'], ['Prone back extension (Superman)', 'بسط الظهر منبطحاً']], t: [['Child\'s pose / knees-to-chest', 'وضعية الطفل / الركبتان للصدر']] }],
  [/^Quadratus lumborum/, { s: [['Side plank', 'بلانك جانبي'], ['Hip hikes (standing)', 'رفع الحوض واقفاً']], t: [['Standing side-bend over the opposite side or side-lying over a roll', 'ميل جانبي واقفاً أو فوق وسادة']] }],
  [/^Gluteus maximus/, { s: [['Glute bridge / hip thrust', 'جسر الألوية / هيب ثراست'], ['Squat and deadlift', 'سكوات وديدلفت']], t: [['Knee-to-opposite-shoulder stretch (supine)', 'ضم الركبة للكتف المقابل']] }],
  [/^Gluteus medius|^Gluteus minimus/, { s: [['Side-lying hip abduction / clamshell', 'تبعيد جانبي مستلقياً / كلام شل'], ['Banded lateral walk', 'مشي جانبي بشريط']], t: [['Figure-4 stretch', 'إطالة الرقم 4']] }],
  [/^Piriformis|^Gemellus|^Obturator|^Quadratus femoris/, { s: [['Hip external rotation with band (seated / side-lying)', 'تدوير خارجي بشريط']], t: [['Figure-4 (supine piriformis) stretch', 'إطالة الكمثرية (رقم 4)']] }],
  [/^Psoas major|^Iliacus/, { s: [['Standing or seated resisted hip flexion (march)', 'ثني الورك بمقاومة (مشي ثابت)'], ['Hanging knee raise', 'رفع الركبة معلقاً']], t: [['Half-kneeling hip-flexor stretch with posterior pelvic tilt', 'إطالة ثانيات الورك من وضع نصف الركوع']] }],
  [/^Rectus femoris|^Vastus/, { s: [['Seated knee extension / leg press', 'بسط الركبة جلوساً / ليج برس'], ['Terminal knee extension and mini-squats (VMO)', 'بسط نهائي للركبة وسكوات صغير']], t: [['Standing quadriceps stretch (heel to buttock, hips neutral)', 'إطالة الرباعية واقفاً (الكعب نحو المؤخرة)']] }],
  [/^Biceps femoris|^Semitendinosus|^Semimembranosus/, { s: [['Prone hamstring curl / Nordic curl (advanced)', 'ثني الركبة منبطحاً / نوردك كيرل'], ['Romanian deadlift', 'رومانيان ديدلفت']], t: [['Supine hamstring stretch with strap, knee extended', 'إطالة الأوتار مستلقياً بحبل']] }],
  [/^Adductor|^Gracilis|^Pectineus/, { s: [['Ball squeeze between knees', 'ضغط كرة بين الركبتين'], ['Side-lying hip adduction', 'تقريب جانبي مستلقياً']], t: [['Butterfly / seated straddle stretch', 'إطالة الفراشة']] }],
  [/^Tensor fasciae/, { s: [['Standing hip abduction with slight internal rotation', 'تبعيد الورك واقفاً']], t: [['Standing cross-leg side-bend / foam-roll IT band (gentle)', 'إطالة بتقاطع الساقين مع ميل جانبي']] }],
  [/^Sartorius/, { s: [['Hip flexion with external rotation (heel slide along shin)', 'ثني الورك مع تدوير خارجي']], t: [['Half-kneeling hip-flexor stretch with slight adduction', 'إطالة ثانيات الورك مع تقريب بسيط']] }],
  [/^Gastrocnemius|^Soleus|^Plantaris/, { s: [['Standing calf raise (knee straight = gastrocnemius; knee bent = soleus)', 'رفع الكعبين واقفاً (ركبة مستقيمة = التوأمية، مثنية = النعلية)'], ['Single-leg heel raise', 'رفع الكعب على ساق واحدة']], t: [['Wall calf stretch: back knee straight (gastrocnemius), then bent (soleus), 30 s', 'إطالة السمانة على الحائط: ركبة مستقيمة ثم مثنية']] }],
  [/^Tibialis anterior|^Extensor/, { s: [['Heel walking / band dorsiflexion', 'المشي على الكعبين / ثني ظهري بشريط']], t: [['Kneeling toes-pointed stretch', 'إطالة القدم من وضع الركوع']] }],
  [/^Tibialis posterior|^Flexor digitorum longus|^Flexor hallucis longus/, { s: [['Band inversion; short-foot exercise', 'قلب القدم للداخل بشريط؛ تمرين القدم القصيرة']], t: [['Calf stretch with foot slightly everted', 'إطالة السمانة مع قلب القدم للخارج قليلاً']] }],
  [/^Fibularis/, { s: [['Band eversion', 'قلب القدم للخارج بشريط'], ['Single-leg balance on an unstable surface', 'توازن على ساق واحدة على سطح غير ثابت']], t: [['Seated ankle inversion stretch', 'إطالة بقلب الكاحل للداخل']] }],
  [/^Flexor carpi|^Palmaris|^Flexor digitorum (superficialis|profundus)|^Pronator/, { s: [['Wrist curl (palm up) with light dumbbell', 'ثني الرسغ بدمبل خفيف'], ['Pronation / supination with hammer', 'كب وتسطيح بمطرقة']], t: [['Wrist flexor stretch: arm straight, palm up, gently pull the fingers back', 'إطالة مثنيات الرسغ']] }],
  [/^Extensor carpi|^Extensor digitorum$|^Supinator/, { s: [['Reverse wrist curl with light dumbbell', 'بسط الرسغ بدمبل خفيف'], ['Eccentric wrist extension (tennis elbow)', 'بسط الرسغ بالانقباض اللامركزي']], t: [['Wrist extensor stretch: arm straight, palm down, gently flex the wrist', 'إطالة باسطات الرسغ']] }],
  [/^Longus colli|^Longus capitis|^Rectus capitis anterior/, { s: [['Chin tuck (supine, hold 10 s)', 'سحب الذقن مستلقياً مع ثبات 10 ثوانٍ']], t: [['Gentle upper-cervical flexion stretch', 'إطالة لطيفة لأعلى الرقبة']] }],
  [/^Splenius|^Semispinalis (capitis|cervicis)/, { s: [['Prone neck extension (head lift)', 'رفع الرأس منبطحاً']], t: [['Chin-to-chest stretch with hands behind the head', 'إطالة بسحب الذقن للصدر']] }],
];
window.EX_NOTE = ['Strengthening: usually 2–4 sets × 8–12 reps, 2–3 days/week, progressing load gradually. Stretching: hold 20–30 s × 2–4, to mild tension without pain. Adjust to the patient and consult the supervising physiotherapist.',
  'التقوية: غالباً 2–4 مجموعات × 8–12 تكراراً، 2–3 أيام أسبوعياً مع زيادة الحمل تدريجياً. الإطالة: ثبات 20–30 ثانية × 2–4 حتى شد خفيف بدون ألم. يُعدَّل حسب المريض وبمراجعة أخصائي العلاج الطبيعي المشرف.'];
