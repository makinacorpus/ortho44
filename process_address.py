import json

communes_json = open("BDAdresse_IGN/communes.geojson")
lieux_json = open("BDAdresse_IGN/lieux.geojson")
sdis_json = open("BDAdresse_IGN/sdis.geojson")
adresses_json = open("BDAdresse_IGN/adresses.geojson")

all_abrev = [
"ABE", "ABBAYE",
"AGL", "AGGLOMERATION",
"AIRE", "AIRE",
"AIRE", "AIRES",
"ALL", "ALLEE",
"ALL", "ALLEES",
"ACH", "ANCIEN CHEMIN",
"ACH", "ANCIEN-CHEMIN",
"AMT", "ANCIENNE MONTEE",
"ART", "ANCIENNE ROUTE",
"AMT", "ANCIENNE-MONTEE",
"ART", "ANCIENNE-ROUTE",
"ART", "ANCIENNESROUTES",
"ART", "ANCIENNES-ROUTES",
"ACH", "ANCIENS CHEMINS",
"ACH", "ANCIENS-CHEMINS",
"ANSE", "ANSE",
"ARC", "ARCADE",
"ARC", "ARCADES",
"AUT", "AUTOROUTE",
"AV", "AVENUE",
"BRE", "BARRIERE",
"BRE", "BARRIERES",
"BCH", "BAS CHEMIN",
"BCH", "BAS-CHEMIN",
"BSTD", "BASTIDE",
"BAST", "BASTION",
"BEGI", "BEGUINAGE",
"BEGI", "BEGUINAGES",
"BER", "BERGE",
"BER", "BERGES",
"BOIS", "BOIS",
"BCLE", "BOUCLE",
"BD", "BOULEVARD",
"BRG", "BOURG",
"BUT", "BUTTE",
"BD", "BVD",
"CALE", "CALE",
"CAMP", "CAMP",
"CGNE", "CAMPAGNE",
"CPG", "CAMPING",
"CARR", "CARRE",
"CAU", "CARREAU",
"CAR", "CARREFOUR",
"CARE", "CARRIERE",
"CARE", "CARRIERES",
"CST", "CASTEL",
"CAV", "CAVEE",
"CTRE", "CENTRAL",
"CTRE", "CENTRE",
"CCAL", "CENTRE CIAL",
"CCAL", "CENTRE COM",
"CCAL", "CENTRE COMM",
"CCAL", "CENTRE COMMERCIAL",
"CHL", "CHALET",
"CHP", "CHAPELLE",
"CHI", "CHARMILLE",
"CHT", "CHATEAU",
"CHS", "CHAUSSEE",
"CHS", "CHAUSSEES",
"CHE", "CHEM",
"CHE", "CHEMIN",
"CHV", "CHEMIN VICINAL",
"CHEM", "CHEMINEMENT",
"CHEM", "CHEMINEMENTS",
"CHE", "CHEMINS",
"CHV", "CHEMINS VICINAUX",
"CHV", "CHEMINS-VICINAUX",
"CHV", "CHEMIN-VICINAL",
"CHEZ", "CHEZ",
"CITE", "CITE",
"CITE", "CITES",
"CLOI", "CLOITRE",
"CLOS", "CLOS",
"COL", "COL",
"COLI", "COLLINE",
"COLI", "COLLINES",
"CTR", "CONTOUR",
"COR", "CORNICHE",
"COR", "CORNICHES",
"COTE", "COTE",
"COTE", "COTEAU",
"COTE", "COTEAUX",
"COTT", "COTTAGE",
"COTT", "COTTAGES",
"COUR", "COUR",
"CRS", "COURS",
"CCAL", "CTRE CIAL",
"CCAL", "CTRE COM",
"CCAL", "CTRE COMM",
"CCAL", "CTRE COMMERCIAL",
"DARS", "DARSE",
"DEG", "DEGRE",
"DEG", "DEGRES",
"DSC", "DESCENTE",
"DSC", "DESCENTES",
"DIG", "DIGUE",
"DIG", "DIGUES",
"DOM", "DOMAINE",
"DOM", "DOMAINES",
"ECL", "ECLUSE",
"ECL", "ECLUSES",
"EGL", "EGLISE",
"EN", "ENCEINTE",
"ENV", "ENCLAVE",
"ENC", "ENCLOS",
"ESC", "ESCALIER",
"ESC", "ESCALIERS",
"ESPA", "ESPACE",
"ESP", "ESPLANADE",
"ESP", "ESPLANADES",
"ETNG", "ETANG",
"FG", "FBG",
"FG", "FAUBOURG",
"FRM", "FERME",
"FRM", "FERMES",
"FON", "FONTAINE",
"FORT", "FORT",
"FORM", "FORUM",
"FOS", "FOSSE",
"FOS", "FOSSES",
"FOYR", "FOYER",
"GAL", "GALERIE",
"GAL", "GALERIES",
"GARE", "GARE",
"GARN", "GARENNE",
"GBD", "GRAND BOULEVARD",
"GDEN", "GRAND ENSEMBLE",
"GR", "GRANDRUE",
"GBD", "GRAND-BOULEVARD",
"GR", "GRANDE RUE",
"GDEN", "GRAND-ENSEMBLE",
"GR", "GRANDE-RUE",
"GR", "GRANDES RUES",
"GR", "GRANDES-RUES",
"GR", "GRAND-RUE",
"GDEN", "GRANDS ENSEMBLES",
"GDEN", "GRANDS-ENSEMBLES",
"GRI", "GRILLE",
"GRIM", "GRIMPETTE",
"GPE", "GROUPE",
"GPT", "GROUPEMENT",
"GPE", "GROUPES",
"HLE", "HALLE",
"HLE", "HALLES",
"HAM", "HAMEAU",
"HAM", "HAMEAUX",
"HCH", "HAUT CHEMIN",
"HCH", "HAUT-CHEMIN",
"HCH", "HAUTS CHEMINS",
"HCH", "HAUTS-CHEMINS",
"HIP", "HIPPODROME",
"HLM", "HLM",
"ILE", "ILE",
"IMM", "IMMEUBLE",
"IMM", "IMMEUBLES",
"IMP", "IMPASSE",
"IMP", "IMPASSES",
"JARD", "JARDIN",
"JARD", "JARDINS",
"JTE", "JETEE",
"JTE", "JETEES",
"LEVE", "LEVEE",
"LD", "LIEUDIT",
"LD", "LIEU-DIT",
"LOT", "LOTISSEMENT",
"LOT", "LOTISSEMENTS",
"MAIL", "MAIL",
"MF", "MAISON FORESTIERE",
"MF", "MAISON-FORESTIERE",
"MAN", "MANOIR",
"MAR", "MARCHE",
"MAR", "MARCHES",
"MAS", "MAS",
"MET", "METRO",
"MTE", "MONTEE",
"MTE", "MONTEES",
"MLN", "MOULIN",
"MLN", "MOULINS",
"MUS", "MUSEE",
"NTE", "NOUVELLE ROUTE",
"NTE", "NOUVELLE-ROUTE",
"PAL", "PALAIS",
"PARC", "PARC",
"PARC", "PARCS",
"PKG", "PARKING",
"PRV", "PARVIS",
"PAS", "PASSAGE",
"PN", "PASSAGE A NIVEAU",
"PN", "PASSAGE-A-NIVEAU",
"PASS", "PASSE",
"PLE", "PASSERELLE",
"PLE", "PASSERELLES",
"PASS", "PASSES",
"PAT", "PATIO",
"PAV", "PAVILLON",
"PAV", "PAVILLONS",
"PERI", "PERIPHERIQUE",
"PSTY", "PERISTYLE",
"PCH", "PETIT CHEMIN",
"PDEG", "PETIT DEGRE",
"PCH", "PETIT-CHEMIN",
"PDEG", "PETIT-DEGRE",
"PTA", "PETITE ALLEE",
"PAE", "PETITE AVENUE",
"PIM", "PETITE IMPASSE",
"PRT", "PETITE ROUTE",
"PTR", "PETITE RUE",
"PTA", "PETITE-ALLEE",
"PAE", "PETITE-AVENUE",
"PIM", "PETITE-IMPASSE",
"PRT", "PETITE-ROUTE",
"PTR", "PETITE-RUE",
"PTA", "PETITES ALLEES",
"PTA", "PETITES-ALLEES",
"PDEG", "PETITS DEGRES",
"PDEG", "PETITS-DEGRES",
"PL", "PLACE",
"PLCI", "PLACIS",
"PLAG", "PLAGE",
"PLAG", "PLAGES",
"PLN", "PLAINE",
"PLAN", "PLAN",
"PLT", "PLATEAU",
"PLT", "PLATEAUX",
"PNT", "POINTE",
"PONT", "PONT",
"PONT", "PONTS",
"PCH", "PORCHE",
"PORT", "PORT",
"PTE", "PORTE",
"PORQ", "PORTIQUE",
"PORQ", "PORTIQUES",
"POT", "POTERNE",
"POUR", "POURTOUR",
"PRE", "PRE",
"PRQ", "PRESQU ILE",
"PRQ", "PRESQU'ILE",
"PRQ", "PRESQU-ILE",
"PROM", "PROMENADE",
"QUA", "QRT",
"QU", "QUAI",
"QUA", "QUARTIER",
"RAC", "RACCOURCI",
"RAID", "RAIDILLON",
"RPE", "RAMPE",
"REM", "REMPART",
"REM", "RPR",
"RES", "RESIDENCE",
"RES", "RESIDENCES",
"ROC", "ROC",
"ROC", "ROCADE",
"RPT", "ROND POINT",
"RPT", "ROND-POINT",
"ROQT", "ROQUET",
"RTD", "ROTONDE",
"RTE", "ROUTE",
"RTE", "ROUTES",
"R", "RUE",
"RLE", "RUELLE",
"RLE", "RUELLES",
"R", "RUES",
"SEN", "SENTE",
"SEN", "SENTES",
"SEN", "SENTIER",
"SEN", "SENTIERS",
"SQ", "SQUARE",
"STDE", "STADE",
"STA", "STATION",
"SEN", "STR",
"TRN", "TERRAIN",
"TSSE", "TERRASSE",
"TSSE", "TERRASSES",
"TPL", "TERRE PLEIN",
"TPL", "TERRE-PLEIN",
"TRT", "TERTRE",
"TRT", "TERTRES",
"TOUR", "TOUR",
"TRA", "TRAVERSE",
"VAL", "VAL",
"VAL", "VALLEE",
"VAL", "VALLON",
"VEN", "VENELLE",
"VEN", "VENELLES",
"VIA", "VIA",
"VTE", "VIEILLE ROUTE",
"VTE", "VIEILLE-ROUTE",
"VCHE", "VIEUX CHEMIN",
"VCHE", "VIEUX-CHEMIN",
"VLA", "VILLA",
"VGE", "VILLAGE",
"VGE", "VILLAGES",
"VLA", "VILLAS",
"VOI", "VOIE",
"VC", "VOIE COMMUNALE",
"VC", "VOIE-COMMUNALE",
"VOI", "VOIES",
"ZONE", "ZONE",
]
voies = {}
for abrev in all_abrev:
	voies[abrev[0]] = abrev[1]

