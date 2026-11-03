import os
import re

with open('web/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}`}'
new_href = 'href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`}'

content = content.replace(target, new_href)

with open('web/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added cache buster to download link")
