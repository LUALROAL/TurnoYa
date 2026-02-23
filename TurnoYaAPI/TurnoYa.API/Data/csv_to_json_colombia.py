import csv
import json
from collections import defaultdict

# Cambia estos nombres de archivo según corresponda
txt_csv = 'municipios_colombia.csv'  # CSV de DANE: columnas Departamento,Municipio
json_out = 'colombia_cities.json'

departments = defaultdict(list)

with open(txt_csv, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        dept = row['Departamento'].strip()
        city = row['Municipio'].strip()
        if city not in departments[dept]:
            departments[dept].append(city)

result = {"departments": []}
for dept, cities in departments.items():
    result["departments"].append({"name": dept, "cities": sorted(cities)})

with open(json_out, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Archivo {json_out} generado correctamente.")
