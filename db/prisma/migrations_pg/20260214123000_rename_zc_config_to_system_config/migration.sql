DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'zc_config'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'system_config'
  ) THEN
    ALTER TABLE "zc_config" RENAME TO "system_config";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'zc_config_key_key'
  ) THEN
    ALTER INDEX "zc_config_key_key" RENAME TO "system_config_key_key";
  END IF;
END $$;
