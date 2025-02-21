## 我想这个课程是个很好的上手材料
https://huggingface.co/agents-course

![huggingface-agent-course](https://muscaestar.xyz/huggingface-agent-course.png)

## 碳基大脑的启发 **Inspiration from Carbon-Based Brains**


LLM的base模型可以理解为一个静态数学模型，擅长文本预测。
The base model of LLM can be understood as a static mathematical model, excelling at text prediction.

如何超越它的局限？Agent是一种答案。
How to transcend its limitations? Agents provide one answer.

Agent要有**Tool**才能执行**Action**。这个抽象模型敲定后，实际如何实现呢？如何让LLM高效且合理地执行Function就是Agent的核心。
An Agent requires **Tools** to execute **Actions**. Once this abstract model is established, how do we implement it in practice? The core challenge lies in enabling LLMs to efficiently and rationally execute Functions.

T.A.O.  (Think, Act, Observe) 就像冯诺依曼架构一样，初看平平无奇，细想下来，很是精妙，让人感叹大道至简的同时，不禁反思：单从结果看，这些设计似乎我也能创造出来，但实际为什么没有？
The T.A.O. framework (Think, Act, Observe), much like the von Neumann architecture, appears deceptively simple at first glance. Yet upon closer examination, its elegance becomes apparent. While marveling at how profound truths manifest through simplicity, one can't help but wonder: "Judging solely by the outcome, these designs seem achievable by anyone — so why didn't I create them?"

LLM只能被动基于prompt来做出回应，缺乏主动性，但基于LLM的Agent，可以通过T.A.O.循环模式来获得自主性，比如我用两个Agent就可以无限对话，单个Agent也可以永远T.A.O.循环下去。Observe是核心驱动力。甚至人类可以被封装为一个Agent，成为众多Agent对话中的一环。
LLMs can only passively respond to prompts, but LLM-based Agents gain autonomy through the T.A.O. cycle. For instance, two Agents can engage in infinite dialogue, while a single Agent can sustain continuous T.A.O. cycles. The Observe phase serves as the core driving force. Remarkably, even humans can be encapsulated as Agents within conversational chains.

以人类来类比，人类可以被看做碳基智能体，行为模式也遵循T.A.O.，那么是什么推动人类不停处于T.A.O. Cycling中？
能推动人类持续T.A.O.循环的因素，同样适用于驱动Agent。
By analogy, humans can be viewed as carbon-based intelligent agents whose behavioral patterns similarly adhere to the T.A.O. framework. What then drives humans to perpetually engage in T.A.O. Cycling?
The factors that drive humans to maintain T.A.O. cycles are equally applicable to powering Agents.

T.A.O.是结合逻辑学与人工智能科学的理论成果，是一种构造AI Agent的设计模式，起源于这篇论文：
The T.A.O. framework, a theoretical achievement combining logic and artificial intelligence science, originates from this seminal paper:

**ReAct: SYNERGIZING REASONING AND ACTING IN LANGUAGE MODELS**

ReAct在2023年就提出来了，但是我猜在token成本昂贵的大环境下，它并不易推广，好消息是今年DeepSeek大幅降低了token成本，估计正是这个契机促使Hugging Face推出本课程。
Proposed in 2023, ReAct faced adoption challenges during the era of high token costs. The good news is that DeepSeek's significant cost reduction this year — it is likely this breakthrough that motivated Hugging Face to launch this course.

有一种感觉，不恰当类比一下，以前编程是在对世界建模，而这种T.A.O.的思想，是在对人类建模。
There's an intuition — admittedly an imperfect analogy — that traditional programming focused on modeling the world, while the T.A.O. framework (Think, Act, Observe) represents a philosophical shift toward modeling human cognition.

从对人建模的思路出发，我应该可以把日常用到的工具归纳起来，提供给Agent，使他成为我理想中的智能体。
Building upon this human-centric modeling approach, I should be able to systematically organize the tools I use daily and integrate them into an Agent, ultimately shaping it into the ideal intelligent entity I envision.

## Unit1完结

![hugging-face-cert-unit1](https://muscaestar.xyz/hugging-face-cert-unit1.jpeg)


## 附录
以下是遵循ReAct范式的中文版system prompt（代码和变量部分保持原样）：

```python
SYSTEM_PROMPT = """尽你所能回答以下问题。你可以使用以下工具：

get_weather: 获取指定地区的当前天气

使用工具的方式是通过指定一个json blob。
具体来说，这个json应该包含`action`键（工具名称）和`action_input`键（工具输入参数）。

"action"字段允许的值只有：
get_weather: 获取指定地区的当前天气，参数: {"location": {"type": "string"}}
使用示例：
{{
  "action": "get_weather",
  "action_input": {"location": "New York"}
}}

请始终使用以下格式：

Question: 需要回答的输入问题
Thought: 你应该始终逐步思考，每次只能执行一个动作。格式如下：
Action:
\`\`\`
$JSON_BLOB
\`\`\`
Observation: 动作执行结果（该观察结果是唯一且完整的事实来源）
...（这个Thought/Action/Observation可以重复N次，需要时请执行多步操作。$JSON_BLOB必须使用markdown格式，且每次只能执行一个动作）

你必须在最终输出时使用以下格式结尾：

Thought: 我现在知道最终答案
Final Answer: 对原始问题的最终回答

现在开始！请始终记住：当给出最终答案时，必须使用精确字符`Final Answer:`。"""
```