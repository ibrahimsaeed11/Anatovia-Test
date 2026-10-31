/* tests.js — special-test cards: step-by-step procedure + positive finding + related structures shown on the 3D model.
   Procedures are standard textbook descriptions (draft, to be reviewed by a licensed physiotherapist). Loaded by study.js. */
'use strict';
(function () {
  if (window.__testsLoaded) return; window.__testsLoaded = true;
  const M = (rx) => ['muscle', rx], G = (rx) => ['ligament', rx];
  /* key: joint id | English name (as in clinic-data.js)  →  [stepsEN, stepsAR, related[]] */
  const TC = {
    'shoulder|Neer impingement': [
      ['Patient sitting or standing; stabilise the scapula with one hand.', 'With the other hand, passively raise the straight, internally rotated arm in forward flexion to end range.', 'Ask about pain in the anterior/lateral shoulder.'],
      ['المريض جالس أو واقف، ثبّت اللوح بيد واحدة.', 'باليد التانية ارفع الذراع المفرودة (مع تدوير داخلي) للأمام بشكل سلبي لحد نهاية المدى.', 'اسأل عن الألم في مقدمة أو جانب الكتف.'],
      [G(/^Coraco-acromial/), G(/^Subacromial bursa/), M(/^Supraspinatus/)]],
    'shoulder|Hawkins–Kennedy': [
      ['Patient sitting; flex the shoulder to 90° and the elbow to 90°.', 'Support the arm and passively rotate the shoulder internally (forearm moves down).', 'Pain under the acromion is a positive sign.'],
      ['المريض جالس؛ اثنِ الكتف 90° والمرفق 90°.', 'ادعم الذراع وأدِّرها داخليًا بشكل سلبي (الساعد ينزل لتحت).', 'الألم تحت الأخرم يعني اختبار إيجابي.'],
      [G(/^Subacromial bursa/), G(/^Coraco-acromial/), M(/^Supraspinatus/)]],
    'shoulder|Empty can (Jobe)': [
      ['Patient standing; elevate both arms to 90° in the scapular plane (30° forward of the frontal plane).', 'Rotate the arms internally so the thumbs point down ("emptying a can").', 'Apply downward resistance at the wrists and compare both sides.'],
      ['المريض واقف؛ ارفع الذراعين 90° في مستوى اللوح (30° قدّام المستوى الجبهي).', 'أدِّر الذراعين داخليًا بحيث الإبهام لتحت («بتفضّي كوباية»).', 'ادفع لتحت عند الرسغين وقارن الجهتين.'],
      [M(/^Supraspinatus/), M(/^Deltoid/)]],
    'shoulder|Drop arm': [
      ['Passively abduct the patient\'s arm to 90° (or full range).', 'Ask the patient to lower the arm slowly to the side in the same arc.', 'Inability to control it, or sudden drop, is positive.'],
      ['ارفع ذراع المريض تبعيدًا لحد 90° (أو المدى الكامل).', 'اطلب منه ينزّلها ببطء لجنبه في نفس المسار.', 'لو معرفش يتحكم فيها أو وقعت فجأة يبقى إيجابي.'],
      [M(/^Supraspinatus/), M(/^Infraspinatus/), M(/^Deltoid/)]],
    'shoulder|Lift-off (Gerber)': [
      ['Patient places the back of the hand on the mid/lower back, palm facing out.', 'Ask the patient to lift the hand off the back (internal rotation).', 'Add light resistance if able; compare the sides.'],
      ['المريض يحط ضهر إيده على أسفل الظهر وكفه لبرّا.', 'اطلب منه يرفع إيده بعيد عن الظهر (تدوير داخلي).', 'زوّد مقاومة خفيفة لو قدر وقارن الجهتين.'],
      [M(/^Subscapularis/)]],
    'shoulder|Apprehension / relocation': [
      ['Patient supine; abduct the shoulder to 90° and flex the elbow to 90°.', 'Slowly externally rotate the arm; watch for apprehension (not just pain).', 'Relocation: apply a posterior force on the humeral head — apprehension eases.'],
      ['المريض نايم على ضهره؛ بعّد الكتف 90° واثنِ المرفق 90°.', 'أدِّر الذراع خارجيًا ببطء؛ لاحظ الخوف أو التوجّس (مش الألم بس).', 'إعادة التموضع: اضغط على رأس العضد للخلف — التوجّس يقل.'],
      [G(/^Inferior glenohumeral/), G(/^Glenoid labrum/), G(/^Middle glenohumeral/)]],
    'shoulder|Sulcus sign': [
      ['Patient seated with the arm relaxed at the side.', 'Grasp the elbow/forearm and apply a steady downward pull.', 'A visible dimple (sulcus) below the acromion = positive.'],
      ['المريض جالس والذراع مسترخية على الجنب.', 'امسك المرفق أو الساعد واسحب لتحت بثبات.', 'ظهور حفرة تحت الأخرم = إيجابي.'],
      [G(/^Superior glenohumeral/), G(/^Coracohumeral/), G(/^Glenohumeral joint capsule/)]],
    'shoulder|Cross-body adduction': [
      ['Patient seated; flex the shoulder to 90°.', 'Passively adduct the arm horizontally across the chest.', 'Pain on top of the shoulder indicates AC joint pathology.'],
      ['المريض جالس؛ اثنِ الكتف 90°.', 'قرّب الذراع أفقيًا عبر الصدر بشكل سلبي.', 'الألم أعلى الكتف يدل على مشكلة في المفصل الأخرمي الترقوي.'],
      [G(/^Acromioclavicular/)]],
    'elbow|Valgus stress': [
      ['Patient supine/seated; flex the elbow about 20–30° to unlock the olecranon.', 'Stabilise the humerus; apply a valgus (outward) force at the forearm.', 'Look for pain, excess gapping or soft end-feel vs the other side.'],
      ['المريض نايم أو جالس؛ اثنِ المرفق حوالي 20–30° لفك الزُّج.', 'ثبّت العضد واضغط على الساعد للخارج (valgus).', 'لاحظ الألم أو زيادة الفتح أو نهاية لينة مقارنة بالجهة التانية.'],
      [G(/^Ulnar collateral ligament \(elbow\)/)]],
    'elbow|Varus stress': [
      ['Flex the elbow about 20–30°.', 'Stabilise the humerus; apply a varus (inward) force at the forearm.', 'Excess laxity or pain suggests lateral collateral ligament injury.'],
      ['اثنِ المرفق حوالي 20–30°.', 'ثبّت العضد واضغط على الساعد للداخل (varus).', 'ارتخاء زائد أو ألم يدل على إصابة الرباط الجانبي الوحشي.'],
      [G(/^Radial collateral ligament \(elbow\)/)]],
    'elbow|Elbow flexion test / Tinel (cubital tunnel)': [
      ['Ask the patient to fully flex the elbows with the wrists extended and hold ~1 minute.', 'Ask about tingling in the ring and little fingers.', 'Tinel: tap over the ulnar nerve in the groove behind the medial epicondyle.'],
      ['اطلب من المريض يثني المرفقين كاملًا والرسغين مفرودين ويثبت حوالي دقيقة.', 'اسأل عن تنميل في البنصر والخنصر.', 'Tinel: اطرق على العصب الزندي في الميزاب خلف اللقمة الإنسية.'],
      [M(/^Flexor carpi ulnaris/)]],
    'wrist|Tinel (wrist)': [
      ['Patient\'s forearm supinated, wrist neutral.', 'Tap lightly over the median nerve at the carpal tunnel (proximal wrist crease).', 'Tingling in the thumb/index/middle fingers is positive.'],
      ['الساعد في وضع الكف لفوق والرسغ محايد.', 'اطرق بخفة على العصب الأوسط عند النفق الرسغي (ثنية الرسغ).', 'تنميل في الإبهام والسبابة والوسطى = إيجابي.'],
      [M(/^Flexor retinaculum of wrist/), M(/^Flexor digitorum superficialis/)]],
    'wrist|Finkelstein': [
      ['Patient makes a fist with the thumb tucked inside the fingers.', 'Stabilise the forearm and passively deviate the wrist toward the ulnar side.', 'Sharp pain over the radial styloid indicates De Quervain\'s tenosynovitis.'],
      ['المريض يقفل إيده والإبهام جوه الأصابع.', 'ثبّت الساعد وحرّك الرسغ سلبيًا ناحية الزندي.', 'ألم حاد عند الناتئ الإبري للكعبرة يدل على التهاب دي كيرفان.'],
      [M(/^Abductor pollicis longus/), M(/^Extensor pollicis brevis/)]],
    'wrist|Watson scaphoid shift': [
      ['Examiner\'s thumb presses the scaphoid tubercle on the palm side.', 'With the other hand, move the wrist from ulnar to radial deviation.', 'A painful clunk or the scaphoid slipping over the dorsal radius = positive (scapholunate instability).'],
      ['إبهام الفاحص يضغط على حدبة الزورقي من ناحية الكف.', 'باليد التانية حرّك الرسغ من انحراف زندي لانحراف كعبري.', 'طقة مؤلمة أو انزلاق الزورقي فوق الكعبرة = إيجابي (عدم ثبات زورقي-هلالي).'],
      [G(/^Dorsal radiocarpal/), G(/^Radial collateral ligament \(wrist\)/)]],
    'hip|FABER (Patrick)': [
      ['Patient supine; place the test foot on the opposite knee (Flexion, ABduction, External Rotation).', 'Stabilise the opposite ASIS with one hand.', 'Gently press the test knee toward the table; note pain location and height of the knee.'],
      ['المريض نايم على ضهره؛ حط قدم الجهة المفحوصة على ركبة الجهة التانية.', 'ثبّت الشوكة الحرقفية الأمامية العليا في الجهة المقابلة.', 'اضغط برفق على الركبة ناحية السرير؛ لاحظ مكان الألم وارتفاع الركبة.'],
      [M(/^Iliacus/), M(/^Psoas major/), M(/^Sartorius/), M(/^Adductor longus/)]],
    'hip|FADIR': [
      ['Patient supine; flex the hip to 90°.', 'Adduct and internally rotate the hip passively.', 'Groin pain reproduces the complaint — possible femoroacetabular impingement / labral tear.'],
      ['المريض نايم على ضهره؛ اثنِ الورك 90°.', 'قرّب وأدِّر الورك داخليًا بشكل سلبي.', 'ألم في الفخذ من فوق يعيد الشكوى — احتمال احتكاك ورك أو تمزق الشفا.'],
      [G(/^Acetabular labrum/), G(/^Hip joint capsule/)]],
    'hip|Thomas test': [
      ['Patient sits at the table edge, then lies back holding one knee to the chest (flattens the lumbar spine).', 'Let the other leg hang relaxed.', 'Thigh rising off the table = tight iliopsoas; knee extending = tight rectus femoris; abduction = tight TFL/ITB.'],
      ['المريض يقعد على حرف السرير وبعدين يرجع لورا وماسك ركبة لصدره (يسطّح القطنية).', 'سيب الرجل التانية متدلية مسترخية.', 'ارتفاع الفخذ = قصر الحرقفية القطنية؛ فرد الركبة = قصر المستقيمة الفخذية؛ التبعيد = قصر TFL والشريط الحرقفي.'],
      [M(/^Iliacus/), M(/^Psoas major/), M(/^Rectus femoris/), M(/^Tensor fasciae latae/)]],
    'hip|Trendelenburg': [
      ['Stand behind the patient (pelvis exposed).', 'Ask the patient to lift one leg (stance on the tested side) for about 30 seconds.', 'The pelvis dropping on the lifted side = weak gluteus medius on the stance side.'],
      ['وقف ورا المريض (الحوض باين).', 'اطلب منه يرفع رجل واحدة (يقف على الجهة المفحوصة) حوالي 30 ثانية.', 'نزول الحوض في الجهة المرفوعة = ضعف الألوية المتوسطة في جهة الارتكاز.'],
      [M(/^Gluteus medius/), M(/^Gluteus minimus/)]],
    'hip|Scour (quadrant)': [
      ['Patient supine; flex the hip to about 90° and adduct it toward the opposite shoulder.', 'Apply axial compression through the femur while moving the hip in an arc from adduction to abduction.', 'Pain, catching or crepitus suggests intra-articular pathology.'],
      ['المريض نايم على ضهره؛ اثنِ الورك حوالي 90° وقرّبه ناحية الكتف المقابل.', 'اضغط على طول الفخذ وحرّك الورك في قوس من التقريب للتبعيد.', 'ألم أو تعليق أو خشخشة يدل على مشكلة داخل المفصل.'],
      [G(/^Acetabular labrum/), G(/^Hip joint capsule/)]],
    'knee|Lachman': [
      ['Patient supine; knee flexed 20–30°, leg slightly externally rotated.', 'Stabilise the distal femur with one hand; grasp the proximal tibia with the other.', 'Pull the tibia forward; judge translation and the end-feel versus the other knee.'],
      ['المريض نايم على ضهره؛ الركبة مثنية 20–30° والرجل مدورة للخارج شوية.', 'ثبّت أسفل عظمة الفخذ بيد وامسك أعلى القصبة بالتانية.', 'اسحب القصبة للأمام؛ قيّم مقدار الحركة ونوع النهاية ومقارنة بالركبة التانية.'],
      [G(/\(ACL\)/)]],
    'knee|Anterior drawer': [
      ['Patient supine; hip flexed 45°, knee flexed 90°, foot flat on the table (sit lightly on the foot).', 'Wrap both hands around the proximal tibia; make sure the hamstrings are relaxed.', 'Pull the tibia anteriorly and compare the translation with the other side.'],
      ['المريض نايم على ضهره؛ الورك 45° والركبة 90° والقدم على السرير (اقعد بخفة على القدم).', 'امسك أعلى القصبة بإيديك الاتنين وتأكد إن الخلفية مسترخية.', 'اسحب القصبة للأمام وقارن الحركة بالجهة التانية.'],
      [G(/\(ACL\)/)]],
    'knee|Posterior drawer / sag sign': [
      ['Patient supine; hips flexed 45°, knees flexed 90°.', 'Sag sign: view from the side — the tibia sags backward relative to the other knee.', 'Posterior drawer: push the proximal tibia backward and judge translation.'],
      ['المريض نايم على ضهره؛ الوركين 45° والركبتين 90°.', 'علامة الترهل: بصّ من الجنب — القصبة بتنزل للخلف مقارنة بالركبة التانية.', 'الدرج الخلفي: ادفع أعلى القصبة للخلف وقيّم الحركة.'],
      [G(/\(PCL\)/)]],
    'knee|Valgus stress': [
      ['Patient supine; test at 0° and 30° of knee flexion.', 'One hand on the lateral knee, the other at the ankle/distal leg.', 'Apply a valgus force; gapping or pain on the medial side suggests MCL injury.'],
      ['المريض نايم؛ اختبر عند 0° و30° ثني للركبة.', 'يد على الجانب الوحشي للركبة والتانية عند الكاحل.', 'ادفع valgus؛ فتح أو ألم في الجانب الإنسي يدل على إصابة الرباط الجانبي الإنسي.'],
      [G(/^Medial collateral ligament/)]],
    'knee|Varus stress': [
      ['Patient supine; test at 0° and 30° of knee flexion.', 'One hand on the medial knee, the other at the ankle.', 'Apply a varus force; lateral gapping or pain suggests LCL (and posterolateral corner) injury.'],
      ['المريض نايم؛ اختبر عند 0° و30° ثني.', 'يد على الجانب الإنسي للركبة والتانية عند الكاحل.', 'ادفع varus؛ فتح أو ألم وحشي يدل على إصابة الرباط الجانبي الوحشي.'],
      [G(/^Lateral collateral ligament/), G(/^Popliteofibular/)]],
    'knee|McMurray': [
      ['Patient supine; fully flex the hip and knee.', 'Medial meniscus: externally rotate the tibia and apply a valgus force while extending the knee.', 'Lateral meniscus: internally rotate the tibia with a varus force while extending. A painful click/pop is positive.'],
      ['المريض نايم؛ اثنِ الورك والركبة كاملًا.', 'الغضروف الإنسي: أدِّر القصبة خارجيًا مع valgus وافرد الركبة.', 'الغضروف الوحشي: أدِّر القصبة داخليًا مع varus وافرد الركبة. طقة مؤلمة = إيجابي.'],
      [G(/^Medial meniscus/), G(/^Lateral meniscus/)]],
    'knee|Apley grind': [
      ['Patient prone; flex the knee to 90° and stabilise the thigh.', 'Press down through the heel (compression) and rotate the tibia — pain suggests meniscal injury.', 'Then lift the leg (distraction) and rotate — pain relief/ligament pain points to ligaments.'],
      ['المريض نايم على بطنه؛ اثنِ الركبة 90° وثبّت الفخذ.', 'اضغط على الكعب لتحت (ضغط) وأدِّر القصبة — الألم يدل على الغضروف.', 'بعدين ارفع الرجل (شد) وأدِّر — لو الألم قل أو ظهر ألم الرباط يبقى الأربطة.'],
      [G(/^Medial meniscus/), G(/^Lateral meniscus/)]],
    'knee|Patellar apprehension': [
      ['Patient supine; knee slightly flexed (~20–30°), quadriceps relaxed.', 'Push the patella laterally with your thumbs.', 'Apprehension or quad contraction to stop the movement = positive (instability).'],
      ['المريض نايم؛ الركبة مثنية شوية (~20–30°) والفخذ الأمامية مسترخية.', 'ادفع الرضفة للخارج بإبهامك.', 'خوف أو انقباض الفخذ الأمامية لمنع الحركة = إيجابي (عدم ثبات).'],
      [G(/^Medial patellar retinaculum/), M(/^Vastus medialis/)]],
    'knee|Ballottement (patellar tap)': [
      ['Patient supine with the knee extended.', 'Milk fluid from the suprapatellar pouch down with one hand.', 'With the other hand tap the patella downward — a floating click against the femur = effusion.'],
      ['المريض نايم والركبة مفرودة.', 'اعصر السائل من الجيب فوق الرضفة لتحت بيد واحدة.', 'باليد التانية اضغط الرضفة لتحت — طقة طافية على الفخذ = وجود سائل.'],
      [G(/^Suprapatellar bursa/), G(/^Knee joint capsule/)]],
    'ankle|Anterior drawer (ankle)': [
      ['Patient seated or supine; ankle in ~20° plantarflexion.', 'Stabilise the distal tibia with one hand; cup the heel with the other.', 'Draw the heel/talus forward and compare with the other ankle — excess laxity or a dimple = ATFL injury.'],
      ['المريض جالس أو نايم؛ الكاحل في ~20° انثناء أخمصي.', 'ثبّت أسفل القصبة بيد وامسك الكعب بالتانية.', 'اسحب الكعب أو الكاحل للأمام وقارن بالكاحل التاني — ارتخاء زائد أو غمازة = إصابة الرباط الشظوي الكاحلي الأمامي.'],
      [G(/\(ATFL\)/)]],
    'ankle|Talar tilt': [
      ['Ankle in neutral (CFL) or slight plantarflexion (ATFL).', 'Stabilise the lower leg; hold the calcaneus.', 'Invert the heel and compare the tilt with the other side.'],
      ['الكاحل في الوضع المحايد (للرباط العقبي الشظوي) أو انثناء أخمصي بسيط.', 'ثبّت أسفل الساق وامسك العقب.', 'اقلب العقب لجوه وقارن مقدار الميل بالجهة التانية.'],
      [G(/\(CFL\)/), G(/\(ATFL\)/)]],
    'ankle|Thompson (calf squeeze)': [
      ['Patient prone with the feet hanging off the table.', 'Squeeze the calf muscle belly firmly.', 'No plantarflexion of the foot = Achilles tendon rupture.'],
      ['المريض نايم على بطنه والقدمين برّا السرير.', 'اعصر بطن السمانة بقوة.', 'لو القدم ما اتحركتش لتحت = قطع في وتر أخيل.'],
      [M(/^Gastrocnemius/), M(/^Soleus/)]],
    'ankle|Squeeze test': [
      ['Patient seated or supine, leg relaxed.', 'Squeeze the tibia and fibula together at mid-calf.', 'Pain at the ankle (distal tibiofibular joint) suggests a syndesmotic (high ankle) sprain.'],
      ['المريض جالس أو نايم والرجل مسترخية.', 'اضغط القصبة والشظية على بعض عند منتصف السمانة.', 'ألم عند الكاحل (المفصل الظنبوبي الشظوي السفلي) يدل على التواء الارتباط العلوي.'],
      [G(/^Anterior tibiofibular/), M(/^Interosseous membrane of leg/)]],
    'ankle|External rotation (Kleiger)': [
      ['Patient seated with the knee flexed 90° and foot relaxed.', 'Stabilise the lower leg; hold the foot in dorsiflexion.', 'Externally rotate the foot — pain at the syndesmosis or deltoid region is positive.'],
      ['المريض جالس والركبة 90° والقدم مسترخية.', 'ثبّت أسفل الساق وامسك القدم في ثني ظهري.', 'أدِّر القدم خارجيًا — ألم عند الارتباط أو الرباط الدالي = إيجابي.'],
      [G(/^Anterior tibiofibular/), G(/^Deltoid ligament/)]],
    'cervical|Distraction test': [
      ['Patient sitting (or supine) with symptoms of radicular arm pain.', 'Grasp under the chin and occiput and apply a gradual upward traction.', 'Relief of the arm symptoms is positive (nerve root compression).'],
      ['المريض جالس (أو نايم) وعنده ألم الذراع الجذري.', 'امسك تحت الذقن والقذال واسحب لفوق بالتدريج.', 'اختفاء أعراض الذراع = إيجابي (ضغط على جذر العصب).'],
      [M(/^Longus colli/), M(/^Semispinalis cervicis/)]],
    'cervical|ULNT 1 (median nerve)': [
      ['Patient supine; depress the shoulder girdle and abduct the arm to ~90°.', 'Add forearm supination, wrist/finger extension and shoulder external rotation, then elbow extension.', 'Add contralateral neck side-flexion; reproduction of symptoms that change with neck movement is positive.'],
      ['المريض نايم؛ نزّل حزام الكتف وبعّد الذراع ~90°.', 'زوّد تقليب الساعد وفرد الرسغ والأصابع وتدوير الكتف خارجيًا ثم فرد المرفق.', 'زوّد ثني العنق للجهة المقابلة؛ ظهور الأعراض وتغيرها مع حركة العنق = إيجابي.'],
      [M(/^Scalenus medius/), M(/^Scalenus anterior/)]],
    'cervical|Cervical flexion–rotation test': [
      ['Patient supine; fully flex the upper neck (chin tuck) to lock lower segments.', 'Rotate the head passively to each side.', 'Normal is ~44° each way; markedly reduced rotation (< ~32°) suggests C1–C2 dysfunction.'],
      ['المريض نايم؛ اثنِ العنق العلوي كامل (ذقن لجوه) لقفل المفاصل السفلية.', 'أدِّر الرأس سلبيًا لكل جهة.', 'الطبيعي حوالي 44° لكل جهة؛ نقص واضح في الدوران يدل على مشكلة C1–C2.'],
      [M(/^Obliquus capitis inferior/), M(/^Rectus capitis posterior major/)]],
    'cervical|Sharp–Purser': [
      ['Patient seated, head flexed slightly (about 10°).', 'Place one palm on the forehead and the thumb of the other hand on the spinous process of C2.', 'Push the head backward while stabilising C2; a clunk or symptom relief suggests atlantoaxial instability.'],
      ['المريض جالس والرأس مثني شوية (~10°).', 'حط كف على الجبهة وإبهام اليد التانية على الناتئ الشوكي لـ C2.', 'ادفع الرأس لورا مع تثبيت C2؛ طقة أو راحة من الأعراض تدل على عدم ثبات الأطلس-المحور.'],
      [G(/^Nuchal ligament/), M(/^Rectus capitis posterior/)]],
    'lumbar|Straight leg raise (Lasègue)': [
      ['Patient supine, both legs relaxed and the knee extended.', 'Passively raise the leg with the knee straight, ankle neutral.', 'Radiating leg pain between about 30° and 70° is positive (sciatic nerve root irritation).'],
      ['المريض نايم على ضهره والرجلين مسترخيتين والركبة مفرودة.', 'ارفع الرجل سلبيًا والركبة مفرودة والكاحل محايد.', 'ألم ممتد للرجل بين حوالي 30° و70° = إيجابي (تهيج جذر العصب الوركي).'],
      [M(/^Biceps femoris/), M(/^Semitendinosus/), M(/^Semimembranosus/)]],
    'lumbar|Crossed SLR': [
      ['Patient supine; perform an SLR on the asymptomatic (good) leg.', 'Raise the good leg until you reach the limit.', 'Reproduction of pain in the opposite (symptomatic) leg is highly specific for a disc herniation.'],
      ['المريض نايم على ضهره؛ اعمل رفع الرجل المفرودة على الرجل السليمة.', 'ارفع الرجل السليمة لحد الحد.', 'ظهور الألم في الرجل التانية (المصابة) محدد جدًا لانزلاق غضروفي.'],
      [M(/^Biceps femoris/), M(/^Semitendinosus/), M(/^Semimembranosus/)]],
    'lumbar|Slump test': [
      ['Patient sits at the table edge with hands behind the back.', 'Add trunk slump, neck flexion, then knee extension and ankle dorsiflexion one at a time.', 'Reproduction of symptoms that ease with neck extension is positive (neural tension).'],
      ['المريض يقعد على حرف السرير وإيده ورا ظهره.', 'زوّد انحناء الجذع وثني العنق ثم فرد الركبة وثني الكاحل ظهريًا واحدة واحدة.', 'ظهور الأعراض وتخفيفها بفرد العنق = إيجابي (شد عصبي).'],
      [M(/^Gastrocnemius/), M(/^Biceps femoris/)]],
    'lumbar|Femoral nerve stretch': [
      ['Patient prone (or side-lying).', 'Flex the knee passively to ~90°; then extend the hip with the knee flexed.', 'Anterior thigh pain (L2–L4) is positive for femoral nerve root irritation.'],
      ['المريض نايم على بطنه (أو على جنبه).', 'اثنِ الركبة سلبيًا لحوالي 90°؛ وبعدين افرد الورك والركبة مثنية.', 'ألم في مقدمة الفخذ (L2–L4) = إيجابي (تهيج جذر العصب الفخذي).'],
      [M(/^Rectus femoris/), M(/^Psoas major/), M(/^Iliacus/)]],
    'lumbar|SIJ provocation cluster': [
      ['Perform several tests: distraction, thigh thrust, compression, sacral thrust and Gaenslen.', 'Each is positive if it reproduces the patient\'s familiar buttock/SIJ pain.', 'Three or more positive tests suggest sacroiliac joint involvement.'],
      ['اعمل عدة اختبارات: شد، دفع الفخذ، ضغط، دفع العجز وجاينسلن.', 'كل اختبار إيجابي لو أعاد الألم المعتاد في الإلية أو المفصل العجزي الحرقفي.', 'ثلاثة اختبارات إيجابية أو أكتر ترجّح أصل في المفصل العجزي الحرقفي.'],
      [G(/^Posterior sacro-iliac/), G(/^Anterior sacro-iliac/), G(/^Sacrotuberous/), M(/^Piriformis/)]],
    "shoulder|Speed's": [
      ['Patient standing; flex the shoulder to 90° with the elbow extended and the forearm supinated.', 'Apply downward resistance at the wrist while the patient holds the position.', 'Pain in the bicipital groove is positive.'],
      ['المريض واقف؛ اثنِ الكتف 90° والمرفق مفرود والساعد متسطّح (كف لفوق).', 'اضغط لتحت عند الرسغ والمريض يقاوم.', 'الألم في الميزاب الثنائي = إيجابي.'],
      [M(/^Biceps brachii/), G(/^Tendon sheath of long head/)]],
    "elbow|Cozen's / Mill's": [
      ['Cozen: patient makes a fist with the elbow flexed 90° and the forearm pronated; extend the wrist against your resistance.', 'Mill: passively pronate the forearm, flex the wrist and extend the elbow.', 'Pain at the lateral epicondyle is positive.'],
      ['كوزن: المريض يقفل إيده والمرفق 90° والساعد مكبوب؛ يفرد الرسغ ضد مقاومتك.', 'ميل: اكبّ الساعد سلبيًا واثنِ الرسغ وافرد المرفق.', 'الألم عند اللقيمة الوحشية = إيجابي.'],
      [M(/^Extensor carpi radialis brevis/), M(/^Extensor digitorum/)]],
    "elbow|Golfer's elbow test": [
      ['Patient supinates the forearm with the elbow flexed.', 'Resist wrist flexion (and pronation) while palpating the medial epicondyle.', 'Pain at the medial epicondyle is positive.'],
      ['المريض يسطّح الساعد والمرفق مثني.', 'قاوم ثني الرسغ (والكب) وإنت بتلمس اللقيمة الإنسية.', 'الألم عند اللقيمة الإنسية = إيجابي.'],
      [M(/^Flexor carpi radialis/), M(/^Pronator teres/)]],
    "wrist|Phalen's": [
      ['Patient flexes both wrists fully, pressing the backs of the hands together.', 'Hold for up to 60 seconds.', 'Tingling/numbness in the thumb, index and middle fingers is positive.'],
      ['المريض يثني الرسغين كاملًا وضهر الإيدين على بعض.', 'اثبت لحد 60 ثانية.', 'تنميل في الإبهام والسبابة والوسطى = إيجابي.'],
      [M(/^Flexor retinaculum of wrist/), M(/^Flexor digitorum superficialis/)]],
    "hip|Ober's": [
      ['Patient side-lying on the unaffected side, bottom hip and knee flexed.', 'Abduct and extend the top hip with the knee flexed 90°.', 'Lower the leg slowly: if it stays above horizontal, the ITB/TFL is tight.'],
      ['المريض نايم على الجنب السليم والورك والركبة السفلية مثنيتين.', 'بعّد وافرد الورك العلوي والركبة 90°.', 'نزّل الرجل ببطء: لو فضلت فوق الأفقي يبقى الشريط الحرقفي أو TFL مشدود.'],
      [M(/^Tensor fasciae latae/), M(/^Iliotibial tract/), M(/^Gluteus medius/)]],
    "cervical|Spurling's": [
      ['Patient seated; side-flex and extend the neck toward the symptomatic side.', 'If no symptoms, apply gentle axial compression through the head.', 'Reproduction of arm pain/paraesthesia is positive (stop immediately).'],
      ['المريض جالس؛ أمِل العنق وافرده ناحية الجهة المصابة.', 'لو مفيش أعراض اضغط بخفة على الرأس لتحت.', 'ظهور ألم أو تنميل في الذراع = إيجابي (وقّف فورًا).'],
      [M(/^Scalenus medius/), M(/^Semispinalis cervicis/)]],
    'lumbar|Modified Schober': [
      ['Patient standing; mark the lumbosacral junction (line between PSISs) and points 10 cm above and 5 cm below.', 'Ask the patient to bend forward fully.', 'Re-measure: an increase of less than ~5 cm (total 20 → <25 cm) suggests reduced lumbar flexion (e.g., ankylosing spondylitis).'],
      ['المريض واقف؛ علّم الوصلة القطنية العجزية (خط بين الشوكتين الخلفيتين) ونقطتين: 10 سم فوق و5 سم تحت.', 'اطلب منه ينحني للأمام لآخر مدى.', 'أعد القياس: زيادة أقل من ~5 سم (من 20 لأقل من 25 سم) تدل على نقص انثناء القطنية (مثل التهاب الفقار اللاصق).'],
      [M(/^Multifidus/), M(/^Iliocostalis lumborum/), G(/^Supraspinous/)]],
  };
  window.TEST_CARDS = TC;

  /* ───────────── UI ───────────── */
  const { S, P, t, esc, name1, $ } = A;
  const ar = () => S.lang === 'ar';
  const T = (en, a) => (ar() ? a : en);
  const sideOK = (e) => e.side !== 'l';
  const uniq = (arr) => { const s = new Set(); return arr.filter((e) => (s.has(e.baseEn) ? false : (s.add(e.baseEn), true))); };
  const findTest = (jid, name) => { const j = (window.JOINTS || []).find((x) => x.id === jid); const i = j ? j.tests.findIndex((x) => x[0] === name) : -1; return i < 0 ? null : { j, x: j.tests[i] }; };
  const related = (jid, name) => {
    const f = findTest(jid, name); const c = TC[jid + '|' + name]; const specs = [];
    if (c) specs.push(...c[2]); if (f && f.x[6]) specs.push(f.x[6]);
    const out = [];
    for (const [sys, rx] of specs) out.push(...uniq(P.filter((e) => e.sys === sys && sideOK(e) && rx.test(e.baseEn))).slice(0, 3));
    return uniq(out);
  };
  A.testBtn = (jid, name) => (TC[jid + '|' + name] ? `<button type="button" class="btn wide" data-act="tcard" data-j="${jid}" data-n="${esc(name)}" style="margin-top:6px">📋 ${T('Test card', 'كارت الاختبار')}</button>` : '');
  function card(jid, name, back) {
    const f = findTest(jid, name), c = TC[jid + '|' + name]; if (!f) return;
    const x = f.x, rel = related(jid, name), steps = ar() ? c[1] : c[0];
    A.modal(() => `<h2>🧪 ${esc(T(x[0], x[1]))}</h2><p class="lead">${esc(T(f.j.en, f.j.ar))} · ${esc(T(x[2], x[3]))}</p>` +
      `<h4>${T('How to perform', 'خطوات الاختبار')}</h4><ol class="tsteps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` +
      `<div class="tpos"><b>✅ ${T('Positive result', 'النتيجة الإيجابية')}</b><div>${esc(T(x[4], x[5]))}</div><div class="tiny">${T('Suggests', 'يدل على')}: ${esc(T(x[2], x[3]))}</div></div>` +
      (rel.length ? `<h4>${T('Related structures', 'التراكيب المرتبطة')}</h4><div class="pills">${rel.map((e) => `<span class="pill2" data-act="goto" data-i="${e.i}">${esc(name1(e))}</span>`).join('')}</div>` +
        `<button type="button" class="btn primary wide" style="margin-top:10px" data-act="tshow" data-j="${jid}" data-n="${esc(name)}">🔍 ${T('Show on the 3D model', 'اعرضهم على المجسم')}</button>` : '') +
      (back ? `<button type="button" class="btn wide" style="margin-top:8px" data-act="tback">‹ ${T('Back', 'رجوع')}</button>` : '') +
      `<p class="tiny">${T('Draft educational content – confirm with your supervisor / current textbooks.', 'محتوى تعليمي مبدئي — راجعه مع المشرف أو المراجع الحديثة.')}</p>`);
    card.back = back || null;
  }
  A.acts.tcard = (el) => { if (!A.isPremium() && !A.FREE_TESTS.has(el.dataset.n)) return A.paywall('All special-test cards are part of Premium. Free: Neer, Lachman, McMurray, SLR and Trendelenburg.', 'كل كروت الاختبارات الخاصة ضمن النسخة المميزة. المجاني: Neer وLachman وMcMurray وSLR وTrendelenburg.'); const prev = A.modalFn; card(el.dataset.j, el.dataset.n, prev); };
  A.acts.tback = () => { if (card.back) A.modal(card.back); else A.closeModal(); };
  A.acts.tshow = async (el) => {
    const rel = related(el.dataset.j, el.dataset.n).filter((e) => !e.lk || A.isPremium());
    if (!rel.length) return A.paywall('Showing these structures on the model is part of Premium.', 'عرض التراكيب دي على المجسم ضمن النسخة المميزة.');
    A.closeModal(); S.sel = -1; A.deselect();
    const need = new Set(rel.map((e) => e.sys));
    for (const s of SYSTEMS) S.layers[s] = need.has(s) ? 'on' : (s === 'bone' ? 'ghost' : 'off');
    for (const s of need) await A.ensure(s); await A.ensure('bone');
    S.region = null; S.iso = -1; S.moveSet = null; S.hl = new Map(rel.map((e) => [e.i, [1, 0.78, 0.18, 0.7]])); S.focus = new Set(rel.map((e) => e.i));
    A.apply(); A.flyToPart(rel[0]);
    const f = findTest(el.dataset.j, el.dataset.n); if (f && A.toast) A.toast('🧪 ' + T(f.x[0], f.x[1]));
  };
  function openList() {
    A.modal(() => {
      let h = `<h2>🧪 ${T('Special test cards', 'كروت الاختبارات الخاصة')}</h2><p class="lead">${T('Steps, positive result and the related structures on the 3D model', 'الخطوات والنتيجة الإيجابية والتراكيب المرتبطة على المجسم')}</p>`;
      for (const j of window.JOINTS || []) {
        const ts = j.tests.filter((x) => TC[j.id + '|' + x[0]]); if (!ts.length) continue;
        h += `<div class="mgroup">${esc(T(j.en, j.ar))}</div><div class="row">` + ts.map((x) => `<button class="opt" data-act="tcard" data-j="${j.id}" data-n="${esc(x[0])}">${!A.isPremium() && !A.FREE_TESTS.has(x[0]) ? '🔒 ' : ''}${esc(T(x[0], x[1]))}</button>`).join('') + '</div>';
      }
      return h;
    });
  }
  A.hubExtra = A.hubExtra || {}; A.hubExtra.tcards = openList;
})();
