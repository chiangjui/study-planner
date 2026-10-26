-- =====================================================================
-- 課程資料 seed：1151 學年度 資訊一乙（整理自各科課程計畫 PDF）
-- 使用方式：先執行 schema.sql，並在 app 註冊好帳號，再把這份貼到 SQL Editor → Run
--
-- - SQL Editor 沒有「目前登入者」，所以會自動使用 Supabase 裡唯一的帳號
--   （如果有多個帳號會停下來並提示，避免匯入到別人身上）
-- - 如果你已經有課程資料，會直接跳過，不會重複匯入
-- - 節次換算依「中原大學上課節次時間一覽表」：
--   1=08:10 2=09:10 3=10:10 4=11:10 5=13:10 6=14:10 7=15:10 8=16:10
--   F=19:50 G=20:45（每節 50 分鐘）
-- =====================================================================
do $$
declare
  u uuid;  -- 要匯入的使用者
  c uuid;  -- 剛新增的課程 id
begin
  -- 找出唯一的使用者
  if (select count(*) from auth.users) <> 1 then
    raise exception '找到 % 個帳號，請改成指定 Email：把下一行改成 select id into u from auth.users where email = ''你的 Email'';',
      (select count(*) from auth.users);
  end if;
  select id into u from auth.users;

  if exists (select 1 from public.courses where user_id = u) then
    raise notice '已經有課程資料，略過匯入';
    return;
  end if;

  -- -------------------------------------------------------------------
  -- 微積分(上)
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '微積分(上)', '鄭麗雪', 3,
    $j$[
      {"item": "第一次會考", "percent": 28},
      {"item": "第二次會考", "percent": 28},
      {"item": "第三次會考", "percent": 28},
      {"item": "平時成績", "percent": 10},
      {"item": "彈性教學", "percent": 6}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-14", "topic": "The Limit of a Function"},
      {"week": 1, "date": "2026-09-17", "topic": "Calculating Limits Using the Limit Laws"},
      {"week": 2, "date": "2026-09-21", "topic": "Continuity"},
      {"week": 2, "date": "2026-09-24", "topic": "Continuity"},
      {"week": 3, "date": "2026-09-28", "topic": "教師節放假"},
      {"week": 3, "date": "2026-10-01", "topic": "The Derivative as a Function"},
      {"week": 4, "date": "2026-10-05", "topic": "Differentiation Formulas"},
      {"week": 4, "date": "2026-10-08", "topic": "Derivatives of Trigonometric Functions"},
      {"week": 5, "date": "2026-10-12", "topic": "Derivatives of Trigonometric Functions"},
      {"week": 5, "date": "2026-10-15", "topic": "The Chain Rule"},
      {"week": 6, "date": "2026-10-19", "topic": "第一次會考（10/21）"},
      {"week": 6, "date": "2026-10-22", "topic": "第一次會考（10/21）"},
      {"week": 7, "date": "2026-10-26", "topic": "光復節補假"},
      {"week": 7, "date": "2026-10-29", "topic": "Implicit Differentiation"},
      {"week": 8, "date": "2026-11-02", "topic": "Implicit Differentiation"},
      {"week": 8, "date": "2026-11-05", "topic": "Maximum and Minimum Values"},
      {"week": 9, "date": "2026-11-09", "topic": "Maximum and Minimum Values"},
      {"week": 9, "date": "2026-11-12", "topic": "The Mean Value Theorem"},
      {"week": 10, "date": "2026-11-16", "topic": "What Derivatives Tell Us about the Shape of a Graph"},
      {"week": 10, "date": "2026-11-19", "topic": "Limits at Infinity; Horizontal Asymptotes"},
      {"week": 11, "date": "2026-11-23", "topic": "第二次會考（11/25）"},
      {"week": 11, "date": "2026-11-26", "topic": "第二次會考（11/25）"},
      {"week": 12, "date": "2026-11-30", "topic": "Summary of Curve Sketching"},
      {"week": 12, "date": "2026-12-03", "topic": "The Area and Distance Problems"},
      {"week": 13, "date": "2026-12-07", "topic": "The Definite Integral"},
      {"week": 13, "date": "2026-12-10", "topic": "The Fundamental Theorem of Calculus"},
      {"week": 14, "date": "2026-12-14", "topic": "Indefinite Integrals and the Net Change Theorem"},
      {"week": 14, "date": "2026-12-17", "topic": "The Substitution Rule"},
      {"week": 15, "date": "2026-12-21", "topic": "Inverse Function"},
      {"week": 15, "date": "2026-12-24", "topic": "平安夜放假"},
      {"week": 16, "date": "2026-12-28", "topic": "第三次會考（12/30）"},
      {"week": 16, "date": "2026-12-31", "topic": "第三次會考（12/30）"},
      {"week": 17, "date": "2027-01-04", "topic": "彈性授課週：Inverse Trigonometric Functions"},
      {"week": 17, "date": "2027-01-07", "topic": "彈性授課週：Inverse Trigonometric Functions"},
      {"week": 18, "date": "2027-01-11", "topic": "彈性授課週：The Natural Logarithmic Function"},
      {"week": 18, "date": "2027-01-14", "topic": "彈性授課週：The Natural Exponential Function"}
    ]$j$,
    $n$課程代碼 CS050B｜必修
