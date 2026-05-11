#!/usr/bin/env python3
"""
Generate up to 1,000,000 realistic German partner records for demo/testing.

Outputs a PostgreSQL COPY-format file for fast bulk loading.
Partner numbers start at 1_000_000 to avoid collisions with Flyway seed data.

Usage:
    python3 generate-partners.py --count 100000 > partners.sql
    python3 generate-partners.py --count 1000000 --format copy > partners_copy.sql
    python3 generate-partners.py --count 50000 --format es-bulk > partners_es.ndjson
    python3 generate-partners.py --count 100 --seed 42  # reproducible output
"""

import argparse
import random
import sys

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

# (city, [postal_codes])
CITIES = [
    ("Berlin",          ["10115", "10117", "10119", "10178", "10179", "10243", "10315", "10405", "10553", "12043", "13055", "13086"]),
    ("Hamburg",         ["20095", "20097", "20099", "20144", "20251", "21073", "22041", "22089", "22305", "22459"]),
    ("München",         ["80331", "80333", "80335", "80339", "80636", "81369", "81379", "81539", "81675", "81925"]),
    ("Köln",            ["50667", "50668", "50672", "50733", "50823", "51063", "51105", "51149"]),
    ("Frankfurt am Main", ["60306", "60311", "60329", "60385", "60431", "60486", "60598", "65929"]),
    ("Stuttgart",       ["70173", "70174", "70182", "70372", "70435", "70499", "70563", "70619"]),
    ("Düsseldorf",      ["40210", "40212", "40217", "40468", "40591", "40627", "40629"]),
    ("Dortmund",        ["44135", "44137", "44141", "44227", "44263", "44309", "44388"]),
    ("Essen",           ["45127", "45128", "45130", "45147", "45219", "45276", "45359"]),
    ("Leipzig",         ["04103", "04105", "04107", "04129", "04155", "04229", "04357"]),
    ("Bremen",          ["28195", "28197", "28199", "28207", "28217", "28357", "28779"]),
    ("Dresden",         ["01067", "01069", "01097", "01129", "01159", "01217", "01328"]),
    ("Hannover",        ["30159", "30161", "30163", "30169", "30419", "30519", "30669"]),
    ("Nürnberg",        ["90402", "90403", "90409", "90429", "90459", "90471", "90480"]),
    ("Duisburg",        ["47051", "47053", "47057", "47119", "47167", "47239", "47279"]),
    ("Bochum",          ["44787", "44789", "44791", "44803", "44805", "44867", "44894"]),
    ("Wuppertal",       ["42103", "42105", "42107", "42109", "42275", "42327", "42399"]),
    ("Bielefeld",       ["33602", "33604", "33607", "33611", "33647", "33699", "33739"]),
    ("Bonn",            ["53111", "53113", "53115", "53119", "53173", "53177", "53229"]),
    ("Münster",         ["48143", "48145", "48147", "48149", "48153", "48159", "48167"]),
    ("Paderborn",       ["33098", "33100", "33102", "33104", "33106"]),
    ("Karlsruhe",       ["76131", "76133", "76135", "76137", "76139", "76189", "76229"]),
    ("Augsburg",        ["86150", "86152", "86153", "86154", "86159", "86179", "86199"]),
    ("Wiesbaden",       ["65183", "65185", "65187", "65189", "65191", "65195", "65207"]),
    ("Mönchengladbach", ["41061", "41063", "41065", "41069", "41169", "41238", "41239"]),
    ("Braunschweig",    ["38100", "38102", "38106", "38112", "38114", "38118", "38126"]),
    ("Kiel",            ["24103", "24105", "24106", "24109", "24114", "24143", "24159"]),
    ("Chemnitz",        ["09111", "09112", "09113", "09116", "09119", "09120", "09130"]),
    ("Aachen",          ["52062", "52064", "52066", "52068", "52070", "52072", "52078"]),
    ("Erfurt",          ["99084", "99085", "99086", "99089", "99092", "99094", "99099"]),
    ("Mainz",           ["55116", "55118", "55120", "55122", "55124", "55126", "55131"]),
    ("Rostock",         ["18055", "18057", "18059", "18069", "18106", "18107"]),
    ("Kassel",          ["34117", "34119", "34121", "34123", "34125", "34127", "34132"]),
    ("Halle (Saale)",   ["06108", "06110", "06112", "06114", "06116", "06118", "06132"]),
    ("Freiburg im Breisgau", ["79098", "79100", "79102", "79104", "79106", "79108", "79117"]),
    ("Magdeburg",       ["39104", "39106", "39108", "39112", "39114", "39116", "39130"]),
    ("Oberhausen",      ["46045", "46047", "46049", "46117", "46119", "46147", "46149"]),
    ("Lübeck",          ["23552", "23554", "23556", "23558", "23560", "23562", "23569"]),
    ("Krefeld",         ["47798", "47799", "47800", "47803", "47805", "47809", "47839"]),
    ("Gelsenkirchen",   ["45879", "45881", "45883", "45886", "45889", "45894", "45897"]),
]

