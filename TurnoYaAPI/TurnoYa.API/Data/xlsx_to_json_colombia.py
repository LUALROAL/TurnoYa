import pandas as pd
import json
from collections import defaultdict

# Cambia el nombre del archivo si es necesario
df = pd.read_excel('Listados_DIVIPOLA.xlsx')
df = pd.read_excel('Listados_DIVIPOLA.xlsx', sheet_name='Municipios')

# Usar las columnas correctas según el pantallazo
col_depto = 'Columna2'
col_muni = 'Columna4'

departments = defaultdict(list)
for _, row in df.iterrows():
    dept = str(row[col_depto]).strip()
    city = str(row[col_muni]).strip()
    if dept and city and city not in departments[dept]:
        departments[dept].append(city)



result = {"departments": []}
for dept, cities in departments.items():
    result["departments"].append({"name": dept, "cities": sorted(cities)})

with open('colombia_cities.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Archivo colombia_cities.json generado correctamente.")
for dept, cities in departments.items():
    print(f'{dept}: {", ".join(cities)}')
result = {"departments": []}
for dept, cities in departments.items():
    result["departments"].append({"name": dept, "cities": sorted(cities)})

with open('colombia_cities.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Archivo colombia_cities.json generado correctamente.")