課程網址：i-touch
會考時間（週三 10:30–12:00）：10/21 第一次、11/25 第二次、12/30 第三次
教科書：Calculus, Stewart, 9/E Metric Version（滄海圖書）$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 1, '13:10', '15:00', '5-6', '懷恩201'),
    (u, c, 4, '14:10', '15:00', '6', '教學502');

  -- -------------------------------------------------------------------
  -- 普通物理
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '普通物理', '童若軒', 3,
    $j$[
      {"item": "平時考", "percent": 20},
      {"item": "期中考", "percent": 30},
      {"item": "期末考", "percent": 40},
      {"item": "作業", "percent": 10}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-15", "topic": "位置、速度、加速度；拋體運動 [Ch.2-3]"},
      {"week": 1, "date": "2026-09-17", "topic": "力與動量 [Ch.4-5]"},
      {"week": 2, "date": "2026-09-22", "topic": "功與動能 [Ch.6]"},
      {"week": 2, "date": "2026-09-24", "topic": "位能、能量守恆 [Ch.7]"},
      {"week": 3, "date": "2026-09-29", "topic": "萬有引力 [Ch.8]"},
      {"week": 3, "date": "2026-10-01", "topic": "動量守恆 [Ch.9]、物理運動模擬（作業）"},
      {"week": 4, "date": "2026-10-06", "topic": "物理運動模擬（自主學習，作業）"},
      {"week": 4, "date": "2026-10-08", "topic": "物理運動模擬（自主學習，作業）"},
      {"week": 5, "date": "2026-10-13", "topic": "平時考"},
      {"week": 5, "date": "2026-10-15", "topic": "力矩與角動量 [Ch.10]"},
      {"week": 6, "date": "2026-10-20", "topic": "轉動 [Ch.11]"},
      {"week": 6, "date": "2026-10-22", "topic": "轉動 [Ch.11]"},
      {"week": 7, "date": "2026-10-27", "topic": "狹義相對論 [Ch.33]"},
      {"week": 7, "date": "2026-10-29", "topic": "狹義相對論 [Ch.33]"},
      {"week": 8, "date": "2026-11-03", "topic": "振動 [Ch.13]"},
      {"week": 8, "date": "2026-11-05", "topic": "波動 [Ch.14]"},
      {"week": 9, "date": "2026-11-10", "topic": "期中考"},
      {"week": 9, "date": "2026-11-12", "topic": "期中考試題討論"},
      {"week": 10, "date": "2026-11-17", "topic": "溫度與熱 [Ch.16]"},
      {"week": 10, "date": "2026-11-19", "topic": "理想氣體 [Ch.17]"},
      {"week": 11, "date": "2026-11-24", "topic": "熱力學 [Ch.18]"},
      {"week": 11, "date": "2026-11-26", "topic": "熵 [Ch.19]"},
      {"week": 12, "date": "2026-12-01", "topic": "電荷與電場 [Ch.20-21]"},
      {"week": 12, "date": "2026-12-03", "topic": "電位與電容 [Ch.22-23]"},
      {"week": 13, "date": "2026-12-08", "topic": "電流與電阻 [Ch.24-25]"},
      {"week": 13, "date": "2026-12-10", "topic": "電流與磁場 [Ch.26]"},
      {"week": 14, "date": "2026-12-15", "topic": "法拉第定律與電感 [Ch.27-28]"},
      {"week": 14, "date": "2026-12-17", "topic": "電磁波 [Ch.29]"},
      {"week": 15, "date": "2026-12-22", "topic": "干涉與繞射 [Ch.32]"},
      {"week": 15, "date": "2026-12-24", "topic": "平安感恩日放假"},
      {"week": 16, "date": "2026-12-29", "topic": "光電效應 [Ch.33]"},
      {"week": 16, "date": "2026-12-31", "topic": "物質波 [Ch.34]"},
      {"week": 17, "date": "2027-01-05", "topic": "期末考"},
      {"week": 17, "date": "2027-01-07", "topic": "期末考試題討論"},
      {"week": 18, "date": "2027-01-12", "topic": "近代物理前沿（自主學習）"},
      {"week": 18, "date": "2027-01-14", "topic": "近代物理前沿（自主學習）"}
    ]$j$,
    $n$課程代碼 CS038B｜必修
