import json

communes_json = open("BDAdresse_IGN/communes.geojson")
adresses_json = open("BDAdresse_IGN/adresse.json.geojson")

voies = {
	'BD': "BOULEVARD",
	'PAS': "PASSAGE",
	'ROC': "ROCADE", 
	'CAR': "CARREFOUR",
	'VOI': "VOIE",
	'PASS': "PASSAGE",
	'CHEM': "CHEMIN",
	'RTE': "ROUTE",
	'ESP': 'ESPLANADE',
	'CARR': "CARREFOUR",
	'PL': "PLACE",
	'CHE': "CHEMIN",
	'IMP': "IMPASSE",
	'R': "RUE",
	'AV': "AVENUE",
	'PLA': "PLACE"
}

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




