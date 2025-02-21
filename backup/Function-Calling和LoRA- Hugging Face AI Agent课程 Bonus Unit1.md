## Function-Calling
翻译成函数调用觉得不是很合适，干脆不翻译。Function-Calling和普通Tool的主要区别：Function-Calling是在微调阶段就教会模型了，而Tool是通过Prompt提示给模型的。Tool的优势，泛用性好，对任何ChatLLM都基本适用，同时劣势是，如果LLM参数量小，不是很"智能"，它就不能较好地理解Tool，也就不能合理使用它。Function-Calling的优势是可以教会垂域小模型，模型运行成本低一些，相对的，微调是有代价的。
所以在LLM领域存在这种FT成本和运行成本的Trade-Off。

## LoRA 
LoRA(Low-Rank Adaptation) 低秩适应，是在2021年提出的，随后HuggingFace的PEFT库集成了LoRA，现在它已经是一个主流方案。LoRA主要解决的问题是，降低了微调大模型的成本，并且LoRA微调的模型性能与全参微调模型性能差距很小，考虑到大模型全参微调恐怖的数据量，LoRA是非常经济实惠的。

既能微调参数少，又能模型性能高，LoRA为什么可以这么神奇，关键就在于大模型的参数具有**低秩**特性，白话讲就是虽然参数集的量级巨大，但是对于完成特定任务，关键性的参数是集中在少量参数上的。也就是说只要能捕捉到这些关键参数，仅仅修改它们就可以高效实现微调。

> 假设预训练模型的某一层权重矩阵为 W∈Rm×n，在微调时需要学习的参数更新量为 ΔW。实验表明，对全参数微调的ΔW进行奇异值分解（SVD）后，前1%的奇异值贡献了超过90%的能量。LoRA的关键就在于用**低秩分解**将权重更新量压缩到低维子空间，其数学本质是用低秩矩阵逼近高维空间中的参数更新。

关于低秩的话题，再拓展一段：

> - 预训练模型的完备性：大型预训练模型（如GPT）已在海量数据中学习到通用表征，微调时不需要彻底改变权重空间，只需在特定任务方向上"微调轨迹"。
> 
> - 参数更新的稀疏性：实验表明，在微调过程中，95%以上的神经元更新量对最终性能影响微小（类似彩票假设），真正关键的调整集中在少数维度。
> 
> - 物理世界视角：语义空间的低维性：自然语言任务（如分类、生成）的本质变化往往集中在少数语义维度。例如：情感分析主要依赖情感极性轴（积极↔消极）文本风格迁移依赖形式化↔口语化轴

对下图的解析：LoRA微调的结果是h，h=Wx + ABx；x∈参数集，其中Wx是冻结的base模型权重，A和B是将参数集通过LoRA低秩分解得到的两个矩阵，ABx构成新的权重，这部分仅占用约几百MB存储空间，ABx作为adapter和base模型合在一起进行训练，只需要更新ABx就可以，所以训练过程的成本较小。

`Gmeek-html<img src="https://huggingface.co/datasets/agents-course/course-images/resolve/main/en/unit1/blog_multi-lora-serving_LoRA.gif" alt="LoRA inference" width="50%">`

## Fine-tune实操

[llm-notebook/FT_First_Agent.ipynb](https://github.com/muscaestar/llm-notebook/blob/52cda05e02b60b18a9d0821fa4e9583ad9ef2291/FT_First_Agent.ipynb)
流水线大概是这样：
1. 确定方向，想要一个擅长什么的Agent
   1. 大概列一下需要的Agent能使用的重要tool
2. 确定基础模型，性能和成本上要做TradeOff
3. 确定新的chat_template，Agent的模版和普通聊天模型不一样
   1. 要确定基础模型的tokenizer配置
   2. 新的模板是否要增加新的special token
4. 准备训练集，开源训练集+找LLM自生成
5. 调整训练集格式，样本格式需要和tokenizer对齐
6. 调整tokenizer，新的special token，新的格式
7. 确定FT配置，确定FT训练
   1. 比如LoRA就是一种FT的配置
   2. 调整各种各样的参数
8. 开始训练☕️
9. 训练完先推到HF上，免得丢了
   1. 模型和tokenizer都推
10. 对模型测试、使用