Email：rstung@cycu.edu.tw｜TA：鄭吉助
辦公室時間：週二、週四 11:00–12:30
課程網址：i-learning
教科書：Essential University Physics Vol.1 & 2, Wolfson, 4th ed.（Pearson）$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 2, '13:10', '15:00', '5-6', '懷恩104'),
    (u, c, 4, '15:10', '16:00', '7', '教學612');

  -- -------------------------------------------------------------------
  -- 線性代數
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '線性代數', '蔡明達', 3,
    $j$[
      {"item": "平時考（段考）", "percent": 60},
      {"item": "期末考", "percent": 35},
      {"item": "問答", "percent": 5}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-17", "topic": "Introduction"},
      {"week": 1, "date": "2026-09-18", "topic": "Vector and Matrix"},
      {"week": 2, "date": "2026-09-24", "topic": "Vector and Matrix"},
      {"week": 2, "date": "2026-09-25", "topic": "放假"},
      {"week": 3, "date": "2026-10-01", "topic": "Vector and Matrix / Linear Equation"},
      {"week": 3, "date": "2026-10-02", "topic": "Linear Equation"},
      {"week": 4, "date": "2026-10-08", "topic": "第一次段考"},
      {"week": 4, "date": "2026-10-09", "topic": "放假"},
      {"week": 5, "date": "2026-10-15", "topic": "Determinant"},
      {"week": 5, "date": "2026-10-16", "topic": "Determinant"},
      {"week": 6, "date": "2026-10-22", "topic": "Euler vector space"},
      {"week": 6, "date": "2026-10-23", "topic": "Euler vector space"},
      {"week": 7, "date": "2026-10-29", "topic": "Euler vector space"},
      {"week": 7, "date": "2026-10-30", "topic": "第二次段考"},
      {"week": 8, "date": "2026-11-05", "topic": "Vector Space and Basis"},
      {"week": 8, "date": "2026-11-06", "topic": "Vector Space and Basis"},
      {"week": 9, "date": "2026-11-12", "topic": "Vector Space and Basis"},
      {"week": 9, "date": "2026-11-13", "topic": "Vector Space and Basis"},
      {"week": 10, "date": "2026-11-19", "topic": "Vector Space and Basis"},
      {"week": 10, "date": "2026-11-20", "topic": "第三次段考"},
      {"week": 11, "date": "2026-11-26", "topic": "Orthogonal Vector Space and Basis"},
      {"week": 11, "date": "2026-11-27", "topic": "Orthogonal Vector Space and Basis"},
      {"week": 12, "date": "2026-12-03", "topic": "Orthogonal Vector Space and Basis"},
      {"week": 12, "date": "2026-12-04", "topic": "第四次段考"},
      {"week": 13, "date": "2026-12-10", "topic": "Linear transformation"},
      {"week": 13, "date": "2026-12-11", "topic": "Linear transformation"},
      {"week": 14, "date": "2026-12-17", "topic": "Linear transformation"},
      {"week": 14, "date": "2026-12-18", "topic": "Linear transformation"},
      {"week": 15, "date": "2026-12-24", "topic": "放假"},
      {"week": 15, "date": "2026-12-25", "topic": "放假"},
      {"week": 16, "date": "2026-12-31", "topic": "Eigenvalue and eigenvector"},
      {"week": 16, "date": "2027-01-01", "topic": "放假"},
      {"week": 17, "date": "2027-01-07", "topic": "Eigenvalue and eigenvector"},
      {"week": 17, "date": "2027-01-08", "topic": "Eigenvalue and eigenvector"},
      {"week": 18, "date": "2027-01-14", "topic": "期末考"},
      {"week": 18, "date": "2027-01-15", "topic": "期末考"}
    ]$j$,
    $n$課程代碼 CS386B｜必修