index = 1
count = 1
tmp_count = 1
out = open("adresse-%d.json" % index, "wb")
communes_by_insee = {}

for line in communes_json:
	prop = {}
	try:
		data = json.loads(line)
	except:
		# not relevant line
		continue
	prop['code_insee'] = data['properties']['code_insee']
	if not prop['code_insee'].startswith('44'):
		continue
	out.write("""{ "index" : { "_index" : "cg44", "_type" : "address", "_id" : "%d" } }\n""" % count)
	prop['nom'] = data['properties']['nom']
	communes_by_insee[prop['code_insee']] = prop['nom']
	prop['geometry'] = data['geometry']
	out.write(json.dumps(prop)+"\n")
	count += 1
	tmp_count += 1

for line in adresses_json:
	prop = {}
	try:
		data = json.loads(line)
	except:
		# not relevant line
		continue
	prop['code_insee'] = data['properties']['code_insee']
	if not prop['code_insee'].startswith('44'):
		continue
	
	commune = communes_by_insee.get(prop['code_insee'], None)
	if not commune:
		continue

	prop['commune'] = commune
	out.write("""{ "index" : { "_index" : "cg44", "_type" : "address", "_id" : "%d" } }\n""" % count)
	prop['numero'] = int(data['properties']['numero'])
	nom_voie = data['properties']['nom_voie']
	if nom_voie != "NR":
		nom = nom_voie.split(' ')[0]
		nom = voies.get(nom, nom)
		nom_voie = nom + " " + " ".join(nom_voie.split(' ')[1:])
		prop['nom_voie'] = nom_voie
	nom_ld = data['properties']['nom_ld']
	if nom_ld != "NR":
		prop['nom_ld'] = nom_ld
	prop['code_post'] = data['properties']['code_post']
	prop['geometry'] = data['geometry']
	
	out.write(json.dumps(prop)+"\n")
	count += 1
	tmp_count += 1
	if tmp_count > 100000:
		tmp_count = 1
		index += 1
		out.close()
		out = open("adresse-%d.json" % index, "wb")




