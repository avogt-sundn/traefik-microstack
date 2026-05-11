-- Seed demo partners with varied German cities, postal codes, streets, names
INSERT INTO partner (partner_number, alpha_code, name1, name2, name3, firstname, street, house_number, postal_code, city, type, group_type, group_number) VALUES
-- Paderborn (33100)
(100001, 'MULL', 'Müller GmbH', 'Bürotechnik', NULL, NULL, 'Bahnhofstraße', '12', '33100', 'Paderborn', 'P', NULL, NULL),
(100002, 'SCHM', 'Schmidt & Partner KG', NULL, NULL, NULL, 'Westernstraße', '5', '33100', 'Paderborn', 'P', NULL, NULL),
(100003, 'PADB', 'Paderborner Druckerei AG', NULL, NULL, NULL, 'Liboristraße', '22', '33100', 'Paderborn', 'P', NULL, NULL),
(100004, 'TECH', 'TechVision GmbH', 'Software & Consulting', NULL, NULL, 'Borchener Straße', '99', '33100', 'Paderborn', 'P', NULL, NULL),
(100005, 'KAUF', 'Kaufmann Logistik', NULL, NULL, 'Hans', 'Detmolder Straße', '14', '33104', 'Paderborn', 'P', NULL, NULL),

-- München (80331)
(200001, 'BAYE', 'Bayern Finanz AG', NULL, NULL, NULL, 'Maximilianstraße', '8', '80331', 'München', 'P', NULL, NULL),
(200002, 'MUNC', 'Münchner Softwarehaus GmbH', 'IT-Lösungen', NULL, NULL, 'Kaufingerstraße', '3', '80331', 'München', 'P', NULL, NULL),
(200003, 'ALPL', 'Alpenland Immobilien KG', NULL, NULL, NULL, 'Leopoldstraße', '42', '80802', 'München', 'P', NULL, NULL),
(200004, 'ISAG', 'Isar Consulting AG', NULL, NULL, NULL, 'Sendlinger Straße', '67', '80331', 'München', 'P', NULL, NULL),
(200005, 'HOFB', 'Hofbräu Verwaltungs GmbH', NULL, NULL, NULL, 'Platzl', '9', '80331', 'München', 'P', NULL, NULL),

-- Hamburg (20095)
(300001, 'HAMB', 'Hamburger Handel GmbH', NULL, NULL, NULL, 'Mönckebergstraße', '17', '20095', 'Hamburg', 'P', NULL, NULL),
(300002, 'ELBU', 'Elbe Unternehmensberatung', NULL, NULL, NULL, 'Speicherstraße', '4', '20095', 'Hamburg', 'P', NULL, NULL),
(300003, 'HAFS', 'Hafenstädter Spedition AG', 'Logistik Nord', NULL, NULL, 'Freihafen Allee', '1', '20457', 'Hamburg', 'P', NULL, NULL),
(300004, 'ALBA', 'Alster Bauservice GmbH', NULL, NULL, NULL, 'Grindelallee', '33', '20144', 'Hamburg', 'P', NULL, NULL),
(300005, 'NORD', 'Nordsee Consulting KG', NULL, NULL, NULL, 'Jungfernstieg', '7', '20354', 'Hamburg', 'P', NULL, NULL),

-- Berlin (10115)
(400001, 'BERL', 'Berliner Innovations GmbH', NULL, NULL, NULL, 'Unter den Linden', '21', '10117', 'Berlin', 'P', NULL, NULL),
(400002, 'BRAN', 'Brandenburg Tech AG', 'Digital Solutions', NULL, NULL, 'Friedrichstraße', '50', '10117', 'Berlin', 'P', NULL, NULL),
(400003, 'KURF', 'Kurfürstendamm Immobilien', NULL, NULL, NULL, 'Kurfürstendamm', '110', '10711', 'Berlin', 'P', NULL, NULL),
(400004, 'SPRL', 'Spree Logistik GmbH', NULL, NULL, NULL, 'Invalidenstraße', '44', '10115', 'Berlin', 'P', NULL, NULL),
(400005, 'MITA', 'Mittelstand Allianz Berlin KG', NULL, NULL, NULL, 'Torstraße', '8', '10119', 'Berlin', 'P', NULL, NULL),

-- Köln (50667)
(500001, 'KOEL', 'Kölner Dom Reisen GmbH', NULL, NULL, NULL, 'Domkloster', '4', '50667', 'Köln', 'P', NULL, NULL),
(500002, 'RHEI', 'Rheinland Versicherungs AG', NULL, NULL, NULL, 'Schildergasse', '57', '50667', 'Köln', 'P', NULL, NULL),
(500003, 'VEED', 'Veedel Consulting KG', NULL, NULL, NULL, 'Hohenzollernring', '20', '50672', 'Köln', 'P', NULL, NULL),
(500004, 'KOMD', 'Kölner Mediendienstleister GmbH', 'Digital & Print', NULL, NULL, 'Aachener Straße', '66', '50674', 'Köln', 'P', NULL, NULL),