Email：tsai@ice.cycu.edu.tw
辦公室時間：週四 9:10–10:00（電學209）、週四 15:10–16:00（電學712）
參考書：線性代數，陳福坤（歐亞書局）$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 4, '10:10', '12:00', '3-4', '教學105'),
    (u, c, 5, '13:10', '14:00', '5', '教學105');

  -- -------------------------------------------------------------------
  -- 計算機概論(一)
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '計算機概論(一)', '余執彰', 3,
    $j$[
      {"item": "CAL", "percent": 15},
      {"item": "期中考", "percent": 30},
      {"item": "期末考", "percent": 32},
      {"item": "課堂點名", "percent": 10},
      {"item": "上機", "percent": 13}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-14", "topic": "Preliminary study（實習課）"},
      {"week": 1, "date": "2026-09-17", "topic": "Orientation to programming"},
      {"week": 1, "date": "2026-09-18", "topic": "Orientation to programming"},
      {"week": 2, "date": "2026-09-21", "topic": "Introduction to CAL（實習課）"},
      {"week": 2, "date": "2026-09-24", "topic": "Variable, type, expression, assignment, I/O"},
      {"week": 3, "date": "2026-10-01", "topic": "Conditional and loop (and Boolean expression)"},
      {"week": 3, "date": "2026-10-02", "topic": "Conditional and loop (and Boolean expression)"},
      {"week": 4, "date": "2026-10-05", "topic": "Conditional and loop (and Boolean expression)"},
      {"week": 4, "date": "2026-10-08", "topic": "綜合前面所教的來寫程式"},
      {"week": 5, "date": "2026-10-12", "topic": "CAL（實習課）"},
      {"week": 5, "date": "2026-10-15", "topic": "綜合前面所教的來寫程式"},
      {"week": 5, "date": "2026-10-16", "topic": "綜合前面所教的來寫程式"},
      {"week": 6, "date": "2026-10-19", "topic": "CAL（實習課）"},
      {"week": 6, "date": "2026-10-22", "topic": "C 程式的 compile 流程、以文字模式寫程式的基本概念"},
      {"week": 6, "date": "2026-10-23", "topic": "C 程式的 compile 流程、以文字模式寫程式的基本概念"},
      {"week": 7, "date": "2026-10-29", "topic": "Function, call by value, call by ref., global/local var."},
      {"week": 7, "date": "2026-10-30", "topic": "Function, call by value, call by ref., global/local var."},
      {"week": 8, "date": "2026-11-02", "topic": "CAL（實習課）"},
      {"week": 8, "date": "2026-11-05", "topic": "More on the use of functions in programming"},
      {"week": 8, "date": "2026-11-06", "topic": "More on the use of functions in programming"},
      {"week": 9, "date": "2026-11-09", "topic": "期中考試週"},
      {"week": 9, "date": "2026-11-12", "topic": "期中考試週"},
      {"week": 9, "date": "2026-11-13", "topic": "期中考試週"},
      {"week": 10, "date": "2026-11-16", "topic": "CAL（實習課）"},
      {"week": 10, "date": "2026-11-19", "topic": "Array and how to use it"},
      {"week": 10, "date": "2026-11-20", "topic": "Array and how to use it"},
      {"week": 11, "date": "2026-11-23", "topic": "CAL（實習課）"},
      {"week": 11, "date": "2026-11-26", "topic": "More on array"},
      {"week": 11, "date": "2026-11-27", "topic": "More on array"},
      {"week": 12, "date": "2026-11-30", "topic": "CAL（實習課）"},
      {"week": 12, "date": "2026-12-03", "topic": "Array, C-style string"},
      {"week": 12, "date": "2026-12-04", "topic": "Array, C-style string"},
      {"week": 13, "date": "2026-12-07", "topic": "CAL（實習課）"},
      {"week": 13, "date": "2026-12-10", "topic": "使用自製指令與自製型別來寫程式"},
      {"week": 13, "date": "2026-12-11", "topic": "使用自製指令與自製型別來寫程式"},
      {"week": 14, "date": "2026-12-14", "topic": "CAL（實習課）"},
      {"week": 14, "date": "2026-12-17", "topic": "Top-down design and stepwise refinement"},
      {"week": 14, "date": "2026-12-18", "topic": "Top-down design and stepwise refinement"},
      {"week": 15, "date": "2026-12-21", "topic": "CAL（實習課）"},
      {"week": 16, "date": "2026-12-28", "topic": "期末考"},
      {"week": 16, "date": "2026-12-31", "topic": "期末考"},
      {"week": 16, "date": "2027-01-01", "topic": "期末考"},
      {"week": 17, "date": "2027-01-04", "topic": "Final project（實習課）"},
      {"week": 17, "date": "2027-01-07", "topic": "Final project"},
      {"week": 17, "date": "2027-01-08", "topic": "Final project"},
      {"week": 18, "date": "2027-01-11", "topic": "學期考試週：Final project"},
      {"week": 18, "date": "2027-01-14", "topic": "學期考試週：Final project"},
      {"week": 18, "date": "2027-01-15", "topic": "學期考試週：Final project"}
    ]$j$,
    $n$課程代碼 CS240B｜必修