# Common German street names (appear in many cities = real-life similarity clusters)
COMMON_STREETS = [
    "Hauptstraße", "Bahnhofstraße", "Schulstraße", "Kirchstraße", "Gartenstraße",
    "Waldstraße", "Ringstraße", "Poststraße", "Bergstraße", "Feldstraße",
    "Lindenstraße", "Rosenstraße", "Dorfstraße", "Marktstraße", "Buchenstraße",
    "Wiesenstraße", "Mozartstraße", "Goethestraße", "Schillerstraße", "Bismarckstraße",
    "Friedrichstraße", "Wilhelmstraße", "Kastanienallee", "Birkenweg", "Eichenweg",
    "Am Markt", "Am Ring", "Am Bach", "Kurzer Weg", "Langer Weg",
    "Industriestraße", "Gewerbestraße", "Handelsstraße", "Hafenstraße",
    "Neue Straße", "Alte Straße", "Hintere Straße", "Vordere Straße",
]

# City-referencing street names for cross-city realism
CITY_REF_STREET_TEMPLATES = [
    "Berliner Straße", "Kölner Straße", "Frankfurter Straße", "Hamburger Straße",
    "Münchner Straße", "Düsseldorfer Straße", "Stuttgarter Straße", "Dortmunder Straße",
    "Hannoversche Straße", "Bremer Straße",
]

ALL_STREETS = COMMON_STREETS + CITY_REF_STREET_TEMPLATES

# Company name building blocks
NAME_PREFIXES_GEO = [
    "Nord", "Süd", "West", "Ost", "Mittel", "Rhein", "Main", "Elbe", "Weser", "Ruhr",
    "Norddeutsche", "Süddeutsche", "Westdeutsche", "Ostdeutsche", "Mitteldeutsche",
    "Rheinische", "Westfälische", "Bayerische", "Badische", "Hessische", "Sächsische",
]

NAME_CORE_INDUSTRY = [
    "Bau", "Metall", "Transport", "Logistik", "Handel", "Technik", "Service",
    "Consulting", "Engineering", "Industrie", "Produktion", "Vertrieb", "Montage",
    "Elektro", "Sanitär", "Heizung", "Dach", "Fenster", "Tür", "Holz",
    "Textil", "Lebensmittel", "Pharma", "Chemie", "Auto", "Fahrzeug", "Druck",
    "Medien", "IT", "Software", "Digital", "Data", "Energie", "Solar", "Wind",
    "Immobilien", "Verwaltung", "Steuer", "Recht", "Finanzen", "Versicherung",
    "Leasing", "Factoring", "Kapital", "Invest", "Holding",
]

LEGAL_FORMS = [
    "GmbH", "AG", "GmbH & Co. KG", "KG", "OHG", "GbR", "UG (haftungsbeschränkt)",
    "e.K.", "SE", "GmbH & Co. OHG",
]
LEGAL_FORMS_WEIGHTS = [40, 15, 15, 10, 5, 5, 4, 3, 2, 1]  # GmbH most common

# Common German last names (used both for company names and natural persons)
LAST_NAMES = [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
    "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter",
    "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
    "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner",
    "Schmitz", "Krause", "Meier", "Lehmann", "Schmid", "Schulze", "Maier",
    "Köhler", "Herrmann", "Walter", "Mayer", "Huber", "Kaiser", "Fuchs",
    "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert",
    "Vogel", "Friedrich", "Keller", "Günther", "Frank", "Berger", "Winkler",
    "Roth", "Beck", "Lorenz", "Baumann", "Franke", "Albrecht", "Schuster",
    "Simon", "Ludwig", "Böhm", "Winter", "Kramer", "Vogt", "Haas", "Sommer",
    "Gruber", "Brandt", "Büttner", "Engel", "Lenz", "Kolb", "Pohl", "Kühn",
    "Seidel", "Bruns", "Stahl", "Metz", "Paul", "Busch", "Horn", "Voigt",
    "Bergmann", "Thomas", "Hesse", "Kunze", "Henning", "Ziegler", "Kraft",
]

