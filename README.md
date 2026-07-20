# エンジニアの交渉力アーキテクチャ

技術者が持つ論理的思考力とエンジニアリング能力を、ビジネス交渉の場で最大限に活用するための実践ガイドです。

- 公開ページ（GitHub Pages）: [negotiation-for-engineers-book](https://itdojp.github.io/negotiation-for-engineers-book/)
- 目次（リポジトリ内）: `docs/index.md`
- シリーズ: [it-engineer-knowledge-architecture](https://github.com/itdojp/it-engineer-knowledge-architecture)

## 本書の特徴（抜粋）

- エンジニアリング用語（API、デバッグ、パイプライン等）による概念整理
- YAML テンプレート、Markdownログ等の「実装可能な」具体手法
- アジャイル、DevOps、データドリブンの考え方を交渉へ応用

## Phase 6 交渉倫理・合意形成レビューゲート

本書のテンプレートや対話例を実案件へ適用する前に、次を確認してください。

- **自律性**: 相手が断れる選択肢、検討時間、エスカレーション先を残している。
- **透明性**: 事実、推定、希望条件、未確定条件を分けて説明している。
- **権限境界**: 権限外の約束、未承認条件の提示、機密情報の無断利用を行わない。
- **記録**: 合意のDone、責任者、証跡、再確認条件、次回見直し日を残している。

## フィードバック（誤り指摘・改善提案）

誤字脱字、内容の誤り、改善提案は Issues / PR で受け付けます。

## 品質ゲート

- `npm ci`: `package-lock.json` に固定された依存関係をインストールします（Node.js 20 以上を前提）。
- `npm run check:security`: npm 依存関係の既知脆弱性を確認します。
- `npm run check:metadata`: `book-config.json` を基準に、package / Jekyll / トップページ / ナビゲーション / 公開ページ / 必須アセットの整合性を確認します。
- `npm run check:performance-roi`: 性能から粗利・ROIへの換算について、架空値の明示、3 scenario、計算式、Source Notes、source mirrorの整合性を確認します。
- `npm run render:diagrams`: `diagrams/manifest.json` と固定したMermaid sourceから、公開用の静的SVGを再生成します。
- `npm test`: メタデータ、PoC表示、性能・ROIの根拠契約、静的図のaccessibility/再現性、Markdown lint、内部リンクをまとめて確認します。
- `npm run build`: 4点の静的SVGを事前生成してから、`docs/` をJekyll sourceとして公開サイトをビルドし、性能・ROIの根拠契約が生成HTMLにも残ることを確認します。

Book QAの図生成だけは、GitHub-hosted Ubuntuのuser namespace制約に対応するため `diagrams/puppeteer-ci.json` を使います。workflowはread-only権限で、リポジトリにcommit済みの図sourceだけを処理します。ローカル生成ではこの設定を使いません。

## ライセンス

本書は Creative Commons BY-NC-SA 4.0 で提供されています。詳細は `LICENSE.md` を参照してください。