Email：ccyu@cycu.edu.tw｜TA：劉芷妘、彭妍嘉
辦公室時間：週一 13:00–16:00
課程網址：https://cycu-cal.tw
週一 F-G 實習課於管理101、102教室聯播
參考書：C How to Program, 9th edition$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 1, '19:50', '21:35', 'F-G', '管理102'),
    (u, c, 4, '08:10', '10:00', '1-2', '教學505'),
    (u, c, 5, '14:10', '15:00', '6', '教學505');

  -- -------------------------------------------------------------------
  -- 嵌入式系統實驗(一)
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '嵌入式系統實驗(一)', '莊秀敏', 1,
    $j$[
      {"item": "實驗", "percent": 70},
      {"item": "期中考", "percent": 10},
      {"item": "期末考", "percent": 10},
      {"item": "課堂參與", "percent": 10}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-16", "topic": "Raspberry Pi 2 Overview / Lab 1: Raspberry Pi 2 Setup"},
      {"week": 2, "date": "2026-09-23", "topic": "Orientation"},
      {"week": 3, "date": "2026-09-30", "topic": "Raspberry Pi 2 HW/SW Application and Expansion / Lab 2: SW Application Installation and Usage"},
      {"week": 4, "date": "2026-10-07", "topic": "Web Server Overview"},
      {"week": 5, "date": "2026-10-14", "topic": "Lab 3: Web server installation"},
      {"week": 6, "date": "2026-10-21", "topic": "Mail Server Overview / Lab 4: Mail server installation"},
      {"week": 7, "date": "2026-10-28", "topic": "Web Server and Mail Server Revisit"},
      {"week": 8, "date": "2026-11-04", "topic": "Fundamental Electrical Components and Circuits"},
      {"week": 9, "date": "2026-11-11", "topic": "期中考"},
      {"week": 10, "date": "2026-11-18", "topic": "Lab 5: GPIO Application - Fundamentals and Digital I/O"},
      {"week": 11, "date": "2026-11-25", "topic": "Lab 6: GPIO Application - Analog I/O"},
      {"week": 12, "date": "2026-12-02", "topic": "Brainstorming"},
      {"week": 13, "date": "2026-12-09", "topic": "Media Server / Lab 8: Media Server Installation"},
      {"week": 14, "date": "2026-12-16", "topic": "Media Service Storage / Lab 9: Media Service Storage Installation"},
      {"week": 15, "date": "2026-12-23", "topic": "Embedded System Case Study"},
      {"week": 16, "date": "2026-12-30", "topic": "彈性教學週：Project data collection"},
      {"week": 17, "date": "2027-01-06", "topic": "期末考週：Project Proposal Presentation"},
      {"week": 18, "date": "2027-01-13", "topic": "期末考週：Project Proposal Presentation"}
    ]$j$,
    $n$課程代碼 CS111B｜必修
