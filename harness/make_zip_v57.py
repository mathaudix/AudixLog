import os, zipfile

ROOT = '/home/user/sessions/07f7c/work/v38'
OUT = '/home/user/sessions/07f7c/audixlog_v59.zip'
SKIP_DIRS = {'node_modules', 'dist', 'tmp', '.git'}

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not (base == ROOT and d == 'harness/dist')]
        for name in files:
            full = os.path.join(base, name)
            rel = os.path.relpath(full, ROOT)
            if rel.startswith('harness' + os.sep + 'dist'):
                continue
            z.write(full, rel)
print('ok', OUT)
