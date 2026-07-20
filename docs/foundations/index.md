---
title: "交渉の基礎語彙（最小モデル）"
layout: book
order: 2.5
---

# 交渉の基礎語彙（最小モデル）

本書は「交渉を設計可能なプロセス」として扱う。その前提として、最低限の共通語彙を整理しておく。

このページの目的は、交渉理論を網羅することではない。本文と付録のテンプレートを読み解くために必要な語彙を整理し、一般的な定義と本書の運用上の簡略化を区別することである。

## このページでできるようになること

- 「立場（Position）」と「利害（Interest）」を区別して整理できる。
- BATNA（代替案）と最低受容ラインを、交渉準備テンプレートに落とし込める。
- ZOPA（合意可能領域）を意識して、譲歩や条件提示を設計できる。
- 心理的安全性を、快適さや無条件の同意と混同せずに扱える。

## 1. 立場（Position）と利害（Interest）

- **立場（Position）**: 交渉の場で表に出ている要求である。例: 「期限を延ばしてほしい」「予算を増やしてほしい」。
- **利害（Interest）**: 立場の背後にある理由・制約・期待である。例: 「障害リスクを下げたい」「監査に通る状態にしたい」「評価指標を守りたい」。

本書の実務で重要なのは、立場のぶつかり合いから入らず、利害を早い段階で言語化して共有することである。エンジニアであれば「要求（API）」「制約（Contract）」「非機能（NFR）」の整理に近い。

## 2. BATNA（最良の代替案）と最低受容ライン {#batna-and-reservation-line}

交渉では「合意できない場合にどうするか」を事前に決めておく必要がある。

- **BATNA**（Best Alternative to a Negotiated Agreement）: 合意できない場合に実行できる選択肢のうち、最も望ましい代替案である。
  例: 「段階移行が通らないなら、最小構成のハイブリッドで延命する」。
- **最低受容ライン**: 提案とBATNAを比較した結果として、これを下回るなら合意しないと決める境界である。
  例: 「監査要件を満たさない運用は受けない」「24/7オンコールを追加で引き受けるなら人員増が前提」。

BATNA自体は、理想条件、最低受容ライン、最悪ケースのいずれでもない。本書の `batna:` 欄は、複数の実行可能な代替案を比較した結論を一つ記録するための運用上の簡略化である。

