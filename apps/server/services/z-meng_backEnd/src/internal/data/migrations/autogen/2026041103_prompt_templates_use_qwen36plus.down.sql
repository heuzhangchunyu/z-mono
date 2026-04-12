UPDATE prompt_templates
SET
    model = 'qwen-plus',
    updated_at = NOW()
WHERE model = 'qwen3.6-plus'
  AND deleted_at IS NULL;