-- Stuttgart (70173)
(600001, 'STUT', 'Stuttgarter Maschinenbau AG', NULL, NULL, NULL, 'Königstraße', '1', '70173', 'Stuttgart', 'P', NULL, NULL),
(600002, 'PORS', 'Porsche Zulieferer GmbH', NULL, NULL, NULL, 'Zuffenhausener Weg', '11', '70435', 'Stuttgart', 'P', NULL, NULL),
(600003, 'BOWE', 'Bowen Engineering GmbH', NULL, NULL, NULL, 'Neckarstraße', '89', '70190', 'Stuttgart', 'P', NULL, NULL),

-- Frankfurt (60311)
(700001, 'FRAN', 'Frankfurter Finanzhaus AG', NULL, NULL, NULL, 'Zeil', '3', '60313', 'Frankfurt', 'P', NULL, NULL),
(700002, 'MAIN', 'Main Consulting GmbH', 'Finanzberatung', NULL, NULL, 'Hauptwache', '2', '60311', 'Frankfurt', 'P', NULL, NULL),
(700003, 'EURO', 'Euro Capital Partners KG', NULL, NULL, NULL, 'Taunusanlage', '12', '60325', 'Frankfurt', 'P', NULL, NULL),
(700004, 'BOCF', 'Bockenheimer Immobilien GmbH', NULL, NULL, NULL, 'Bockenheimer Landstraße', '25', '60325', 'Frankfurt', 'P', NULL, NULL),

-- Dresden (01067)
(800001, 'DRES', 'Dresdner Technik AG', NULL, NULL, NULL, 'Prager Straße', '10', '01069', 'Dresden', 'P', NULL, NULL),
(800002, 'ELBE', 'Elbe Digital GmbH', NULL, NULL, NULL, 'Neumarkt', '2', '01067', 'Dresden', 'P', NULL, NULL),
(800003, 'SAXI', 'Sachsen IT Consulting KG', 'Software & Systeme', NULL, NULL, 'Wilsdruffer Straße', '4', '01067', 'Dresden', 'P', NULL, NULL),

-- Düsseldorf
(900001, 'DUES', 'Düsseldorfer Mode AG', NULL, NULL, NULL, 'Königsallee', '30', '40212', 'Düsseldorf', 'P', NULL, NULL),
(900002, 'RHDU', 'Rhein Düssel Handel GmbH', NULL, NULL, NULL, 'Flinger Straße', '15', '40213', 'Düsseldorf', 'P', NULL, NULL),

-- Nürnberg
(950001, 'NURB', 'Nürnberger Versicherungsgruppe KG', NULL, NULL, NULL, 'Kaiserstraße', '5', '90402', 'Nürnberg', 'P', NULL, NULL),
(950002, 'FRAN', 'Franken Logistik GmbH', NULL, NULL, NULL, 'Bahnhofplatz', '8', '90443', 'Nürnberg', 'P', NULL, NULL),

-- Leipzig
(960001, 'LEIP', 'Leipziger Messe AG', NULL, NULL, NULL, 'Messe-Allee', '1', '04356', 'Leipzig', 'P', NULL, NULL),
(960002, 'PLET', 'Pleißetal Consulting GmbH', NULL, NULL, NULL, 'Nikolaistraße', '16', '04109', 'Leipzig', 'P', NULL, NULL),

-- Verbund entries (type='V')
(990001, 'VGRP', 'Verbund Gruppe Nord', NULL, NULL, NULL, 'Alsterring', '1', '20099', 'Hamburg', 'V', 'INTERN', NULL),
(990002, 'VGRS', 'Verbund Gruppe Süd', NULL, NULL, NULL, 'Münchner Damm', '5', '80339', 'München', 'V', 'INTERN', NULL),
(990003, 'VEXT', 'Externer Verbund West', NULL, NULL, NULL, 'Rheinufer', '12', '50679', 'Köln', 'V', 'EXTERN', NULL),
(990004, 'VEXB', 'Externer Verbund Berlin', NULL, NULL, NULL, 'Spreestraße', '3', '10179', 'Berlin', 'V', 'EXTERN', NULL),

-- Some with firstname (private persons / Einzelunternehmer)
(101001, 'WAGN', 'Wagner', NULL, NULL, 'Klaus', 'Gartenstraße', '7', '33175', 'Bad Lippspringe', 'P', NULL, NULL),
(101002, 'BERN', 'Bernhardt', NULL, NULL, 'Maria', 'Rosenweg', '3', '33154', 'Salzkotten', 'P', NULL, NULL),
(101003, 'WOLF', 'Wolf', NULL, NULL, 'Thomas', 'Birkenallee', '11', '33142', 'Büren', 'P', NULL, NULL),

-- Group members referencing verbund
(991001, 'GNHH', 'Nord Member GmbH', NULL, NULL, NULL, 'Hafenstraße', '8', '20457', 'Hamburg', 'P', NULL, 990001),
(991002, 'GNSH', 'Süd Member AG', NULL, NULL, NULL, 'Sonnenstraße', '4', '80331', 'München', 'P', NULL, 990002);