FIRST_NAMES_M = [
    "Thomas", "Michael", "Andreas", "Stefan", "Christian", "Klaus", "Peter",
    "Frank", "Jürgen", "Markus", "Matthias", "Martin", "Wolfgang", "Dieter",
    "Hans", "Karl", "Rainer", "Bernd", "Werner", "Uwe", "Holger", "Dirk",
    "Tobias", "Daniel", "Florian", "Jan", "Philipp", "Sebastian", "Steffen",
    "Oliver", "Robert", "Alexander", "Christoph", "Johannes", "Patrick",
]

FIRST_NAMES_F = [
    "Sabine", "Petra", "Claudia", "Monika", "Andrea", "Ursula", "Karin",
    "Maria", "Christine", "Sandra", "Birgit", "Heike", "Susanne", "Nicole",
    "Anja", "Brigitte", "Gabriele", "Stefanie", "Julia", "Laura", "Anna",
    "Sarah", "Lisa", "Katharina", "Johanna", "Melanie", "Simone", "Silke",
    "Bettina", "Kirsten", "Renate", "Ingrid", "Angelika",
]

FIRST_NAMES = FIRST_NAMES_M + FIRST_NAMES_F


def make_alpha_code(name: str, rng: random.Random) -> str:
    """Derive an alpha code from a name: uppercase consonants/initials, max 10 chars."""
    parts = name.upper().split()
    # Take first letter of each word, then fill with consonants from first word
    code = "".join(p[0] for p in parts if p)
    if len(code) < 4 and parts:
        consonants = [c for c in parts[0] if c.isalpha() and c not in "AEIOUÄÖÜ"]
        code += "".join(consonants[:6])
    # Strip non-alphanumeric and truncate
    code = "".join(c for c in code if c.isalnum())[:10]
    return code or "PTNR"


def pick_legal_form(rng: random.Random) -> str:
    return rng.choices(LEGAL_FORMS, weights=LEGAL_FORMS_WEIGHTS, k=1)[0]


def make_company_name(rng: random.Random, city: str | None = None) -> tuple[str, str, str]:
    """Return (name1, name2, name3). name2/name3 may be empty."""
    style = rng.randint(1, 5)

    if style == 1:
        # GeoPrefix + Industry + LegalForm  e.g. "Norddeutsche Transport GmbH"
        name1 = f"{rng.choice(NAME_PREFIXES_GEO)}{rng.choice(NAME_CORE_INDUSTRY)} {pick_legal_form(rng)}"
        return name1[:35], "", ""

    elif style == 2:
        # City + Industry + LegalForm  e.g. "Paderborner Logistik GmbH"
        if city:
            base = city.split()[0]  # "Frankfurt am Main" -> "Frankfurt"
            suffix = "er" if not base.endswith("e") else "r"
            name1 = f"{base}{suffix} {rng.choice(NAME_CORE_INDUSTRY)} {pick_legal_form(rng)}"
        else:
            name1 = f"{rng.choice(NAME_PREFIXES_GEO)}{rng.choice(NAME_CORE_INDUSTRY)} {pick_legal_form(rng)}"
        return name1[:35], "", ""

    elif style == 3:
        # LastName + Industry + LegalForm  e.g. "Müller Bau GmbH"
        name1 = f"{rng.choice(LAST_NAMES)} {rng.choice(NAME_CORE_INDUSTRY)} {pick_legal_form(rng)}"
        return name1[:35], "", ""

    elif style == 4:
        # LastName & Söhne/Partner  e.g. "Schmidt & Söhne GmbH"
        variants = ["& Söhne", "& Partner", "& Co.", "und Söhne", "& Sohn"]
        name1 = f"{rng.choice(LAST_NAMES)} {rng.choice(variants)} {pick_legal_form(rng)}"
        return name1[:35], "", ""

    else:
        # Two-line company  e.g. name1="Müller" name2="Metall GmbH"
        name1 = rng.choice(LAST_NAMES)
        name2 = f"{rng.choice(NAME_CORE_INDUSTRY)} {pick_legal_form(rng)}"
        return name1[:35], name2[:35], ""


