UPDATE prompt_templates
SET
    model = 'qwen3.6-plus',
    updated_at = NOW()
WHERE model = 'qwen-plus'
  AND deleted_at IS NULL;