一次資料へ直接進む: [Fisher, Ury, Patton, *Getting to Yes*, 3rd ed.（Penguin Books, 2011）](https://www.penguinrandomhouse.com/books/324551/getting-to-yes-by-roger-fisher-and-william-ury/) / [Harvard Program on NegotiationによるBATNAの定義](https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/)

## 3. ZOPA（合意可能領域） {#zopa-boundary}

- **ZOPA**（Zone Of Possible Agreement）: 当事者の最低受容ラインが重なり、双方が不合意より望ましいと判断できる合意候補の範囲である。

相手側の最低受容ラインは通常観測できないため、交渉前のZOPAは確定値ではなく仮説である。ZOPAが見つからないときにスコープ、期限、品質、責任分界、段階化を組み替えるのは、本書の運用上の応用である。条件を増やせば必ずZOPAを作れる、という一般則ではない。

一次資料へ直接進む: [Harvard Program on NegotiationによるZOPAの定義と例](https://www.pon.harvard.edu/daily/business-negotiations/how-to-find-the-zopa-in-business-negotiations/)

## 4. アンカリング（初期提示の作用） {#anchoring-boundary}

不確実な数値を見積もる際、最初に利用できる値を基準にして調整しても、その調整が不十分になり得る現象である。

原典は数値判断に関する記述的知見であり、すべての初期提示が同じ強さで効くことや、相手を操作してよいことを示していない。本書ではアンカーを「強引に押し付ける武器」とせず、外部benchmark、前提、比較軸、幅を同時に開示し、相手が別の基準を提示できる状態を保つ。

一次資料へ直接進む: [Tversky & Kahneman (1974), *Judgment under Uncertainty: Heuristics and Biases*](https://doi.org/10.1126/science.185.4157.1124) / [PubMed書誌情報](https://pubmed.ncbi.nlm.nih.gov/17835457/)

## 5. 譲歩設計（Concession Design）

譲歩は、その場の雰囲気で出すものではない。譲歩するなら、以下を事前に設計する。

- **何を**（スコープ/期限/品質/優先度/責任分界/運用負荷など）
- **どの順番で**（価値の高いカードを先に切らない）
- **どの条件付きで**（条件が満たされない場合のロールバック）

譲歩設計は、第3章「反復的合意形成」と第6章「交渉パイプラインの構築」と強く接続する。

## 6. 合意の定義（Doneの定義）

交渉の合意は「雰囲気」では完了しない。合意の成立条件を、実務上のDoneとして定義しておく。

- 誰が決めるか（意思決定者）
- 何が決まれば完了か（承認範囲）
- どの形式で残すか（議事録/Design Doc/Issue/契約書など）

本書のテンプレートは、このDoneを「文書として再現可能にする」ための補助輪である。

## 7. 交渉倫理と相手の自律性

### 7.1 心理的安全性 {#psychological-safety-boundary}

Edmondson（1999）はチームの心理的安全性を、対人的なリスクを取っても安全だという、チーム成員に共有された信念として定義した。本書ではこの概念を、質問、異論、誤り、分からないことを表明しても、侮辱や報復で応じないという会話上の条件へ限定して用いる。

心理的安全性は、常に快適であること、対立がないこと、提案へ同意すること、品質基準や説明責任を下げることを意味しない。また、一回の会議の反応だけから、個人の心理状態やチーム全体の心理的安全性を診断しない。

一次資料へ直接進む: [Edmondson (1999), *Psychological Safety and Learning Behavior in Work Teams*](https://doi.org/10.2307/2666999)

### 7.2 交渉倫理gate

交渉の目的は、相手を操作することではなく、双方が判断できる材料をそろえて、
合意可能な条件を設計することである。実務では、次の4点を最低限のレビューゲートにする。

- **自律性**: 相手が「受ける/断る/持ち帰る/別案を出す」を選べる状態にする。
- **透明性**: 事実、推定、希望条件、未確定条件を混ぜずに説明する。
- **境界**: 権限外の約束、未承認の価格・納期・品質条件、機密情報の無断利用を避ける。
- **記録**: 合意のDone、責任者、再確認条件、次回見直し日を残す。

このゲートは、[付録：実践ツールキット](../appendices/toolkit/) の
`ethics_review` と `decision_record` に落とし込んで運用する。

## 8. Source Notes：交渉理論と心理的安全性 {#source-notes-negotiation-foundations}

### S-123-N01 BATNA

- **source**: Fisher, R., Ury, W. L., & Patton, B., [*Getting to Yes*, 3rd ed., Penguin Books, 2011, ISBN 9780143118756](https://www.penguinrandomhouse.com/books/324551/getting-to-yes-by-roger-fisher-and-william-ury/)。補助的な公開確認資料として[Harvard Program on NegotiationのBATNA解説](https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/)を使用した。
- **対象版**: *Getting to Yes* 第3版（2011年）と、確認日時点のHarvard Program on Negotiation公開ページ。
- **確認日**: 2026-07-20。
- **支える主張**: BATNAは、不合意時に実行する最良の外部選択肢であり、提示された合意案を評価する基準になる。
- **適用限界**: BATNAと最低受容ラインは同一ではない。実行不能な願望や最悪ケースをBATNAとして記録しない。
- **本文対応**: 第2節、用語集、交渉準備テンプレート。

### S-123-N02 ZOPA

- **source**: [Harvard Program on Negotiation, “How to Find the ZOPA in Business Negotiations”](https://www.pon.harvard.edu/daily/business-negotiations/how-to-find-the-zopa-in-business-negotiations/)、2026-07-09更新版。
- **対象版**: 2026-07-09更新の公開Web版。
- **確認日**: 2026-07-20。
- **支える主張**: ZOPAは、各当事者が不合意より合意を選べる最低受容ラインの重なりである。
- **適用限界**: 相手の最低受容ラインは推定であり、事前のZOPAは仮説である。条件設計で重なりを探索できるが、合意可能領域の成立を保証しない。
- **本文対応**: 第3節、用語集、ケース集。

### S-123-N03 アンカリング

- **source**: [Tversky, A., & Kahneman, D. (1974), “Judgment under Uncertainty: Heuristics and Biases,” *Science*, 185(4157), 1124–1131](https://doi.org/10.1126/science.185.4157.1124)。[PubMed書誌情報](https://pubmed.ncbi.nlm.nih.gov/17835457/)でもDOIとabstractを照合した。
- **対象版**: *Science* 185巻4157号の論文版（DOI `10.1126/science.185.4157.1124`）。
- **確認日**: 2026-07-20。
- **支える主張**: 不確実な数値判断では、初期値からの調整が不十分になり、推定が初期値へ寄る場合がある。
- **適用限界**: 1974年論文の実験から、すべての交渉で同じ効果量が生じるとはいえない。操作的な初期提示を倫理的に正当化しない。
- **本文対応**: 第4節、用語集、交渉倫理gate。

### S-123-N04 心理的安全性

- **source**: [Edmondson, A. (1999), “Psychological Safety and Learning Behavior in Work Teams,” *Administrative Science Quarterly*, 44(2), 350–383](https://doi.org/10.2307/2666999)。
- **対象版**: *Administrative Science Quarterly* 44巻2号の論文版（DOI `10.2307/2666999`）。
- **確認日**: 2026-07-20。
- **対象と方法**: 製造企業の51 work teamを対象としたmultimethod field study。
- **支える主張**: 心理的安全性は、対人的リスクを取っても安全だというチームに共有された信念であり、学習行動との関連が観測された。
- **適用限界**: 因果効果をあらゆる組織へ一般化せず、快適さ、合意、低い基準、個人の心理状態と同一視しない。一回の交渉からチーム全体を診断しない。
- **本文対応**: 第7.1節、用語集、詳細原稿の心理的安全性checklist。

---

次に読む： [用語集](../glossary/) / [第1章：コードは雄弁に語る - 技術的根拠による説得術](../chapter-1/) / [目次（トップ）](../)
