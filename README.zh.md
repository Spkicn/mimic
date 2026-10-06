# mimic · 模仿者

**先看同类项目实际怎么做，再决定这个项目怎么做。**

[![CI](https://github.com/Spkicn/mimic/actions/workflows/ci.yml/badge.svg)](https://github.com/Spkicn/mimic/actions/workflows/ci.yml)

`mimic` 是一个 [Agent Skill](https://agentskills.io)，用在"答案不该来自模型自己的习惯"的场合。
选技术栈、实现一个子系统、写 README、定仓库规范——每一件事都有上百个做得好的开源项目已经解决过，
而且它们的选择是**可核查的**；模型自己的默认值不是。

所以这个 skill 让 agent 真的去看——看真正可比的项目，而不是最火的那些——然后产出一个遵循它
实际看到的东西的交付物，并附上证据和 license 检查。

> 它要防的失败模式是**自信的编造**：看起来很像样的规范章节、技术栈建议、star 数、license、
> 一段实现，全都来自记忆。这些每一条都能被查证，而且一定会被查证。

## 四种模式

| 模式 | 何时使用 | 交付物 |
|---|---|---|
| **stack** | "我们该用什么技术栈做？" | 落盘的决策记录：背景、选项（及每个选项被哪些项目采用）、决定、后果 |
| **implementation** | "这个功能该怎么实现？这个模块该长成什么形状？" | 改动后的源码，外加一段来源说明：模仿了什么模式、来源仓库的 pinned commit、其 license、以及两边共同面对的约束 |
| **artifact** | "我们的 README 太敷衍，看看别人怎么写" | 文件本身（`README.md`、`CONTRIBUTING.md`、docs），结构来自对可比项目的章节盘点 |
| **conventions** | "这个仓库该怎么组织？" | 目录结构、commit/CI/lint 规则、`AGENTS.md`；每条采纳的约定都标注来源和维持成本 |

## 快速开始

**DSH**

```powershell
git clone https://github.com/Spkicn/mimic.git
cd mimic
./install.ps1                 # 装到 ~/.dsh/skills
./install.ps1 -Target project-dsh -ProjectPath C:\code\myapp
```

**Claude Code**

```
/plugin marketplace add Spkicn/mimic
/plugin install mimic@mimic
```

**其他 Agent Skills 宿主**：直接复制目录

```bash
mkdir -p .claude/skills && cp -R mimic/skills/mimic .claude/skills/
```

然后正常描述任务即可，skill 会按 description 自动触发：

> 我们的 README 写得很敷衍，去 GitHub 上找几个同类项目看看别人的 README 是什么规范，然后照着重写一版。

> 我要给这个项目加一个重试机制，先去 GitHub 上看看同类项目是怎么实现的，再动手写。

## 和别的方案有什么不同

大多数"先调研再动手"的提示词停在报告上。`mimic` 补了这些缺口：

| 缺口 | `mimic` 的要求 |
|---|---|
| **实质** | 至少三条**具体且可核查**的断言——数字、名字、路径、版本，或一句从抓取里摘出来的话。测试方法：把所有专有名词和数字删掉，如果产出读起来依然完整，那它就是模板——**而且它可以通过其余每一条检查却什么都没产出**。 |
| **可比性** | 按问题域 / 用户 / 规模筛选出 3–5 个候选，并且必须记录至少一个被排除的候选。star 数只是背景信息，永远不作为入选理由。 |
| **证据** | 每条仓库结论标注 E1–E4：已抓取 / 已阅读 / 多源互证 / 推断。E4 永远不能当成事实陈述。`pushed_at`、license、是否归档必须抓取，不许凭记忆。 |
| **License** | 采纳任何东西之前做明确检查：结构和思想可以学，表达和代码不行。GPL/AGPL/无 license 的来源要标出来，而不是悄悄用掉。 |
| **闭环** | 交付物是磁盘上的文件，外加一张"采纳了 / 故意没采纳 / 原因"对照表——不是聊天窗口里的建议。implementation 模式下交付物是改动后的源码加一段来源说明。 |
| **约束测试** | 只有当你能说出"是什么约束逼出了这个形状"、并且证明自己也有同样的约束时，才采纳它。否则就是 cargo cult——而"你其实不需要它"本身就是结论。 |
| **净室两段式** | 先用你自己的话把模式写出来，然后关掉来源再动手实现。这才让"绝不抄代码"从承诺变成一道工序。 |

还有一个降级模式：**连不上网就不给答案。** GitHub 不可达时，agent 明确说明并停止，而不是凭记忆
重建仓库信息。

## 一次运行的过程

1. **框定** — 一句话复述目标；最多问三个问题，且只有会改变"什么算可比"的问题才值得问。
2. **选样** — 3–5 个可比项目 + 至少一个被排除的候选，判断依据见 [`selecting-repos.md`](skills/mimic/reference/selecting-repos.md)。
3. **阅读** — 全部浅读，最多两个深读。用 [`mimic-probe.mjs`](skills/mimic/scripts/mimic-probe.mjs) 抓取：带缓存、带截断、不添油加醋。
4. **决策** — 事实与判断分列；过 license 闸门。
5. **落盘** — 交付物写到磁盘，然后跑完成度检查表，并把检查结果一并报告。

```bash
# agent 在底层实际执行的命令
node skills/mimic/scripts/mimic-probe.mjs owner/repo owner/repo2 --max-chars 1200
node skills/mimic/scripts/mimic-probe.mjs --search "rate limiter" --language python
```

探针会输出 `stars | license | pushed_at | archived`，以及 README、根目录树、依赖清单——正是模型
最爱编、也最容易编错的那些字段。设置 `GITHUB_TOKEN` 可提高限流额度；结果缓存在 `.mimic-cache/`。

## 仓库结构

```
skills/mimic/
  SKILL.md                      # 入口：路由、唯一铁律、完成度闸门
  reference/
    selecting-repos.md          # 可比性维度、检索策略、排除标准
    evidence.md                 # E1–E4 分级、预算、记录与报告模板
    licensing.md                # 什么可以迁移、兼容性表、红线
    mimic-stack.md              # 模式：stack -> 决策记录
    mimic-implementation.md     # 模式：implementation -> 形状、约束测试、净室
    mimic-readme.md             # 模式：artifact -> 落盘文件
    mimic-conventions.md        # 模式：conventions -> 结构、CI、AGENTS.md
  scripts/mimic-probe.mjs       # 零依赖、带缓存的 GitHub 抓取器
AGENTS.md                       # 本仓库的 agent 规则总纲；CLAUDE.md 直接 import 它
CONTRIBUTING.md                 # 怎么贡献，以及什么样的报告有用
scripts/validate.mjs            # 自检：frontmatter、description 单行、25–150 行区间、路由、链接
scripts/validate.test.mjs       # 离线 fixture 测试，校验器每一条规则各一个
.github/workflows/ci.yml        # 每次 push 跑自检、fixture 测试与语法检查
.github/PULL_REQUEST_TEMPLATE.md
.claude-plugin/marketplace.json # Claude Code 插件清单
install.ps1 / install.sh        # DSH / Claude / 项目内安装脚本
.gitattributes                  # 让 install.sh 保持 LF、install.ps1 保持 CRLF
```

## 设计原则

- **抓取，而不是回忆。** 没有抓取支撑的结论，是措辞礼貌的编造。
- **可比性优先于流行度。** 解决**你**的问题的 400 星项目，胜过不解决你问题的 6 万星项目。
- **三个是下限。** 一个你欣赏的仓库只是口味，不是规范。
- **模仿结构，不模仿装饰。** emoji 标题和徽章墙不是规范；章节契约和承诺才是。
- **把文件写出来。** 建议会挥发，仓库里的文件不会。
- **产物的 license 属于你，不属于来源。** 从 GPL 项目学习完全自由——但一个字都不抄。

## 先行工作与致谢

`mimic` 是用它自己的方法在 2026-10-06 对 skills 生态做了一轮调研后建成的。它遵循的惯例，以及
来源：

| 项目 | License | 采纳内容 |
|---|---|---|
| [kengomatsuo/agent-skills](https://github.com/kengomatsuo/agent-skills) | MIT | research-first 定位、一个 skill 只解决一件事、"先看再建" |
| [Paldom/github-skills](https://github.com/Paldom/github-skills) | MIT | README 章节契约（价值主张 → 快速开始 → skill 表 → 仓库结构 → 贡献 → license）、多宿主安装路径、插件清单 |
| [anthropics/skills](https://github.com/anthropics/skills) | — | `.claude-plugin/marketplace.json` 的结构 |
| [blue-skillhub](https://github.com/betterblueblue/blue-skillhub) | — | 事实与判断分离；动手写代码前先确认方案 |
| [GitHub Prior Art Research](https://skillmd.ai/skills/github-prior-art-research/) | — | 提实现方案前先在 GitHub 上检索 |

没有复制任何文字或代码。与上述所有项目的差异：它们停在报告，`mimic` 补上了 license 闸门和
"必须落盘"这一环。

## 贡献

欢迎 issue 和 PR，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。最有价值的贡献是**失败报告**：agent
断言了它没有抓取过的仓库信息，或者采纳了一条不适合本项目的约定。这些会变成 reference 里的硬性红线。

提交 PR 前请先跑 `node scripts/validate.mjs` 和 `node scripts/validate.test.mjs`——CI 两个都跑。
请保持 `SKILL.md` 在 25–150 行之间，细节放进 `reference/`；这是本仓库自己的约定，校验脚本两端
都会强制执行。面向 agent 的规则写在 [AGENTS.md](AGENTS.md)。

## License

[MIT](LICENSE) © 2026 mimic contributors
