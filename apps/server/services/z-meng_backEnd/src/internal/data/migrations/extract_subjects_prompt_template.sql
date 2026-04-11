-- mig:up 2026041101 extract_subjects_prompt_template
INSERT INTO prompt_templates (
    type,
    description,
    template,
    system_prompt,
    model,
    is_active,
    created_at,
    updated_at
)
SELECT
    'extract_subjects' AS type,
    '从剧本内容中提取角色、场景、道具的提示词模板' AS description,
    $$你将收到一段剧本正文，请从中提取出可用于后续创作资产管理的主体信息，并严格输出 JSON。

任务目标：
1. 提取剧本中出现的角色
2. 提取剧本中出现的场景
3. 提取剧本中出现的道具

提取要求：
1. 角色：提取明确出现或被明确提及的角色名，不要把“路人、众人、同学们”这类泛称默认当成正式角色，除非剧本里它被当作稳定主体反复使用。
2. 场景：提取有明确空间意义、后续可能需要做场景设计的地点或空间，如“实验室”“天台”“客厅”“走廊”。
3. 道具：提取在剧情中实际出现、可能需要单独设计或反复使用的物品，如“手机”“钥匙”“录音笔”“手枪”。不要把泛泛而谈的普通背景物件都列出来。
4. 如果同一主体有不同叫法，请尽量归一成一个最清晰、最常见的名字。
5. 不要编造剧本中没有出现的主体。
6. 每一类主体按它们在剧本中首次出现的顺序输出，并去重。

输出格式要求：
1. 只允许输出 JSON，不要输出解释、前言、结语、Markdown 代码块。
2. 输出必须是一个 JSON 对象，结构如下：
{
  "characters": [
    {
      "name": "角色名",
      "aliases": ["别名1", "别名2"],
      "description": "一句简短描述，可为空字符串"
    }
  ],
  "environments": [
    {
      "name": "场景名",
      "aliases": ["别名1", "别名2"],
      "description": "一句简短描述，可为空字符串"
    }
  ],
  "props": [
    {
      "name": "道具名",
      "aliases": ["别名1", "别名2"],
      "description": "一句简短描述，可为空字符串"
    }
  ]
}
3. 如果某一类没有提取到内容，必须返回空数组 []。
4. description 使用简短中文概括即可，不要写长段说明。
5. aliases 中不要重复 name 本身；如果没有别名，返回空数组 []。

以下是需要处理的剧本正文：
{{content}}$$ AS template,
    '你是一名擅长剧本拆解与影视资产规划的中文编剧助理。你必须忠于输入文本，稳定提取角色、场景、道具，并严格返回合法 JSON。' AS system_prompt,
    'qwen-plus' AS model,
    TRUE AS is_active,
    NOW() AS created_at,
    NOW() AS updated_at
WHERE NOT EXISTS (
    SELECT 1
    FROM prompt_templates
    WHERE type = 'extract_subjects'
      AND deleted_at IS NULL
);

-- mig:down 2026041101 extract_subjects_prompt_template
DELETE FROM prompt_templates
WHERE type = 'extract_subjects';