Email：showmin@cycu.edu.tw
辦公室時間：週三 10:00–14:00
課程網址：i-learning.cycu.edu.tw
教科書：Raspberry Pi 嵌入式系統入門與應用實作，張元翔（碁峰）$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 3, '08:10', '10:00', '1-2', '教學105');

  -- -------------------------------------------------------------------
  -- 自然科學與人工智慧導論
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '自然科學與人工智慧導論', '莊秀敏', 2,
    $j$[
      {"item": "實驗", "percent": 20},
      {"item": "平時報告", "percent": 25},
      {"item": "期中考", "percent": 20},
      {"item": "期末報告", "percent": 25},
      {"item": "課程參與", "percent": 10}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-14", "topic": "AI 與自然科學的邂逅"},
      {"week": 2, "date": "2026-09-21", "topic": "Python 與 Colab 快速入門"},
      {"week": 3, "date": "2026-09-28", "topic": "教師節放假"},
      {"week": 4, "date": "2026-10-05", "topic": "AI 與科學資料：如何蒐集與處理"},
      {"week": 5, "date": "2026-10-12", "topic": "機器學習入門與科學應用範例"},
      {"week": 6, "date": "2026-10-19", "topic": "非監督學習與資料探索"},
      {"week": 7, "date": "2026-10-26", "topic": "光復節補假"},
      {"week": 8, "date": "2026-11-02", "topic": "深度學習簡介與模型觀察"},
      {"week": 9, "date": "2026-11-09", "topic": "期中考"},
      {"week": 10, "date": "2026-11-16", "topic": "科學與 AI 的科技倫理與永續發展"},
      {"week": 11, "date": "2026-11-23", "topic": "AI 與氣候：預測、能源、環保"},
      {"week": 12, "date": "2026-11-30", "topic": "AI 與物理：感測、辨識、智慧生活"},
      {"week": 13, "date": "2026-12-07", "topic": "AI 與化學：新藥研發、食品安全"},
      {"week": 14, "date": "2026-12-14", "topic": "AI 與生物：醫療診斷、公共衛生"},
      {"week": 15, "date": "2026-12-21", "topic": "AI 與地球科學：地震監測、海洋探測"},
      {"week": 16, "date": "2026-12-28", "topic": "彈性教學週：期末報告資料蒐集準備"},
      {"week": 17, "date": "2027-01-04", "topic": "期末小專題報告 I"},
      {"week": 18, "date": "2027-01-11", "topic": "期末小專題報告 II"}
    ]$j$,
    $n$課程代碼 CS000B｜必修
Email：showmin@cycu.edu.tw
辦公室時間：週三 10:00–14:00
需自備筆電（Python 練習）
教材：自編教材$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 1, '10:10', '12:00', '3-4', '教學412');

  -- -------------------------------------------------------------------
  -- 文學經典閱讀
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '文學經典閱讀', '林菁菁', 2,
    $j$[
      {"item": "平時作業", "percent": 40},
      {"item": "期中作業", "percent": 30},
      {"item": "期末測驗", "percent": 30}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-16", "topic": "課程與評分說明；何謂小說、小說特質與美感"},
      {"week": 2, "date": "2026-09-23", "topic": "小說所關懷的生命議題；小說重要概念：情節、人物、主題"},
      {"week": 3, "date": "2026-09-30", "topic": "古典小說的歷史；小說重要概念：情節、人物、主題"},
      {"week": 4, "date": "2026-10-07", "topic": "單元一 魏晉六朝小說：談生、陽羨書生、宗定伯故事"},
      {"week": 5, "date": "2026-10-14", "topic": "單元一 魏晉六朝小說：談生、陽羨書生、宗定伯故事"},
      {"week": 6, "date": "2026-10-21", "topic": "單元二 唐傳奇：〈霍小玉傳〉〈李娃傳〉"},
      {"week": 7, "date": "2026-10-28", "topic": "單元二 唐傳奇：〈霍小玉傳〉〈李娃傳〉"},
      {"week": 8, "date": "2026-11-04", "topic": "單元二 唐代武俠小說：〈聶隱娘〉〈崑崙奴〉"},
      {"week": 9, "date": "2026-11-11", "topic": "期中考試週（作業）"},
      {"week": 10, "date": "2026-11-18", "topic": "單元四 明清小說：曹雪芹與紅樓夢、故事設定與神話結構"},
      {"week": 11, "date": "2026-11-25", "topic": "紅樓夢導讀：第一回 甄士隱夢幻識通靈"},
      {"week": 12, "date": "2026-12-02", "topic": "紅樓夢導讀：第一回 甄士隱夢幻識通靈"},
      {"week": 13, "date": "2026-12-09", "topic": "紅樓怎麼寫人物：第三回 林黛玉拋父進京都"},
      {"week": 14, "date": "2026-12-16", "topic": "紅樓怎麼寫人物：第三回 林黛玉拋父進京都"},
      {"week": 15, "date": "2026-12-23", "topic": "紅樓夢的兩個世界：第十七、十八回 大觀園試才題對額"},
      {"week": 16, "date": "2026-12-30", "topic": "紅樓夢的貴公子生活：第二十八回 蔣玉涵情贈茜香羅"},
      {"week": 17, "date": "2027-01-06", "topic": "單元五 唐詩選讀：李白與杜甫"},
      {"week": 18, "date": "2027-01-13", "topic": "學期考試週（期末考）"}
    ]$j$,
    $n$課程代碼 CS701B｜必修
