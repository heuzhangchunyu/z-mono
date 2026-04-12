-- mig:up 2026041103 prompt_templates_use_qwen36plus
UPDATE prompt_templates
SET
    model = 'qwen3.6-plus',
    updated_at = NOW()
WHERE model = 'qwen-plus'
  AND deleted_at IS NULL;

-- mig:down 2026041103 prompt_templates_use_qwen36plus
UPDATE prompt_templates
SET
    model = 'qwen-plus',
    updated_at = NOW()
WHERE model = 'qwen3.6-plus'
  AND deleted_at IS NULL;
