// ============================================================
//  Salesforce Learning Map — アンカーノード(骨格)
//  製品(product) / 職種(role) / 資格(cert) / 概念(concept)
//  トピックノードは data/topics.js（Fable 5 生成）から結合される
// ============================================================
window.SFMAP_ANCHORS = [

  /* ========== 製品 (product) ========== */
  { id:'prod-platform', label:'Salesforce Platform', type:'product', category:'platform',
    summary:'すべての土台。宣言的開発とApex/LWCを載せるアプリ基盤。',
    tags:['platform','metadata','lightning'],
    detail:`## 概要
Lightning Platform（旧Force.com）はSalesforceの全製品が動くマルチテナント型のPaaS。オブジェクト・項目・自動化・UI・セキュリティをメタデータとして宣言的に定義でき、必要に応じてApex/LWCでコードによる拡張ができる。
## なぜ学ぶのか
Sales/Service/Marketingなどどのクラウドを扱うにせよ、この共通基盤の理解が全スキルの前提になる。データモデル・セキュリティ・自動化はここに集約される。
## 主要トピック
- メタデータ駆動アーキテクチャ / マルチテナント
- オブジェクト・項目・リレーション
- 宣言的自動化(フロー)とプログラム的拡張(Apex/LWC)
- ガバナ制限という制約の中で設計する思想
## おすすめリソース
Trailhead「Platform Development Basics」「Salesforce Platform Basics」`,
    links:[{to:'concept-data-model',rel:'含む'},{to:'concept-security',rel:'含む'},{to:'concept-automation',rel:'含む'},{to:'concept-governor-limits',rel:'制約'}] },

  { id:'prod-sales-cloud', label:'Sales Cloud', type:'product', category:'cloud',
    summary:'リード〜商談〜売上予測まで、営業活動を支えるCRM。',
    tags:['sales','crm'],
    detail:`## 概要
営業組織向けの中核CRM。見込み客(リード)の獲得から商談化、受注、売上予測までのパイプラインを管理する。
## なぜ学ぶのか
最も導入例が多く、コンサル・管理者の需要が高い。標準機能だけで営業DXの大部分を実現できる。
## 主要トピック
- リード / 取引先 / 取引先責任者 / 商談
- 商品・価格表・見積 / 売上予測
- セールスパス・セールスエンゲージメント・キャンペーン
## おすすめリソース
Trailhead「Sales Cloud」モジュール、Sales Cloud Consultant試験ガイド`,
    links:[{to:'concept-data-model',rel:'活用'},{to:'concept-automation',rel:'活用'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'prod-service-cloud', label:'Service Cloud', type:'product', category:'cloud',
    summary:'ケース・ナレッジ・オムニチャネルでカスタマーサポートを実現。',
    tags:['service','support','crm'],
    detail:`## 概要
カスタマーサポート/コンタクトセンター向けクラウド。問い合わせをケースとして一元管理し、メール・電話・チャット・SNSを横断して対応する。
## なぜ学ぶのか
サポート業務のDX需要が高く、Omni-ChannelやAIチャットボット(Agentforce)との連携で拡張性が大きい。
## 主要トピック
- ケース管理・自動割り当て・エスカレーション
- ナレッジ・エンタイトルメント・マイルストーン
- Omni-Channel・サービスコンソール・CTI/音声
## おすすめリソース
Trailhead「Service Cloud」、Service Cloud Consultant試験ガイド`,
    links:[{to:'concept-automation',rel:'活用'},{to:'prod-agentforce',rel:'連携'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'prod-marketing-cloud', label:'Marketing Cloud / Account Engagement', type:'product', category:'cloud',
    summary:'B2C(MC)とB2B(Account Engagement)のマーケ自動化基盤。',
    tags:['marketing','automation','email'],
    detail:`## 概要
デジタルマーケティングのプラットフォーム。B2C向けの Marketing Cloud（Email/Journey/Automation Studio）と、B2B向けの Account Engagement（旧Pardot）に大別される。
## なぜ学ぶのか
メール・ジャーニー・スコアリングによるナーチャリングを自動化でき、専門職(マーケター)としてのキャリアが確立している。
## 主要トピック
- Account Engagement: プロスペクト・エンゲージメントスタジオ・スコアリング/グレーディング
- Marketing Cloud: Email Studio・Journey Builder・AMPscript・データエクステンション
## おすすめリソース
Trailhead「Marketing Cloud」「Pardot」、各Specialist試験ガイド`,
    links:[{to:'concept-automation',rel:'活用'},{to:'concept-data-management',rel:'活用'},{to:'role-marketer',rel:'対象職種'}] },

  { id:'prod-experience-cloud', label:'Experience Cloud', type:'product', category:'cloud',
    summary:'ポータル・コミュニティ・Webサイトをノーコードで構築。',
    tags:['experience','portal','web'],
    detail:`## 概要
顧客・パートナー・従業員向けのポータルやコミュニティ、公開Webサイトを構築するCMS/サイトビルダー。CRMデータを外部に安全に露出できる。
## なぜ学ぶのか
セルフサービスポータルやパートナーサイトの需要が高く、共有・可視性設計と組み合わせる実践的スキルが身につく。
## 主要トピック
- エクスペリエンスサイト構築・LWRテンプレート・CMS
- ゲスト/認証ユーザーのアクセス制御・公開グループ
## おすすめリソース
Trailhead「Experience Cloud」、Experience Cloud Consultant試験ガイド`,
    links:[{to:'concept-security',rel:'重要'},{to:'concept-ux',rel:'活用'},{to:'prod-platform',rel:'基盤'}] },

  { id:'prod-commerce-cloud', label:'Commerce Cloud', type:'product', category:'cloud',
    summary:'B2C/B2Bのeコマースサイトを構築・運用する。',
    tags:['commerce','ecommerce'],
    detail:`## 概要
オンラインストアフロントを構築するeコマース基盤。B2C Commerce と B2B Commerce があり、カタログ・カート・チェックアウトを提供する。
## なぜ学ぶのか
EC需要の拡大で専門人材が不足。CRM/マーケとの統合で顧客体験を一気通貫にできる。
## 主要トピック
- カタログ・カート・チェックアウトフロー
- 価格・プロモーション・在庫
## おすすめリソース
Trailhead「B2B Commerce」「B2C Commerce」`,
    links:[{to:'prod-marketing-cloud',rel:'連携'},{to:'concept-integration',rel:'活用'}] },

  { id:'prod-data-cloud', label:'Data Cloud', type:'product', category:'data',
    summary:'全チャネルの顧客データを統合するCDP。AIとセグメントの燃料。',
    tags:['data-cloud','cdp','data'],
    detail:`## 概要
あらゆるソースの顧客データをリアルタイムに取り込み、統合・正規化してひとつの顧客像(Unified Profile)を作るCustomer Data Platform。AgentforceやAIの土台になる。
## なぜ学ぶのか
AI活用の前提となる「良質な統合データ」を担う中核。近年最も注目される新領域でキャリア価値が高い。
## 主要トピック
- データストリーム・DLO/DMO・ID解決
- 計算指標・セグメント・アクティベーション
## おすすめリソース
Trailhead「Data Cloud」、Data Cloud Consultant試験ガイド`,
    links:[{to:'concept-data-management',rel:'中核'},{to:'prod-agentforce',rel:'土台'},{to:'concept-ai',rel:'土台'}] },

  { id:'prod-agentforce', label:'Agentforce / Einstein AI', type:'product', category:'ai',
    summary:'自律型AIエージェントと予測・生成AIをCRMに統合。',
    tags:['ai','agentforce','einstein'],
    detail:`## 概要
SalesforceのAIレイヤー。予測AI(Einstein)、生成AI(Prompt Builder/Copilot)、そして自律的にタスクを遂行するAIエージェント(Agentforce)を提供する。
## なぜ学ぶのか
2024年以降の最重要トレンド。Agent Builder/Prompt Builderのスキルは今後の管理者・開発者に必須化していく。
## 主要トピック
- Agentforce(自律型エージェント)・Agent Builder
- Prompt Builder・Einstein Copilot・Trust Layer
- Prediction Builder・Next Best Action・Einstein Bots
## おすすめリソース
Trailhead「Agentforce」「Einstein」、AI Specialist試験ガイド`,
    links:[{to:'concept-ai',rel:'中核'},{to:'prod-data-cloud',rel:'依存'},{to:'concept-security',rel:'Trust Layer'}] },

  { id:'prod-tableau', label:'Tableau / CRM Analytics', type:'product', category:'analytics',
    summary:'高度なBI・可視化。CRMデータを深く分析する。',
    tags:['analytics','bi','tableau'],
    detail:`## 概要
Salesforce傘下のBIプラットフォーム。CRM Analytics(旧Tableau CRM)はSalesforce内蔵の分析基盤、Tableauは全社横断のセルフサービスBI。
## なぜ学ぶのか
標準レポートを超えた高度な分析・予測可視化の需要が高い。データアナリスト職への入口。
## 主要トピック
- データセット・レンズ・ダッシュボード
- データフロー・SAQL・Tableau連携
## おすすめリソース
Trailhead「CRM Analytics」「Tableau」`,
    links:[{to:'concept-analytics',rel:'中核'},{to:'role-data-analyst',rel:'対象職種'}] },

  { id:'prod-mulesoft', label:'MuleSoft', type:'product', category:'integration',
    summary:'API主導で外部システムを接続する統合プラットフォーム。',
    tags:['integration','api','mulesoft'],
    detail:`## 概要
API-led connectivityの考え方で、Salesforceと基幹・外部システムを繋ぐ統合基盤(Anypoint Platform)。
## なぜ学ぶのか
大規模導入では必ず外部連携が発生する。統合アーキテクトを目指すなら統合パターンの理解が不可欠。
## 主要トピック
- Anypoint Platform・API主導接続
- System/Process/Experience APIの3層
## おすすめリソース
Trailhead「MuleSoft」、MuleSoft認定`,
    links:[{to:'concept-integration',rel:'中核'},{to:'cert-integration-architect',rel:'関連資格'}] },

  { id:'prod-slack', label:'Slack', type:'product', category:'collaboration',
    summary:'業務の中心となるコラボハブ。CRMと連携し自動化。',
    tags:['slack','collaboration'],
    detail:`## 概要
Salesforce傘下のビジネスチャット。SlackアプリやワークフロービルダーでCRMプロセスをチャット上に統合できる(Digital HQ)。
## なぜ学ぶのか
承認・通知・営業連携をSlack上で完結でき、CRM活用の定着率を上げる。
## 主要トピック
- Slackワークフロービルダー
- Salesforce for Slack連携
## おすすめリソース
Trailhead「Slack」`,
    links:[{to:'prod-sales-cloud',rel:'連携'},{to:'concept-automation',rel:'活用'}] },

  { id:'prod-field-service', label:'Field Service', type:'product', category:'cloud',
    summary:'訪問・保守など現場作業のスケジューリングを最適化。',
    tags:['field-service','service'],
    detail:`## 概要
現場作業員の派遣・スケジューリングを管理するService Cloudの拡張。作業指示・リソース・最適化エンジン・モバイルアプリで構成。
## なぜ学ぶのか
保守・設備・訪問サービス業のDXで需要が高い専門領域。
## 主要トピック
- 作業指示(Work Order)・サービスリソース
- ディスパッチャーコンソール・スケジュール最適化・FSモバイル
## おすすめリソース
Trailhead「Field Service」、Field Service Consultant試験ガイド`,
    links:[{to:'prod-service-cloud',rel:'拡張'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'prod-revenue-cloud', label:'Revenue Cloud / CPQ', type:'product', category:'cloud',
    summary:'見積〜請求(Quote to Cash)を自動化・正確化する。',
    tags:['cpq','revenue','billing'],
    detail:`## 概要
複雑な製品構成・価格・見積・契約・請求を自動化するCPQ(Configure Price Quote)とBilling。見積の正確性とスピードを両立する。
## なぜ学ぶのか
複雑な価格体系を持つ企業で導入が進み、CPQスペシャリストは高単価。
## 主要トピック
- 製品バンドル・価格ルール・割引スケジュール
- 見積-現金化(Quote to Cash)・サブスクリプション・更新
## おすすめリソース
Trailhead「Salesforce CPQ」、CPQ Specialist試験ガイド`,
    links:[{to:'prod-sales-cloud',rel:'拡張'},{to:'cert-cpq-specialist',rel:'関連資格'}] },

  { id:'prod-industries', label:'Industries / OmniStudio', type:'product', category:'cloud',
    summary:'業種特化クラウドとOmniStudioによる高速UI構築。',
    tags:['industries','omnistudio'],
    detail:`## 概要
金融・通信・公共・ヘルスケアなど業種別に最適化されたIndustriesクラウドとローコードUIツールOmniStudio(OmniScript/FlexCard/DataRaptor)。
## なぜ学ぶのか
業種特化の大型案件が増加。OmniStudio開発者の需要が高い。
## 主要トピック
- OmniScript・FlexCard・DataRaptor・Integration Procedure
- 業種別データモデル
## おすすめリソース
Trailhead「OmniStudio」、OmniStudio Developer試験ガイド`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'cert-omnistudio-developer',rel:'関連資格'}] },

  { id:'prod-nonprofit', label:'Nonprofit Cloud', type:'product', category:'cloud',
    summary:'NPO向けの寄付・プログラム管理テンプレート。',
    tags:['nonprofit'],
    detail:`## 概要
非営利団体向けの業種クラウド。寄付・助成金・プログラム・ボランティア管理をテンプレート化。
## なぜ学ぶのか
社会的インパクト領域でのCRM活用。NPO/NGOのDX需要。
## 主要トピック
- 寄付・助成金管理 / プログラム管理
## おすすめリソース
Trailhead「Nonprofit Cloud」`,
    links:[{to:'prod-platform',rel:'基盤'}] },

  /* ========== 職種 (role) ========== */
  { id:'role-admin', label:'管理者 (Administrator)', type:'role', category:'role',
    summary:'ノーコードで組織を設定・維持する最重要ロール。学習の出発点。',
    tags:['admin','declarative'],
    detail:`## 概要
ユーザー管理・セキュリティ・データ・自動化・レポートを設定でSalesforceを運用する要。すべての学習者の出発点。
## キャリアの位置づけ
最初に取得すべき「Administrator」認定から、Advanced Administratorへ。ここからConsultant/Developer/Architectに分岐する。
## 身につけるべき力
- データモデル設計・セキュリティ(プロファイル/権限セット/共有)
- フローによる自動化・レポート/ダッシュボード
## 推奨資格
Associate → Administrator → Advanced Administrator`,
    links:[{to:'cert-admin',rel:'目標資格'},{to:'cert-advanced-admin',rel:'次資格'},{to:'concept-declarative',rel:'中核スキル'}] },

  { id:'role-platform-app-builder', label:'アプリビルダー', type:'role', category:'role',
    summary:'宣言的にアプリを設計・構築するローコード開発者。',
    tags:['app-builder','declarative'],
    detail:`## 概要
コードを書かずにカスタムアプリ(データモデル・UI・自動化)を設計する役割。管理者の一歩先。
## 推奨資格
Platform App Builder。管理者資格とセットで取得すると強い。
## 身につけるべき力
- オブジェクト設計・Lightningアプリビルダー・動的フォーム
- フロー・数式・プロセス自動化`,
    links:[{to:'cert-app-builder',rel:'目標資格'},{to:'concept-declarative',rel:'中核スキル'},{to:'concept-data-model',rel:'中核スキル'}] },

  { id:'role-developer', label:'開発者 (Developer)', type:'role', category:'role',
    summary:'Apex/LWCでプラットフォームを拡張するプログラマ。',
    tags:['developer','apex','lwc'],
    detail:`## 概要
宣言的機能で足りない部分をApex(サーバー)とLWC(UI)で実装する。テスト・ガバナ制限・セキュアコーディングが必須。
## 推奨資格
Platform Developer I → Platform Developer II / JavaScript Developer I
## 身につけるべき力
- Apex(SOQL/DML/非同期/テスト)・LWC・外部連携`,
    links:[{to:'cert-pd1',rel:'目標資格'},{to:'cert-pd2',rel:'次資格'},{to:'concept-programmatic',rel:'中核スキル'},{to:'concept-governor-limits',rel:'必須知識'}] },

  { id:'role-architect', label:'アーキテクト (Architect)', type:'role', category:'role',
    summary:'大規模設計・非機能要件・統合を統括する上級ロール。',
    tags:['architect','design'],
    detail:`## 概要
データ・セキュリティ・統合・アプリケーションの各ドメインで最適な設計判断を下す。ドメイン別アーキテクト資格を積み上げる。
## 推奨資格
Data / Sharing & Visibility / Integration Architect → Application/System Architect → CTA
## 身につけるべき力
- 大規模データ量(LDV)・共有可視性設計・統合パターン`,
    links:[{to:'cert-app-architect',rel:'目標資格'},{to:'cert-system-architect',rel:'目標資格'},{to:'cert-cta',rel:'最高峰'},{to:'concept-integration',rel:'中核スキル'}] },

  { id:'role-technical-architect', label:'テクニカルアーキテクト (CTA)', type:'role', category:'role',
    summary:'Salesforce最高峰。ボード面接で総合設計力を証明する。',
    tags:['cta','architect'],
    detail:`## 概要
Salesforce認定の頂点。エンタープライズ規模のソリューションを設計し、ボードレビューで口頭プレゼン・防御する。
## 到達までの道
全アーキテクトドメイン + Application/System Architect取得 → CTAレビューボード。
## 身につけるべき力
- 全ドメインの統合的判断・トレードオフ説明力`,
    links:[{to:'cert-cta',rel:'目標資格'},{to:'role-architect',rel:'前段階'}] },

  { id:'role-consultant', label:'コンサルタント (Consultant)', type:'role', category:'role',
    summary:'業務要件をSalesforceの機能に落とし込む実装リード。',
    tags:['consultant','requirements'],
    detail:`## 概要
顧客の業務課題をヒアリングし、Sales/Service等のクラウドで解決策を設計・実装・定着させる。
## 推奨資格
Administrator → Sales Cloud / Service Cloud Consultant など製品別
## 身につけるべき力
- 要件定義・製品知識・チェンジマネジメント`,
    links:[{to:'cert-sales-consultant',rel:'目標資格'},{to:'cert-service-consultant',rel:'目標資格'},{to:'role-admin',rel:'前段階'}] },

  { id:'role-business-analyst', label:'ビジネスアナリスト (BA)', type:'role', category:'role',
    summary:'業務要件を分析・文書化し、開発と橋渡しする。',
    tags:['ba','requirements'],
    detail:`## 概要
ステークホルダーの要求を引き出し、ユーザーストーリー・プロセス図・受け入れ基準に落とす。実装は管理者/開発者に渡す。
## 推奨資格
Salesforce Business Analyst
## 身につけるべき力
- 要件抽出・プロセスマッピング・UAT設計`,
    links:[{to:'cert-ba',rel:'目標資格'},{to:'role-admin',rel:'隣接'}] },

  { id:'role-marketer', label:'マーケター (Marketer)', type:'role', category:'role',
    summary:'MC/Account Engagementでナーチャリングを設計・運用。',
    tags:['marketer','marketing'],
    detail:`## 概要
メール・ジャーニー・スコアリングを設計し、リード育成とキャンペーン効果測定を担う。
## 推奨資格
Marketing Cloud Email Specialist / Account Engagement Specialist → 各Consultant
## 身につけるべき力
- セグメント設計・ジャーニー・AMPscript・効果分析`,
    links:[{to:'cert-marketing-consultant',rel:'目標資格'},{to:'cert-pardot-specialist',rel:'目標資格'},{to:'prod-marketing-cloud',rel:'主戦場'}] },

  { id:'role-devops', label:'DevOpsエンジニア', type:'role', category:'role',
    summary:'リリース管理・CI/CD・ソース管理でデリバリを高速化。',
    tags:['devops','cicd'],
    detail:`## 概要
複数環境間のメタデータ移行、Git連携、自動テスト、リリースパイプラインを整備する。
## 身につけるべき力
- Salesforce CLI/SFDX・スクラッチ組織・パッケージ・DevOps Center・CI/CD`,
    links:[{to:'concept-devops',rel:'中核スキル'},{to:'role-developer',rel:'隣接'}] },

  { id:'role-data-analyst', label:'データアナリスト', type:'role', category:'role',
    summary:'レポート/CRM Analytics/Tableauで示唆を導く。',
    tags:['analyst','analytics'],
    detail:`## 概要
CRMデータを分析し、ダッシュボードや予測でビジネス意思決定を支援する。
## 身につけるべき力
- レポート/ダッシュボード・CRM Analytics・Tableau・データ品質`,
    links:[{to:'concept-analytics',rel:'中核スキル'},{to:'prod-tableau',rel:'主要ツール'}] },

  { id:'role-designer', label:'UX/ソリューションデザイナー', type:'role', category:'role',
    summary:'使われるUI/体験を設計する。Lightningデザイン。',
    tags:['designer','ux'],
    detail:`## 概要
ユーザー中心設計でLightningアプリやExperienceサイトのUXを設計。SLDS(デザインシステム)に精通。
## 身につけるべき力
- ユーザーリサーチ・情報設計・SLDS・アクセシビリティ`,
    links:[{to:'concept-ux',rel:'中核スキル'},{to:'prod-experience-cloud',rel:'主戦場'}] },

  /* ========== 資格 (cert) ========== */
  { id:'cert-associate', label:'Salesforce Associate', type:'cert', category:'cert', level:'beginner',
    summary:'最初の一歩。CRM基礎とプラットフォーム全体像を問う入門資格。',
    tags:['entry'],
    detail:`## 概要
実務未経験者向けの入門認定。CRMの概念、Salesforceの製品群、基本的なナビゲーションを問う。
## 対象
学習を始めたばかりの人。次はAdministratorへ。
## 主な範囲
Salesforce概要 / データモデル基礎 / レポート基礎 / セキュリティ基礎`,
    links:[{to:'cert-admin',rel:'次のステップ'}] },

  { id:'cert-ai-associate', label:'AI Associate', type:'cert', category:'cert', level:'beginner',
    summary:'責任あるAIとCRMでのAI活用の基礎を問う入門資格。',
    tags:['ai','entry'],
    detail:`## 概要
AIの基本概念、バイアス・倫理、SalesforceにおけるAI活用の入門認定。非技術者にも人気。
## 主な範囲
AI基礎 / 責任あるAI / データ品質とAI / Einstein概要`,
    links:[{to:'cert-ai-specialist',rel:'次のステップ'},{to:'concept-ai',rel:'領域'}] },

  { id:'cert-admin', label:'Administrator', type:'cert', category:'cert', level:'beginner',
    summary:'管理者としての中核資格。最も受験者が多い登竜門。',
    tags:['admin','core'],
    detail:`## 概要
Salesforce学習の中心となる認定。ユーザー管理・セキュリティ・データ管理・自動化・レポートを幅広く問う。
## 主な出題範囲
設定とユーザー管理 / セキュリティとアクセス / 標準/カスタムオブジェクト / セールス&マーケ/サービスアプリ / 自動化(フロー) / データ管理 / 分析`,
    links:[{to:'cert-advanced-admin',rel:'次のステップ'},{to:'cert-app-builder',rel:'併走推奨'},{to:'role-admin',rel:'対象職種'}] },

  { id:'cert-advanced-admin', label:'Advanced Administrator', type:'cert', category:'cert', level:'intermediate',
    summary:'複雑な自動化・セキュリティ・分析を扱う上級管理者。',
    tags:['admin','advanced'],
    detail:`## 概要
Administratorの上位。高度なフロー、複雑な共有、レポート/ダッシュボードの応用、変更管理を問う。
## 前提
Administrator取得+実務経験推奨。`,
    links:[{to:'role-admin',rel:'対象職種'}] },

  { id:'cert-app-builder', label:'Platform App Builder', type:'cert', category:'cert', level:'intermediate',
    summary:'宣言的アプリ構築の設計力を証明する。',
    tags:['app-builder','declarative'],
    detail:`## 概要
ノーコードでカスタムアプリを設計・構築する力を問う。データモデル、UI、自動化、レポートを横断。
## 主な範囲
データモデリング / UI(Lightningアプリビルダー) / ビジネスロジック(フロー/数式) / 移行と展開`,
    links:[{to:'cert-pd1',rel:'開発者への橋渡し'},{to:'role-platform-app-builder',rel:'対象職種'}] },

  { id:'cert-ba', label:'Business Analyst', type:'cert', category:'cert', level:'intermediate',
    summary:'要件分析・ユーザーストーリー・プロセス設計を問う。',
    tags:['ba'],
    detail:`## 概要
Salesforceプロジェクトにおける要件定義とプロセス分析の力を認定。
## 主な範囲
顧客ディスカバリ / 要件 / ユーザーストーリー / プロセスマッピング / UAT`,
    links:[{to:'role-business-analyst',rel:'対象職種'}] },

  { id:'cert-pd1', label:'Platform Developer I', type:'cert', category:'cert', level:'intermediate',
    summary:'Apex・LWC開発の基礎を証明する開発者の必須資格。',
    tags:['developer','apex'],
    detail:`## 概要
Apex(SOQL/DML/トリガー/テスト)、Lightningコンポーネント、宣言的自動化との使い分けを問う。
## 主な範囲
開発の基礎 / データモデル / ロジック(Apex) / テスト / UI(LWC/Aura) / デバッグ&展開`,
    links:[{to:'cert-pd2',rel:'次のステップ'},{to:'cert-js-developer',rel:'併走推奨'},{to:'role-developer',rel:'対象職種'}] },

  { id:'cert-pd2', label:'Platform Developer II', type:'cert', category:'cert', level:'advanced',
    summary:'高度なApex・非同期・パフォーマンスを問う上級開発資格。',
    tags:['developer','advanced'],
    detail:`## 概要
PDIの上位。非同期Apex、パフォーマンス、統合、複雑なテスト戦略を問う(複数試験構成)。
## 前提
Platform Developer I取得。`,
    links:[{to:'role-developer',rel:'対象職種'},{to:'concept-governor-limits',rel:'重点'}] },

  { id:'cert-js-developer', label:'JavaScript Developer I', type:'cert', category:'cert', level:'intermediate',
    summary:'純粋なJS力を問う。LWC開発者に有用。',
    tags:['developer','javascript'],
    detail:`## 概要
フレームワーク非依存のJavaScript(ES6+/DOM/非同期)を問う。LWC開発の基礎体力。
## 主な範囲
変数/型 / オブジェクト/関数 / 非同期 / DOM / テスト`,
    links:[{to:'role-developer',rel:'対象職種'}] },

  { id:'cert-omnistudio-developer', label:'OmniStudio Developer', type:'cert', category:'cert', level:'advanced',
    summary:'業種クラウドのローコードUIツール開発を証明。',
    tags:['omnistudio','industries'],
    detail:`## 概要
OmniScript・FlexCard・DataRaptor・Integration Procedureによる開発を問う。
## 前提
LWC/Apex基礎の理解。`,
    links:[{to:'prod-industries',rel:'領域'},{to:'role-developer',rel:'対象職種'}] },

  { id:'cert-sales-consultant', label:'Sales Cloud Consultant', type:'cert', category:'cert', level:'intermediate',
    summary:'営業プロセスをSales Cloudで設計する製品コンサル資格。',
    tags:['consultant','sales'],
    detail:`## 概要
リード〜商談〜予測の設計、キャンペーン、生産性機能の実装を問う。
## 前提
Administrator取得推奨。`,
    links:[{to:'prod-sales-cloud',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'cert-service-consultant', label:'Service Cloud Consultant', type:'cert', category:'cert', level:'intermediate',
    summary:'コンタクトセンター設計をService Cloudで実現する資格。',
    tags:['consultant','service'],
    detail:`## 概要
ケース管理・チャネル・ナレッジ・Omni-Channel・コンタクトセンター指標の設計を問う。
## 前提
Administrator取得推奨。`,
    links:[{to:'prod-service-cloud',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'cert-experience-consultant', label:'Experience Cloud Consultant', type:'cert', category:'cert', level:'intermediate',
    summary:'ポータル/サイト構築と共有設計を問う。',
    tags:['consultant','experience'],
    detail:`## 概要
Experienceサイトの構築、テンプレート、共有・可視性、ライセンスを問う。`,
    links:[{to:'prod-experience-cloud',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'cert-field-service-consultant', label:'Field Service Consultant', type:'cert', category:'cert', level:'advanced',
    summary:'現場サービスの構成・スケジューリング設計を問う。',
    tags:['consultant','field-service'],
    detail:`## 概要
作業指示、リソース、スケジューリングポリシー、モバイルの設計を問う。
## 前提
Service Cloud Consultant + Administrator推奨。`,
    links:[{to:'prod-field-service',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'cert-cpq-specialist', label:'CPQ Specialist', type:'cert', category:'cert', level:'advanced',
    summary:'見積構成・価格ルール設計のスペシャリスト資格。',
    tags:['cpq','revenue'],
    detail:`## 概要
バンドル、価格ルール、割引、見積テンプレート、契約更新の設計を問う。`,
    links:[{to:'prod-revenue-cloud',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'cert-data-cloud-consultant', label:'Data Cloud Consultant', type:'cert', category:'cert', level:'advanced',
    summary:'CDPのデータ統合・ID解決・セグメント設計を問う。',
    tags:['data-cloud'],
    detail:`## 概要
データストリーム、DMO、ID解決、セグメント、アクティベーションの設計を問う。急成長領域。`,
    links:[{to:'prod-data-cloud',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'cert-marketing-associate', label:'Marketing Associate', type:'cert', category:'cert', level:'beginner',
    summary:'Marketing Cloudの入門認定。',
    tags:['marketing','entry'],
    detail:`## 概要
Marketing Cloudの基本概念とEmail Studio基礎の入門資格。`,
    links:[{to:'cert-marketing-email',rel:'次のステップ'},{to:'prod-marketing-cloud',rel:'領域'}] },

  { id:'cert-marketing-email', label:'MC Email Specialist', type:'cert', category:'cert', level:'intermediate',
    summary:'Email Studio・到達性・購読管理を問う。',
    tags:['marketing','email'],
    detail:`## 概要
Email Studio、コンテンツ、購読者管理、到達性、効果測定を問う。`,
    links:[{to:'cert-marketing-consultant',rel:'次のステップ'},{to:'prod-marketing-cloud',rel:'領域'}] },

  { id:'cert-marketing-admin', label:'MC Administrator', type:'cert', category:'cert', level:'intermediate',
    summary:'Marketing Cloudの管理・設定・データ管理を問う。',
    tags:['marketing','admin'],
    detail:`## 概要
アカウント設定、ユーザー/ロール、データ管理、自動化の管理者観点を問う。`,
    links:[{to:'prod-marketing-cloud',rel:'領域'},{to:'role-marketer',rel:'対象職種'}] },

  { id:'cert-marketing-consultant', label:'MC Consultant', type:'cert', category:'cert', level:'advanced',
    summary:'Journey/Automation/データ設計を横断する上級資格。',
    tags:['marketing','consultant'],
    detail:`## 概要
Journey Builder、Automation Studio、Contact Builder、データモデルの設計を問う。
## 前提
Email Specialist取得推奨。`,
    links:[{to:'prod-marketing-cloud',rel:'領域'},{to:'role-marketer',rel:'対象職種'}] },

  { id:'cert-pardot-specialist', label:'Account Engagement Specialist', type:'cert', category:'cert', level:'intermediate',
    summary:'B2Bマーケ(旧Pardot)の実務スペシャリスト資格。',
    tags:['marketing','pardot'],
    detail:`## 概要
プロスペクト、エンゲージメントスタジオ、スコアリング/グレーディング、フォーム、レポートを問う。`,
    links:[{to:'cert-pardot-consultant',rel:'次のステップ'},{to:'prod-marketing-cloud',rel:'領域'}] },

  { id:'cert-pardot-consultant', label:'Account Engagement Consultant', type:'cert', category:'cert', level:'advanced',
    summary:'B2Bマーケの設計・実装を統括する上級資格。',
    tags:['marketing','pardot'],
    detail:`## 概要
アカウント設計、Salesforce連携、リードマネジメント戦略を問う。`,
    links:[{to:'prod-marketing-cloud',rel:'領域'},{to:'role-marketer',rel:'対象職種'}] },

  { id:'cert-ai-specialist', label:'Agentforce Specialist (AI Specialist)', type:'cert', category:'cert', level:'advanced',
    summary:'Agentforce/Prompt Builder実装のスペシャリスト資格。',
    tags:['ai','agentforce'],
    detail:`## 概要
Agent Builder、Prompt Builder、モデル設定、Data Cloud連携、Trust Layerの実装を問う。最注目資格。`,
    links:[{to:'prod-agentforce',rel:'領域'},{to:'concept-ai',rel:'領域'}] },

  { id:'cert-data-architect', label:'Data Architect', type:'cert', category:'cert', level:'advanced',
    summary:'大規模データ・データモデル・移行の設計を問う。',
    tags:['architect','data'],
    detail:`## 概要
データモデリング、大規模データ量(LDV)、マスタデータ、データ移行、データガバナンスを問う。アーキテクトの一角。`,
    links:[{to:'cert-app-architect',rel:'統合先'},{to:'concept-data-model',rel:'領域'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-sharing-visibility-architect', label:'Sharing & Visibility Architect', type:'cert', category:'cert', level:'advanced',
    summary:'共有・可視性モデルの設計を問うアーキテクト資格。',
    tags:['architect','security'],
    detail:`## 概要
OWD、ロール階層、共有ルール、Apex共有、大規模での可視性設計を問う。`,
    links:[{to:'cert-app-architect',rel:'統合先'},{to:'concept-security',rel:'領域'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-integration-architect', label:'Integration Architect', type:'cert', category:'cert', level:'advanced',
    summary:'統合パターンとAPI設計を問うアーキテクト資格。',
    tags:['architect','integration'],
    detail:`## 概要
統合パターン(リクエスト&リプライ/Pub-Sub/バッチ等)、API選択、エラーハンドリングを問う。`,
    links:[{to:'cert-system-architect',rel:'統合先'},{to:'concept-integration',rel:'領域'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-app-architect', label:'Application Architect', type:'cert', category:'cert', level:'advanced',
    summary:'App Builder+PDI+Data+S&Vを束ねる複合称号。',
    tags:['architect'],
    detail:`## 概要
Platform App Builder・Platform Developer I・Data Architect・Sharing & Visibility Architectの4資格取得で自動付与される上位称号。`,
    links:[{to:'cert-cta',rel:'CTAへ'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-system-architect', label:'System Architect', type:'cert', category:'cert', level:'advanced',
    summary:'Integration+Identity+DevOps等を束ねる複合称号。',
    tags:['architect'],
    detail:`## 概要
Integration Architect・Identity and Access Management Architect・Development Lifecycle & Deployment Architect・Platform Developer Iの取得で付与される上位称号。`,
    links:[{to:'cert-cta',rel:'CTAへ'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-cta', label:'Technical Architect (CTA)', type:'cert', category:'cert', level:'advanced',
    summary:'最高峰。レビューボードで設計を口頭防御する。',
    tags:['architect','cta'],
    detail:`## 概要
Salesforce認定の頂点。Application ArchitectとSystem Architectの称号を前提に、レビューボードでエンタープライズ設計を提示・防御する。
## 前提
Application Architect + System Architect称号。`,
    links:[{to:'role-technical-architect',rel:'対象職種'}] },

  { id:'cert-nonprofit-consultant', label:'Nonprofit Cloud Consultant', type:'cert', category:'cert', level:'advanced',
    summary:'NPO向けクラウド実装の資格。',
    tags:['consultant','nonprofit'],
    detail:`## 概要
寄付・プログラム管理などNonprofit Cloudの設計・実装を問う。`,
    links:[{to:'prod-nonprofit',rel:'領域'},{to:'role-consultant',rel:'対象職種'}] },

  /* ========== 概念 (concept) ========== */
  { id:'concept-data-model', label:'データモデル', type:'concept', category:'concept',
    summary:'オブジェクト・項目・リレーションで情報を構造化する土台。',
    tags:['data','modeling'],
    detail:`## 概要
Salesforceの全機能はデータモデルの上に成り立つ。標準/カスタムオブジェクト、項目、参照/主従/多対多リレーションで業務を表現する。
## なぜ重要か
セキュリティ・自動化・レポートすべてがデータモデルに依存する。設計を誤ると後戻りが大きい。
## 学ぶこと
オブジェクト設計 / リレーション選択 / スキーマビルダー / 正規化`,
    links:[{to:'concept-security',rel:'依存'},{to:'concept-automation',rel:'依存'}] },

  { id:'concept-security', label:'セキュリティ&共有', type:'concept', category:'concept',
    summary:'「誰が何を見て編集できるか」を多層で制御する。',
    tags:['security','sharing'],
    detail:`## 概要
オブジェクト(プロファイル/権限セット)、項目(FLS)、レコード(OWD/ロール/共有ルール)の3層でアクセスを制御する。Salesforce設計の核心。
## なぜ重要か
情報漏洩・過剰権限を防ぎ、コンプライアンスを満たす。アーキテクト領域でも最重要。
## 学ぶこと
プロファイル/権限セット / OWD / ロール階層 / 共有ルール / FLS`,
    links:[{to:'cert-sharing-visibility-architect',rel:'専門資格'}] },

  { id:'concept-automation', label:'自動化', type:'concept', category:'concept',
    summary:'フロー中心にビジネスプロセスをノーコードで自動化。',
    tags:['automation','flow'],
    detail:`## 概要
入力規則・フロー・承認プロセスで業務ロジックを宣言的に自動化する。現在はFlowが自動化の中心。
## なぜ重要か
コードなしで複雑なプロセスを実装でき、保守性も高い。管理者〜開発者の必須スキル。
## 学ぶこと
画面フロー / レコードトリガーフロー / スケジュールフロー / 承認プロセス`,
    links:[{to:'concept-programmatic',rel:'補完'}] },

  { id:'concept-declarative', label:'宣言的開発 (ノーコード)', type:'concept', category:'concept',
    summary:'設定でアプリを作る「クリックで開発」の思想。',
    tags:['declarative','nocode'],
    detail:`## 概要
コードを書かず設定(ポイント&クリック)で機能を実装するアプローチ。Salesforceの最大の強み。「コードの前にまず宣言的」が鉄則。
## 学ぶこと
オブジェクト/項目 / フロー / 数式 / Lightningアプリビルダー`,
    links:[{to:'concept-programmatic',rel:'対比'},{to:'role-admin',rel:'中核'}] },

  { id:'concept-programmatic', label:'プログラム的開発 (コード)', type:'concept', category:'concept',
    summary:'Apex/LWCで宣言的機能の限界を超える。',
    tags:['code','apex','lwc'],
    detail:`## 概要
宣言的機能で実現できない複雑なロジックや高度なUIをApex(サーバー)・LWC(クライアント)で実装する。
## なぜ重要か
大規模・複雑要件では不可欠。ただしガバナ制限とテストが伴う。
## 学ぶこと
Apex / SOQL / LWC / テスト / セキュアコーディング`,
    links:[{to:'concept-governor-limits',rel:'制約'},{to:'role-developer',rel:'中核'}] },

  { id:'concept-integration', label:'システム統合', type:'concept', category:'concept',
    summary:'外部システムとデータ・プロセスを連携する。',
    tags:['integration','api'],
    detail:`## 概要
REST/SOAP/Bulk/Streaming API、プラットフォームイベント、MuleSoftで外部システムと接続する。統合パターンの選択が肝。
## 学ぶこと
API種別 / 統合パターン / 認証(OAuth) / エラー処理 / MuleSoft`,
    links:[{to:'cert-integration-architect',rel:'専門資格'},{to:'prod-mulesoft',rel:'ツール'}] },

  { id:'concept-analytics', label:'分析&レポート', type:'concept', category:'concept',
    summary:'データを可視化し意思決定に繋げる。',
    tags:['analytics','reports'],
    detail:`## 概要
標準レポート/ダッシュボードからCRM Analytics、Tableauまで。データを示唆に変える力。
## 学ぶこと
レポートタイプ / ダッシュボード / CRM Analytics / Tableau`,
    links:[{to:'prod-tableau',rel:'ツール'},{to:'role-data-analyst',rel:'中核'}] },

  { id:'concept-devops', label:'DevOps / リリース管理', type:'concept', category:'concept',
    summary:'変更を安全・高速に本番へ届ける仕組み。',
    tags:['devops','cicd'],
    detail:`## 概要
環境戦略、ソース管理、自動テスト、CI/CDで開発ライフサイクルを管理する。
## 学ぶこと
Sandbox戦略 / 変更セット / SFDX / スクラッチ組織 / パッケージ / DevOps Center`,
    links:[{to:'role-devops',rel:'中核'}] },

  { id:'concept-ai', label:'AI / Einstein', type:'concept', category:'concept',
    summary:'予測・生成・自律エージェントでCRMを賢くする。',
    tags:['ai'],
    detail:`## 概要
予測AI・生成AI・自律エージェントの3層。良質なデータ(Data Cloud)とTrust Layerが前提。
## 学ぶこと
Einstein予測 / Prompt Builder / Agentforce / 責任あるAI`,
    links:[{to:'prod-agentforce',rel:'製品'},{to:'prod-data-cloud',rel:'土台'}] },

  { id:'concept-ux', label:'UX / デザイン', type:'concept', category:'concept',
    summary:'使われるUIを設計する。SLDSとユーザー中心設計。',
    tags:['ux','design'],
    detail:`## 概要
ユーザー中心設計とSalesforce Lightning Design System(SLDS)で、直感的で定着するUIを作る。
## 学ぶこと
情報設計 / SLDS / アクセシビリティ / ページ設計`,
    links:[{to:'role-designer',rel:'中核'}] },

  { id:'concept-governor-limits', label:'ガバナ制限', type:'concept', category:'concept',
    summary:'マルチテナントを守る実行時の制約。設計の前提。',
    tags:['limits','apex'],
    detail:`## 概要
マルチテナント環境で公平にリソースを分配するための実行制限(SOQL件数・DML・CPU時間・ヒープ等)。コードは必ずこれを意識して一括処理する。
## なぜ重要か
制限超過は即エラー。bulkificationは開発者の必須作法。
## 学ぶこと
SOQL/DML制限 / CPU時間 / ヒープ / 一括化`,
    links:[{to:'concept-programmatic',rel:'関連'}] },

  { id:'concept-data-management', label:'データ管理&品質', type:'concept', category:'concept',
    summary:'取込・重複排除・品質維持でデータを資産にする。',
    tags:['data','quality'],
    detail:`## 概要
インポート、データローダ、重複管理、バックアップ、データ品質ルールでデータを健全に保つ。
## 学ぶこと
データローダ / 重複管理 / バックアップ / 品質ダッシュボード`,
    links:[{to:'concept-data-model',rel:'関連'}] },

  { id:'concept-identity', label:'ID & アクセス管理', type:'concept', category:'concept',
    summary:'SSO・OAuth・接続アプリで認証と外部アクセスを安全に統合。',
    tags:['identity','oauth','sso'],
    detail:`## 概要
シングルサインオン(SAML/OIDC)、OAuth 2.0各フロー、接続アプリ、My Domain、外部認証プロバイダで「誰がどう入るか」を設計する領域。
## なぜ重要か
統合・モバイル・外部連携すべての入口。System Architectの中核ドメイン。
## 学ぶこと
SSO(SAML/OIDC) / OAuthフロー / 接続アプリ / My Domain / 外部ID`,
    links:[{to:'concept-security',rel:'関連'},{to:'cert-identity-architect',rel:'専門資格'},{to:'concept-integration',rel:'関連'}] },

  { id:'concept-mobile', label:'モバイル', type:'concept', category:'concept',
    summary:'Salesforceモバイルアプリと現場向けオフライン体験を設計。',
    tags:['mobile'],
    detail:`## 概要
Salesforceモバイルアプリの設定、モバイル最適化レイアウト、オフライン、Field Serviceモバイルなど、現場・外出先での利用体験を扱う。
## 学ぶこと
モバイルアプリ設定 / コンパクトレイアウト / モバイル公開 / オフライン`,
    links:[{to:'concept-ux',rel:'関連'},{to:'prod-platform',rel:'基盤'}] },

  /* ---- 追加: 業種・特化クラウド (製品グループ) ---- */
  { id:'prod-financial-services', label:'Financial Services Cloud', type:'product', category:'cloud',
    summary:'金融機関向け。世帯・金融口座・紹介を管理する業種クラウド。',
    tags:['industry','finance'],
    detail:`## 概要
銀行・保険・資産運用向けの業種クラウド。世帯(Household)・金融口座・関係グループ・紹介(Referral)の専用データモデルを提供する。
## なぜ学ぶのか
金融業界の大型導入が多く、業種データモデルとコンプライアンス要件の理解が価値になる。
## 主要トピック
- 世帯・関係グループ / 金融口座
- アクションプラン / 紹介管理
## おすすめリソース
Trailhead「Financial Services Cloud」`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'prod-health', label:'Health Cloud', type:'product', category:'cloud',
    summary:'医療・ヘルスケア向け。患者・ケアプラン・臨床データを管理。',
    tags:['industry','health'],
    detail:`## 概要
病院・製薬・保険者向けの業種クラウド。患者(Patient)・ケアプラン・臨床データ(HL7/FHIR連携)を管理する。
## なぜ学ぶのか
ヘルスケアDXの需要拡大。患者中心のデータモデルと相互運用性(FHIR)が学べる。
## 主要トピック
- 患者カード / ケアプラン
- 臨床データモデル・FHIR連携
## おすすめリソース
Trailhead「Health Cloud」`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'prod-manufacturing', label:'Manufacturing Cloud', type:'product', category:'cloud',
    summary:'製造業向け。販売契約と需要予測で営業とオペを橋渡し。',
    tags:['industry','manufacturing'],
    detail:`## 概要
製造業向けの業種クラウド。販売契約(Sales Agreement)とアカウントベース予測で、受注見込みと実績を一元管理する。
## なぜ学ぶのか
製造業の営業計画・需要予測のDX。長期契約ビジネスのモデル化が学べる。
## 主要トピック
- 販売契約 / アカウント予測
- 需要計画との連携
## おすすめリソース
Trailhead「Manufacturing Cloud」`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'prod-sales-cloud',rel:'拡張'},{to:'role-consultant',rel:'対象職種'}] },

  { id:'prod-scheduler', label:'Salesforce Scheduler', type:'product', category:'cloud',
    summary:'来店・面談などの予約をルールベースで自動割当する予約基盤。',
    tags:['scheduling','appointment'],
    detail:`## 概要
顧客との面談・来店予約を、スキル・稼働・営業時間に基づいて割り当てる予約管理製品。金融・小売の対面業務で活用。
## 主要トピック
- サービスリソース・稼働時間
- 予約フロー(インバウンド/アウトバウンド)
## おすすめリソース
Trailhead「Salesforce Scheduler」`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'prod-service-cloud',rel:'連携'}] },

  { id:'prod-loyalty', label:'Loyalty Management', type:'product', category:'cloud',
    summary:'ポイント・特典・会員ランクのロイヤルティプログラムを構築。',
    tags:['loyalty','b2c'],
    detail:`## 概要
ポイント付与・特典・会員ティアを設計するロイヤルティプログラム管理製品。Data CloudやMarketing Cloudと連携する。
## 主要トピック
- プログラム / ティア / 特典
- ポイント台帳・プロモーション
## おすすめリソース
Trailhead「Loyalty Management」`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'prod-marketing-cloud',rel:'連携'}] },

  { id:'prod-net-zero', label:'Net Zero Cloud', type:'product', category:'cloud',
    summary:'カーボン会計・サステナビリティ報告を管理する製品。',
    tags:['sustainability','esg'],
    detail:`## 概要
温室効果ガス排出量の計測・カーボン会計・サステナビリティ報告(ESG)を管理する製品。
## 主要トピック
- 排出量計測 / カーボン会計
- サステナビリティ報告
## おすすめリソース
Trailhead「Net Zero Cloud」`,
    links:[{to:'prod-platform',rel:'基盤'}] },

  { id:'prod-public-sector', label:'Public Sector Solutions', type:'product', category:'cloud',
    summary:'行政・公共向け。ライセンス許認可・給付・査察を管理。',
    tags:['industry','public'],
    detail:`## 概要
政府・自治体向けの業種クラウド。許認可(License & Permit)・給付(Benefits)・査察・ケース管理をテンプレート化する。
## 主要トピック
- 許認可・給付管理 / OmniStudio活用
- 査察・コンプライアンス
## おすすめリソース
Trailhead「Public Sector Solutions」`,
    links:[{to:'prod-platform',rel:'基盤'},{to:'prod-industries',rel:'関連'},{to:'role-consultant',rel:'対象職種'}] },

  /* ---- 追加: 資格 (グループ) ---- */
  { id:'cert-identity-architect', label:'Identity & Access Management Architect', type:'cert', category:'cert', level:'advanced',
    summary:'SSO・OAuth・プロビジョニングの認証設計を問うアーキテクト資格。',
    tags:['architect','identity'],
    detail:`## 概要
SAML/OIDCによるSSO、OAuthフロー、ユーザープロビジョニング、外部IDの設計を問う。System Architectの構成資格。
## 前提
統合とセキュリティの基礎知識。`,
    links:[{to:'cert-system-architect',rel:'統合先'},{to:'concept-identity',rel:'領域'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-devlifecycle-architect', label:'Development Lifecycle & Deployment Architect', type:'cert', category:'cert', level:'advanced',
    summary:'環境戦略・CI/CD・リリース管理の設計を問うアーキテクト資格。',
    tags:['architect','devops'],
    detail:`## 概要
サンドボックス戦略、ソース管理、テスト戦略、CI/CDパイプライン、リリース管理の設計を問う。System Architectの構成資格。`,
    links:[{to:'cert-system-architect',rel:'統合先'},{to:'concept-devops',rel:'領域'},{to:'role-architect',rel:'対象職種'}] },

  { id:'cert-marketing-developer', label:'Marketing Cloud Developer', type:'cert', category:'cert', level:'advanced',
    summary:'AMPscript/SSJS/APIでMarketing Cloudを拡張する開発資格。',
    tags:['marketing','developer'],
    detail:`## 概要
AMPscript、Server-Side JavaScript、Marketing Cloud API、CloudPagesによる開発を問う。`,
    links:[{to:'prod-marketing-cloud',rel:'領域'},{to:'role-developer',rel:'対象職種'}] },

  { id:'cert-ux-designer', label:'User Experience Designer', type:'cert', category:'cert', level:'intermediate',
    summary:'UX原則とSLDS・Lightning設計を問うデザイナー資格。',
    tags:['designer','ux'],
    detail:`## 概要
ユーザー中心設計、アクセシビリティ、SLDS、Lightningページ設計、リサーチ手法を問う。`,
    links:[{to:'role-designer',rel:'対象職種'},{to:'concept-ux',rel:'領域'}] },

  { id:'cert-strategy-designer', label:'Strategy Designer', type:'cert', category:'cert', level:'advanced',
    summary:'デザイン思考でビジネス課題を解く上級デザイナー資格。',
    tags:['designer','strategy'],
    detail:`## 概要
デザイン思考、ステークホルダーとの共創、ビジョン設計、価値提案を問う。`,
    links:[{to:'role-designer',rel:'対象職種'},{to:'concept-ux',rel:'領域'}] },

];