Email：lin32455@gmail.com
辦公室時間：週一至週三 9:00–12:00
參考書：閱讀策略神文本（曾陽晴主編，五南）
上課請勿飲食、請勿穿拖鞋$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 3, '15:10', '17:00', '7-8', '懷恩101');

  -- -------------------------------------------------------------------
  -- 體育一
  -- -------------------------------------------------------------------
  insert into public.courses (user_id, name, teacher, credits, grading, weekly_topics, notes)
  values (u, '體育一', '吳明城', 0,
    $j$[
      {"item": "出席勤惰及學習態度", "percent": 30},
      {"item": "術科測驗", "percent": 40},
      {"item": "運動參與及學習精神（運動會）", "percent": 20},
      {"item": "課堂表現及彈性學習", "percent": 10}
    ]$j$,
    $j$[
      {"week": 1, "date": "2026-09-18", "topic": "課程介紹、交通安全教育宣導、大隊接力練習"},
      {"week": 2, "date": "2026-09-25", "topic": "中秋節放假"},
      {"week": 3, "date": "2026-10-02", "topic": "體能訓練／越野跑步、大隊接力練習"},
      {"week": 4, "date": "2026-10-09", "topic": "國慶日補假"},
      {"week": 5, "date": "2026-10-16", "topic": "運動會（需出席並點名）"},
      {"week": 6, "date": "2026-10-23", "topic": "測驗 800m / 1600m"},
      {"week": 7, "date": "2026-10-30", "topic": "籃球"},
      {"week": 8, "date": "2026-11-06", "topic": "籃球"},
      {"week": 9, "date": "2026-11-13", "topic": "期中考補考週"},
      {"week": 10, "date": "2026-11-20", "topic": "200 公尺測驗"},
      {"week": 11, "date": "2026-11-27", "topic": "籃球測驗"},
      {"week": 12, "date": "2026-12-04", "topic": "體育週、傷害講座"},
      {"week": 13, "date": "2026-12-11", "topic": "排球、身體核心活動訓練"},
      {"week": 14, "date": "2026-12-18", "topic": "肌力訓練（健身房）"},
      {"week": 15, "date": "2026-12-25", "topic": "行憲紀念日放假"},
      {"week": 16, "date": "2027-01-01", "topic": "開國紀念日放假"},
      {"week": 17, "date": "2027-01-08", "topic": "補考"},
      {"week": 18, "date": "2027-01-15", "topic": "期末考週補考週"}
    ]$j$,
    $n$課程代碼 CS945B｜必修
Email：minchen@cycu.edu.tw
辦公室時間：週四 10:00–12:00、週五 13:00–15:00
教室尚未安排：第一堂至體育館門口集合，之後依老師規定地點
請穿運動鞋、運動服；館內禁止飲食（水除外）$n$)
  returning id into c;
  insert into public.course_schedules (user_id, course_id, weekday, start_time, end_time, period_label, room) values
    (u, c, 5, '10:10', '12:00', '3-4', '體育館');

  raise notice '匯入完成：8 門課程';
end $$;
