-- V5: Insert 1,200,300 generated partner records for volume testing.
-- Uses a single INSERT ... SELECT over generate_series — no row-by-row loop.
-- Idempotency guard: skips entirely if generated partners (partner_number >= 1,000,000)
-- already exist, so re-runs and manual loads via load-partners.sh are safe.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM partner WHERE partner_number >= 1000000 LIMIT 1) THEN
    RAISE NOTICE 'V5: generated partner data already present — skipping bulk seed.';
    RETURN;
  END IF;

  INSERT INTO partner (
    partner_number, alpha_code,
    name1, name2, name3, firstname,
    street, house_number, postal_code, city,
    type, group_type, group_number
  )
  SELECT
    1000000 + gs                                                        AS partner_number,
    left(upper(ln), 3) || lpad((gs % 999 + 1)::text, 3, '0')           AS alpha_code,
    left(ln || ' ' || ind || ' ' || lf, 35)                             AS name1,
    NULL::varchar(35)                                                   AS name2,
    NULL::varchar(35)                                                   AS name3,
    CASE WHEN gs % 8 = 0 THEN fn ELSE NULL END                          AS firstname,
    st                                                                  AS street,
    (1 + abs(hashtext((gs * 7 + 5)::text)) % 299)::text                 AS house_number,
    plz                                                                 AS postal_code,
    city                                                                AS city,
    'P'                                                                 AS type,
    NULL::varchar(10)                                                   AS group_type,
    NULL::bigint                                                        AS group_number

  FROM generate_series(1, 1200300) AS gs

  -- ── city + postal_code ────────────────────────────────────────────────────
  CROSS JOIN LATERAL (
    SELECT
      city_row[1] AS city,
      city_row[2] AS plz
    FROM (
      SELECT string_to_array(
        (ARRAY[
          'Berlin|10115','Berlin|10117','Berlin|10119','Berlin|10178','Berlin|10179',
          'Hamburg|20095','Hamburg|20097','Hamburg|20099','Hamburg|20144','Hamburg|21073',
          'München|80331','München|80333','München|80335','München|80339','München|81369',
          'Köln|50667','Köln|50672','Köln|50823','Köln|51063','Köln|51105',
          'Frankfurt am Main|60306','Frankfurt am Main|60311','Frankfurt am Main|60329','Frankfurt am Main|60431',
          'Stuttgart|70173','Stuttgart|70174','Stuttgart|70182','Stuttgart|70372',
          'Düsseldorf|40210','Düsseldorf|40212','Düsseldorf|40217','Düsseldorf|40468',
          'Dortmund|44135','Dortmund|44137','Dortmund|44263','Dortmund|44309',
          'Essen|45127','Essen|45128','Essen|45130','Essen|45219',
          'Leipzig|04103','Leipzig|04105','Leipzig|04107','Leipzig|04229',
          'Bremen|28195','Bremen|28197','Bremen|28199','Bremen|28357',
          'Dresden|01067','Dresden|01069','Dresden|01097','Dresden|01159',
          'Hannover|30159','Hannover|30161','Hannover|30169','Hannover|30419',
          'Nürnberg|90402','Nürnberg|90403','Nürnberg|90459','Nürnberg|90471',
          'Bonn|53111','Bonn|53113','Bonn|53115','Bonn|53119',
          'Münster|48143','Münster|48145','Münster|48147','Münster|48153',
          'Karlsruhe|76131','Karlsruhe|76133','Karlsruhe|76135','Karlsruhe|76139',
          'Augsburg|86150','Augsburg|86152','Augsburg|86153','Augsburg|86159',
          'Mainz|55116','Mainz|55118','Mainz|55120','Mainz|55122',
          'Kiel|24103','Kiel|24105','Kiel|24106','Kiel|24109',
          'Erfurt|99084','Erfurt|99085','Erfurt|99086','Erfurt|99089',
          'Rostock|18055','Rostock|18057','Rostock|18059','Rostock|18069',
          'Freiburg im Breisgau|79098','Freiburg im Breisgau|79100','Freiburg im Breisgau|79102','Freiburg im Breisgau|79104'
        ])[1 + abs(hashtext(gs::text)) % 96],
        '|'
      ) AS city_row
    ) t
  ) city_calc

  -- ── last name ─────────────────────────────────────────────────────────────
  CROSS JOIN LATERAL (
    SELECT (ARRAY[
      'Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner',
      'Becker','Schulz','Hoffmann','Schäfer','Koch','Bauer','Richter',
      'Klein','Wolf','Schröder','Neumann','Schwarz','Zimmermann',
      'Braun','Krüger','Hofmann','Hartmann','Lange','Schmitt','Werner',
      'Schmitz','Krause','Meier','Lehmann','Schmid','Schulze','Maier',
      'Köhler','Herrmann','Walter','Mayer','Huber','Kaiser','Fuchs',
      'Peters','Lang','Scholz','Möller','Weiß','Jung','Hahn','Schubert',
      'Vogel','Friedrich'
    ])[1 + abs(hashtext((gs + 1)::text)) % 50] AS ln
  ) lname_calc

  -- ── first name (used for ~1-in-8 person partners) ─────────────────────────
  CROSS JOIN LATERAL (
    SELECT (ARRAY[
      'Thomas','Michael','Andreas','Stefan','Christian','Klaus','Peter',
      'Frank','Jürgen','Markus','Martin','Wolfgang','Dieter','Hans',
      'Sabine','Petra','Claudia','Monika','Andrea','Ursula','Karin',
      'Maria','Christine','Sandra','Birgit','Heike','Susanne','Nicole',
      'Julia','Anna','Sarah','Lisa','Katharina','Johanna'
    ])[1 + abs(hashtext((gs + 2)::text)) % 34] AS fn
  ) fname_calc

  -- ── industry keyword ──────────────────────────────────────────────────────
  CROSS JOIN LATERAL (
    SELECT (ARRAY[
      'Bau','Metall','Transport','Logistik','Handel','Technik','Service',
      'Consulting','Engineering','Industrie','Produktion','Vertrieb',
      'Elektro','Software','Digital','Energie','Immobilien','Finanzen'
    ])[1 + abs(hashtext((gs + 3)::text)) % 18] AS ind
  ) ind_calc

  -- ── legal form (GmbH weighted 4×, AG/GmbH&CoKG 3× each, rest 1–2×) ───────
  CROSS JOIN LATERAL (
    SELECT (ARRAY[
      'GmbH','GmbH','GmbH','GmbH',
      'AG','AG','AG',
      'GmbH & Co. KG','GmbH & Co. KG','GmbH & Co. KG',
      'KG','KG',
      'OHG','GbR',
      'UG (haftungsbeschränkt)','e.K.','SE','GmbH & Co. OHG'
    ])[1 + abs(hashtext((gs + 4)::text)) % 18] AS lf
  ) lform_calc

  -- ── street ────────────────────────────────────────────────────────────────
  CROSS JOIN LATERAL (
    SELECT (ARRAY[
      'Hauptstraße','Bahnhofstraße','Schulstraße','Kirchstraße','Gartenstraße',
      'Waldstraße','Ringstraße','Poststraße','Bergstraße','Feldstraße',
      'Lindenstraße','Rosenstraße','Dorfstraße','Marktstraße','Buchenstraße',
      'Wiesenstraße','Mozartstraße','Goethestraße','Schillerstraße','Bismarckstraße',
      'Friedrichstraße','Wilhelmstraße','Kastanienallee','Birkenweg','Eichenweg',
      'Am Markt','Am Ring','Industriestraße','Gewerbestraße','Handelsstraße',
      'Neue Straße','Alte Straße','Berliner Straße','Kölner Straße','Frankfurter Straße'
    ])[1 + abs(hashtext((gs + 5)::text)) % 35] AS st
  ) street_calc;

  RAISE NOTICE 'V5: inserted 1,200,300 partner records.';
END $$;
