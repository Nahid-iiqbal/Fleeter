import re

file_path = r'f:\Coding\Projects\Fleeter\fleeter-backend\config\seedDb.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('"admin_super"', '"admin"'),
    ('"apex_boss"', '"owner"'),
    ('"apex_dispatch"', '"manager"'),
    ('"marcus_w"', '"driver"'),
    ('"driver1@fleeter.com"', '"driver@fleeter.com"'),
    ('admin_super', 'admin'),
    ('apex_boss', 'owner'),
    ('apex_dispatch', 'manager'),
    ('marcus_w', 'driver')
]

for old_val, new_val in replacements:
    content = content.replace(old_val, new_val)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Seed DB updated for proper test infos")
