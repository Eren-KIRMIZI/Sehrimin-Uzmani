with open('src/mocks/db.ts', 'r', encoding='utf-8-sig') as f:
    text = f.read()

replacements = {
    'Ä±': 'ı',
    'ÄŸ': 'ğ',
    'Ã§': 'ç',
    'ÅŸ': 'ş',
    'Ã¶': 'ö',
    'Ã¼': 'ü',
    'Ä°': 'İ',
    'Äž': 'Ğ',
    'Ã‡': 'Ç',
    'Åž': 'Ş',
    'Ã–': 'Ö',
    'Ãœ': 'Ü',
    'â€”': '—',
    'â€“': '–',
    'â€œ': '“',
    'â€™': '’',
    'â€˜': '‘',
    'Ã¢â‚¬â€œ': '—',
}

for k, v in replacements.items():
    text = text.replace(k, v)

with open('src/mocks/db.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed replacements in db.ts')