def make_person_name(rng: random.Random) -> tuple[str, str, str, str]:
    """Return (name1=last, name2='', name3='', firstname)."""
    last = rng.choice(LAST_NAMES)
    first = rng.choice(FIRST_NAMES)
    return last, "", "", first


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def generate(
    count: int,
    fmt: str,
    seed: int | None,
    verbund_ratio: float = 0.08,
    person_ratio: float = 0.12,
    start_number: int = 1_000_000,
) -> None:
    rng = random.Random(seed)

    # Pre-build a pool of ~5000 Verbund records first so members can reference them
    n_verbund = max(10, int(count * verbund_ratio))
    n_persons = max(0, int(count * person_ratio))
    n_companies = count - n_verbund - n_persons

    # Each Verbund gets a list of member slots; we'll assign during output
    verbund_numbers: list[int] = []
    verbund_group_types: list[str] = []

    partner_number = start_number

    # -----------------------------------------------------------------------
    # Helper: emit one record in the requested format
    # -----------------------------------------------------------------------
    rows: list[tuple] = []

    def emit(pn, alpha, n1, n2, n3, fn, street, hnr, plz, city, typ, gt, gn):
        alpha_safe = alpha[:10]
        rows.append((pn, alpha_safe, n1[:35], n2[:35], n3[:35], fn[:35],
                     street[:35], hnr[:10], plz[:5], city[:35], typ, gt[:10] if gt else "", gn))

    # -----------------------------------------------------------------------
    # 1. Verbund records
    # -----------------------------------------------------------------------
    for _ in range(n_verbund):
        city_name, plz_list = rng.choice(CITIES)
        plz = rng.choice(plz_list)
        street = rng.choice(ALL_STREETS)
        hnr = str(rng.randint(1, 250))
        n1, n2, n3 = make_company_name(rng, city_name)
        alpha = make_alpha_code(n1, rng)
        gt = rng.choice(["INTERN", "EXTERN"])
        emit(partner_number, alpha, n1, n2, n3, "", street, hnr, plz, city_name, "V", gt, 0)
        verbund_numbers.append(partner_number)
        verbund_group_types.append(gt)
        partner_number += 1

    # -----------------------------------------------------------------------
    # 2. Company partners (type=P, no firstname)
    #    Build in clusters for realism
    # -----------------------------------------------------------------------
    # Cluster definitions: each cluster biases toward a city or street
    cluster_city_weights = [1 + (len(plz) // 2) for _, plz in CITIES]

    for _ in range(n_companies):
        # 60% city-cluster, 40% street-cluster (same street name, different cities)
        if rng.random() < 0.6:
            # city cluster: pick city biased by its PLZ count (larger city = more partners)
            city_name, plz_list = rng.choices(CITIES, weights=cluster_city_weights, k=1)[0]
            plz = rng.choice(plz_list)
            street = rng.choice(ALL_STREETS)
        else:
            # street cluster: fix street, random city
            street = rng.choice(COMMON_STREETS)  # only common ones for cross-city streets
            city_name, plz_list = rng.choice(CITIES)
            plz = rng.choice(plz_list)

        hnr = str(rng.randint(1, 350))
        n1, n2, n3 = make_company_name(rng, city_name)
        alpha = make_alpha_code(n1, rng)

        # ~15% of companies belong to a Verbund
        gn = 0
        gt = ""
        if verbund_numbers and rng.random() < 0.15:
            idx = rng.randrange(len(verbund_numbers))
            gn = verbund_numbers[idx]
            gt = verbund_group_types[idx]

        emit(partner_number, alpha, n1, n2, n3, "", street, hnr, plz, city_name, "P", gt, gn)
        partner_number += 1

    # -----------------------------------------------------------------------
    # 3. Natural persons (type=P, with firstname)
    # -----------------------------------------------------------------------
    for _ in range(n_persons):
        city_name, plz_list = rng.choices(CITIES, weights=cluster_city_weights, k=1)[0]
        plz = rng.choice(plz_list)
        street = rng.choice(ALL_STREETS)
        hnr = str(rng.randint(1, 200))
        last, n2, n3, first = make_person_name(rng)
        alpha = make_alpha_code(last + first, rng)

        gn = 0
        gt = ""
        if verbund_numbers and rng.random() < 0.05:
            idx = rng.randrange(len(verbund_numbers))
            gn = verbund_numbers[idx]
            gt = verbund_group_types[idx]

        emit(partner_number, alpha, last, n2, n3, first, street, hnr, plz, city_name, "P", gt, gn)
        partner_number += 1

    # -----------------------------------------------------------------------
    # Output
    # -----------------------------------------------------------------------
    if fmt == "copy":
        _output_copy(rows)
    elif fmt == "insert":
        _output_insert(rows)
    elif fmt == "es-bulk":
        _output_es_bulk(rows)
    else:
        raise ValueError(f"Unknown format: {fmt}")

    sys.stderr.write(f"Generated {len(rows)} records "
                     f"({n_verbund} Verbund, {n_companies} companies, {n_persons} persons)\n")


def _output_copy(rows):
    """PostgreSQL COPY FROM STDIN — fastest bulk load method."""
    print("-- Generated partner data: PostgreSQL COPY format")
    print("-- Load with:  psql -h localhost -U postgres -d postgres -f this_file.sql")
    print()
    print("COPY partner (partner_number, alpha_code, name1, name2, name3, firstname,")
    print("              street, house_number, postal_code, city, type, group_type, group_number)")
    print("FROM STDIN WITH (FORMAT text, DELIMITER E'\\t', NULL '');")
    for r in rows:
        pn, alpha, n1, n2, n3, fn, street, hnr, plz, city, typ, gt, gn = r
        gn_str = str(gn) if gn else ""
        line = "\t".join([
            str(pn), alpha, n1, n2, n3, fn, street, hnr, plz, city, typ, gt, gn_str
        ])
        print(line)
    print("\\.")
    print()
    print("-- Update partner_number sequence so future inserts don't collide")
    max_pn = max(r[0] for r in rows)
    print(f"SELECT setval(pg_get_serial_sequence('partner', 'id'),")
    print(f"       (SELECT MAX(id) FROM partner));")
    print(f"-- Note: partner_number is a plain bigint column, not a sequence.")
    print(f"-- Max partner_number in this batch: {max_pn}")


def _output_insert(rows):
    """Standard SQL INSERT statements (slower but portable)."""
    print("-- Generated partner data: SQL INSERT format")
    print("BEGIN;")
    for r in rows:
        pn, alpha, n1, n2, n3, fn, street, hnr, plz, city, typ, gt, gn = r

        def q(s):
            return f"'{sql_escape(s)}'" if s else "NULL"

        gn_sql = str(gn) if gn else "NULL"
        print(
            f"INSERT INTO partner "
            f"(partner_number,alpha_code,name1,name2,name3,firstname,"
            f"street,house_number,postal_code,city,type,group_type,group_number) VALUES "
            f"({pn},{q(alpha)},{q(n1)},{q(n2)},{q(n3)},{q(fn)},"
            f"{q(street)},{q(hnr)},{q(plz)},{q(city)},{q(typ)},{q(gt)},{gn_sql});"
        )
    print("COMMIT;")


def _output_es_bulk(rows):
    """Elasticsearch bulk API NDJSON format."""
    import json
    for r in rows:
        pn, alpha, n1, n2, n3, fn, street, hnr, plz, city, typ, gt, gn = r
        meta = json.dumps({"index": {"_index": "partners", "_id": str(pn)}})
        doc = {
            "partnerNumber": pn,
            "alphaCode": alpha,
            "name1": n1,
            "name2": n2 or None,
            "name3": n3 or None,
            "firstname": fn or None,
            "street": street,
            "houseNumber": hnr,
            "postalCode": plz,
            "city": city,
            "type": typ,
            "groupType": gt or None,
            "groupNumber": gn if gn else None,
        }
        # Remove None values for cleaner ES docs
        doc = {k: v for k, v in doc.items() if v is not None}
        print(meta)
        print(json.dumps(doc, ensure_ascii=False))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate realistic German partner test data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 100k records as PostgreSQL COPY (fastest import):
  python3 generate-partners.py --count 100000 > partners_100k.sql

  # 1M records:
  python3 generate-partners.py --count 1000000 --format copy > partners_1m.sql

  # 50k records as plain INSERT (portable):
  python3 generate-partners.py --count 50000 --format insert > partners_inserts.sql

  # Elasticsearch bulk NDJSON:
  python3 generate-partners.py --count 200000 --format es-bulk > partners_es.ndjson

  # Reproducible output (fixed seed):
  python3 generate-partners.py --count 10000 --seed 42 > partners_fixed.sql

  # Load into running container:
  python3 generate-partners.py --count 100000 | \\
    docker exec -i traefik-microstack-postgres-partner-1 \\
      psql -U postgres -d postgres
""",
    )
    parser.add_argument("--count", type=int, default=10_000,
                        help="Number of partners to generate (default: 10000, max: 1000000)")
    parser.add_argument("--format", choices=["copy", "insert", "es-bulk"], default="copy",
                        help="Output format (default: copy)")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed for reproducible output")
    parser.add_argument("--start", type=int, default=1_000_000,
                        help="Starting partner number (default: 1000000)")
    args = parser.parse_args()

    if args.count > 10_000_000:
        parser.error("--count cannot exceed 10,000,000")
    if args.count < 1:
        parser.error("--count must be at least 1")

    generate(args.count, args.format, args.seed, start_number=args.start)


if __name__ == "__main__":
    main()
