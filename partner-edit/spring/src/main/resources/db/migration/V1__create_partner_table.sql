CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE partner (
    id              BIGSERIAL PRIMARY KEY,
    partner_number  BIGINT UNIQUE,
    alpha_code      VARCHAR(10),
    name1           VARCHAR(35),
    name2           VARCHAR(35),
    name3           VARCHAR(35),
    firstname       VARCHAR(35),
    street          VARCHAR(35),
    house_number    VARCHAR(10),
    postal_code     VARCHAR(5),
    city            VARCHAR(35),
    type            CHAR(1) NOT NULL DEFAULT 'P',
    group_type      VARCHAR(10),
    group_number    BIGINT,
    name_search_vec TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('german',
            coalesce(name1,'') || ' ' || coalesce(name2,'') || ' ' ||
            coalesce(name3,'') || ' ' || coalesce(firstname,''))
    ) STORED
);

CREATE INDEX idx_partner_postal_code ON partner (postal_code);
CREATE INDEX idx_partner_alpha_code  ON partner (alpha_code);
CREATE INDEX idx_partner_name_tsv    ON partner USING GIN (name_search_vec);
CREATE INDEX idx_partner_city_trgm   ON partner USING GIN (lower(city)   gin_trgm_ops);
CREATE INDEX idx_partner_street_trgm ON partner USING GIN (lower(street) gin_trgm_ops);
CREATE INDEX idx_partner_name1_trgm  ON partner USING GIN (lower(name1)  gin_trgm_ops);
