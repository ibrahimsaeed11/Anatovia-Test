/* spinal-data.js — myotomes, dermatomes (key sensory points), deep-tendon & superficial reflexes.
   DRAFT educational content from standard textbook tables (ASIA key points, Kendall, Magee). Verify against your course reference.
   ref = ['bone'|'muscle'|'ligament', regex on base English name] to jump into the 3D model. */
'use strict';
window.MYOTOMES = [
  // [level, en, ar, ref]
  ['C1–C2', 'Neck flexion / extension (upper cervical)', 'ثني وبسط الرقبة (العنقية العليا)', ['muscle', /^Longus capitis/]],
  ['C3', 'Neck lateral flexion', 'الميل الجانبي للرقبة', ['muscle', /^Scalenus medius/]],
  ['C4', 'Shoulder elevation (shrug)', 'رفع الكتف', ['muscle', /^Trapezius \(Descending/]],
  ['C5', 'Shoulder abduction', 'تبعيد الكتف', ['muscle', /^Deltoid \(Acromial/]],
  ['C6', 'Elbow flexion / wrist extension', 'ثني المرفق وبسط الرسغ', ['muscle', /^Biceps brachii \(Long/]],
  ['C7', 'Elbow extension / wrist flexion', 'بسط المرفق وثني الرسغ', ['muscle', /^Triceps brachii \(Long/]],
  ['C8', 'Thumb extension / finger flexion', 'بسط الإبهام وثني الأصابع', ['muscle', /^Extensor pollicis longus/]],
  ['T1', 'Finger abduction / adduction', 'تبعيد وتقريب الأصابع', ['muscle', /^Dorsal interossei of hand/]],
  ['L1–L2', 'Hip flexion', 'ثني الورك', ['muscle', /^Psoas major/]],
  ['L3', 'Knee extension', 'بسط الركبة', ['muscle', /^Vastus medialis/]],
  ['L4', 'Ankle dorsiflexion', 'ثني الكاحل الظهري', ['muscle', /^Tibialis anterior/]],
  ['L5', 'Great-toe extension', 'بسط الإبهام (القدم)', ['muscle', /^Extensor hallucis longus/]],
  ['S1', 'Ankle plantarflexion / eversion; hip extension', 'الثني الأخمصي وقلب القدم للخارج وبسط الورك', ['muscle', /^Gastrocnemius \(Medial/]],
  ['S2', 'Knee flexion', 'ثني الركبة', ['muscle', /^Semitendinosus/]],
];

window.DERMATOMES = [
  // [level, key point en, ar, ref]
  ['C2', 'Occipital protuberance (back of head)', 'بروز القذال (خلف الرأس)', ['bone', /^Occipital bone/]],
  ['C3', 'Supraclavicular fossa', 'الحفرة فوق الترقوة', ['bone', /^Clavicle/]],
  ['C4', 'Acromioclavicular joint (top of shoulder)', 'المفصل الأخرمي الترقوي (أعلى الكتف)', ['ligament', /^Acromioclavicular ligament/]],
  ['C5', 'Lateral side of antecubital fossa (lateral arm)', 'الجانب الوحشي لحفرة المرفق', ['bone', /^Humerus/]],
  ['C6', 'Thumb (and lateral forearm)', 'الإبهام (والساعد الوحشي)', ['bone', /^Metacarpal 1/]],
  ['C7', 'Middle finger', 'الإصبع الوسطى', ['bone', /^Metacarpal 3/]],
  ['C8', 'Little finger', 'الخنصر', ['bone', /^Metacarpal 5/]],
  ['T1', 'Medial side of antecubital fossa (medial forearm)', 'الجانب الإنسي لحفرة المرفق', ['bone', /^Ulna/]],
  ['T2', 'Apex of the axilla', 'قمة الإبط', ['bone', /^Rib 2/]],
  ['T4', 'Nipple line (4th intercostal space)', 'مستوى الحلمة (الفراغ الضلعي الرابع)', ['bone', /^Rib 4/]],
  ['T6', 'Xiphoid process', 'الناتئ الرهابي (الخنجري)', ['bone', /^Xiphoid process/]],
  ['T10', 'Umbilicus', 'السرّة', ['bone', /^Thoracic vertebra T10/]],
  ['T12', 'Midpoint of the inguinal ligament', 'منتصف الرباط الأربي', ['bone', /^Thoracic vertebra T12/]],
  ['L1', 'Halfway between T12 and L2 (upper groin / upper thigh)', 'منتصف المسافة بين T12 وL2 (الأربية)', ['bone', /^Lumbar vertebra L1/]],
  ['L2', 'Mid-anterior thigh', 'منتصف الفخذ الأمامي', ['bone', /^Femur/]],
  ['L3', 'Medial femoral condyle (medial knee)', 'اللقمة الفخذية الإنسية (الركبة الإنسية)', ['bone', /^Femur/]],
  ['L4', 'Medial malleolus (medial leg)', 'الكعب الإنسي (الساق الإنسية)', ['bone', /^Tibia/]],
  ['L5', 'Dorsum of the foot at the 3rd metatarsophalangeal joint', 'ظهر القدم عند المفصل المشطي السلامي الثالث', ['bone', /^Metatarsal 3/]],
  ['S1', 'Lateral heel (lateral foot)', 'العقب الوحشي (حافة القدم الوحشية)', ['bone', /^Calcaneus/]],
  ['S2', 'Popliteal fossa (back of knee)', 'الحفرة المأبضية (خلف الركبة)', ['bone', /^Femur/]],
  ['S3', 'Ischial tuberosity', 'الحدبة الإسكية', ['bone', /^Hip bone/]],
  ['S4–S5', 'Perianal area', 'حول فتحة الشرج', ['bone', /^Sacrum/]],
];

window.REFLEXES = [
  // [name en, ar, root, how en, ar, ref]
  ['Biceps jerk', 'منعكس ذات الرأسين', 'C5–C6', 'Strike the examiner\'s thumb placed on the biceps tendon; elbow flexes.', 'ضربة على إبهام الفاحص فوق وتر ذات الرأسين فينثني المرفق.', ['muscle', /^Biceps brachii \(Long/]],
  ['Brachioradialis jerk', 'منعكس العضدية الكعبرية', 'C5–C6', 'Tap the distal radius; slight elbow flexion / forearm supination.', 'نقرة على نهاية الكعبرة فينثني المرفق قليلاً.', ['muscle', /^Brachioradialis/]],
  ['Triceps jerk', 'منعكس ثلاثية الرؤوس', 'C7 (C6–C8)', 'Tap the triceps tendon above the olecranon; elbow extends.', 'نقرة على وتر الثلاثية فوق المرفق فيمتد المرفق.', ['muscle', /^Triceps brachii \(Long/]],
  ['Patellar (knee) jerk', 'منعكس الرضفة (الركبة)', 'L3–L4', 'Tap the patellar tendon; knee extends.', 'نقرة على وتر الرضفة فتمتد الركبة.', ['muscle', /^Rectus femoris/]],
  ['Achilles (ankle) jerk', 'منعكس وتر أخيل (الكاحل)', 'S1 (S1–S2)', 'Tap the Achilles tendon; plantarflexion.', 'نقرة على وتر أخيل فيحدث ثني أخمصي.', ['muscle', /^Soleus/]],
  ['Plantar response (Babinski)', 'استجابة الأخمص (بابنسكي)', 'S1–S2 / UMN', 'Stroke the lateral sole; normal = toes flex. Extensor (up-going) toe = upper motor neuron lesion (normal under ~1–2 years).', 'خدش حافة الأخمص؛ الطبيعي ثني الأصابع. ارتفاع الإبهام علامة إصابة العصبون الحركي العلوي (طبيعي دون السنتين).', ['bone', /^Metatarsal 1/]],
  ['Abdominal reflexes (superficial)', 'المنعكسات البطنية (السطحية)', 'T7–T12', 'Stroke the skin of the abdomen; umbilicus moves toward the stimulus.', 'خدش جلد البطن فتتحرك السرة نحو المنبه.', ['muscle', /^Rectus abdominis/]],
  ['Cremasteric reflex', 'منعكس الخصية (المشمّرة)', 'L1–L2', 'Stroke the inner thigh; testis rises.', 'خدش الفخذ الداخلي فترتفع الخصية.', null],
  ['Jaw jerk', 'منعكس الفك', 'CN V (pons)', 'Tap the chin with the mouth slightly open; jaw closes.', 'نقرة على الذقن والفم نصف مفتوح فيُغلق الفك.', ['muscle', /^Masseter \(Superficial/]],
];
window.REFLEX_GRADES = [
  ['0', 'Absent', 'غائب'], ['1+', 'Diminished (hypo-reflexia)', 'ضعيف'], ['2+', 'Normal', 'طبيعي'], ['3+', 'Brisk (may be normal)', 'نشط (قد يكون طبيعياً)'], ['4+', 'Hyper-reflexia with clonus', 'مفرط مع ارتجاج (كلونس)'],
];
