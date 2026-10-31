تفعيل الحسابات والأكواد (Anatovia) — خطوات مرة واحدة
=====================================================
1) ارفع كل الملفات الجديدة على GitHub (الملفات اللي برا الفولدرات): account.js, firebase-config.js, admin.html, firestore.rules, index.html, study.js, sw.js, style.css

2) في Firebase Console:
   أ) Authentication ← Sign-in method ← فعّل Email/Password (لو مش مفعّل) وفعّل Google كمان (اختار إيميل الدعم = إيميلك).
   ب) Authentication ← Settings ← Authorized domains ← أضف: ibrahimsaeed11.github.io
   ج) Firestore Database ← Rules ← امسح اللي موجود والصق محتوى ملف firestore.rules كله ← Publish
      (لو ظهر خطأ أحمر ابعتلي نصه).

3) افتح: https://ibrahimsaeed11.github.io/Anatovia/admin.html
   ادخل بحساب Google (ibrahim1162006@gmail.com أو anaselbieli@gmail.com) ← ولّد أكواد ← ابعتها للطالب.

4) الطالب: من التطبيق ← دراسة ← الحساب والاشتراك ← يعمل حساب ← يكتب الكود.

ملاحظات:
- كل كود يُستخدم مرة واحدة. الاشتراك مربوط بالحساب، وحد أقصى جهازين.
- لتغيير جهاز لطالب: من admin.html ← المستخدمون ← "صفّر الأجهزة".
- لسه مفيش حاجة اتقفلت: التطبيق كله مجاني. الكود يقدر يسأل A.isPremium() لقفل أي ميزة.
