import pandas as pd
import json
from collections import defaultdict

# Lee el archivo Excel
file = 'Listados_DIVIPOLA.xlsx'
df = pd.read_excel(file)

# Imprime los nombres de las columnas para inspección
print('Columnas encontradas:')
for i, col in enumerate(df.columns):
    print(f'{i}: {col} ({type(col)})')

# Muestra las primeras filas para inspección
print('\nPrimeras filas:')
print(df.head(10))
