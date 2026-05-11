-- V4: Fix GROUP C compound-word names so tsvector AND queries work correctly.
--
-- German FTS does not break compound words into their components:
--   "Buchhandlung" → lexeme "buchhandlung" (never "buch")
--   "Autohaus"     → lexeme "autohaus"     (never "auto")
--   "Medizintechnik" → lexeme "medizintechnik" (never "medizin")
--
-- V3 GROUP C targets these queries:
--   "Paderborn Buch"    → needs "buch"    as a standalone lexeme in name1
--   "Paderborn Auto"    → needs "auto"    as a standalone lexeme in name1
--   "Paderborn Medizin" → needs "medizin" as a standalone lexeme in name1
--   "Paderborn Metallbau" → "metallbau" stems to "metallbau" directly ✓ no change needed
--
-- Fix: replace compound words with standalone searchable words.

UPDATE partner SET name1 = 'Paderborner Buch GmbH'     WHERE partner_number = 100053;
UPDATE partner SET name1 = 'Paderborner Auto AG'        WHERE partner_number = 100054;
UPDATE partner SET name1 = 'Paderborner Medizin KG'     WHERE partner_number = 100055;
