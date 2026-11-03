#!/usr/bin/env python3
"""Comprueba que los enlaces y recursos locales de la web existen.

GitHub Pages distingue mayúsculas: BioDataSim.html y biodatasim.html son archivos
distintos, aunque en macOS o Windows el enlace parezca funcionar. Por eso se compara
con los nombres exactos de cada carpeta, no con os.path.exists.

Las tarjetas marcadas como «soon» apuntan a simuladores aún por crear: se listan
aparte y no cuentan como error. Uso: python3 tools/check_links.py  (0 = todo correcto)
"""
import pathlib
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parent.parent
TAG = re.compile(r'<(?:a|img|script|link|iframe|source)\b[^>]*?>', re.I)
ATTR = re.compile(r'\b(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.I)


def exists_exact(path):
    """True si la ruta existe con esas mayúsculas exactas, componente a componente."""
    current = ROOT
    try:
        parts = path.resolve().relative_to(ROOT).parts
    except ValueError:
        return False
    for part in parts:
        if not current.is_dir() or part not in {p.name for p in current.iterdir()}:
            return False
        current = current / part
    return True


def main():
    broken, pending = [], []
    for page in sorted(ROOT.rglob('*.html')):
        if '.git' in page.parts:
            continue
        for tag in TAG.findall(page.read_text(encoding='utf-8')):
            match = ATTR.search(tag)
            if not match:
                continue
            url = urlsplit(match.group(1))
            # Las rutas absolutas dependen del dominio (solo las usa 404.html): no se pueden comprobar aquí.
            if url.scheme or url.netloc or not url.path or url.path.startswith('/') or '${' in url.path:
                continue
            target = page.parent / unquote(url.path)
            if target.is_dir():
                target = target / 'index.html'
            if not exists_exact(target):
                is_soon = re.search(r'class="[^"]*\bsoon\b', tag)
                (pending if is_soon else broken).append(f'{page.relative_to(ROOT)} -> {match.group(1)}')
    if pending:
        print(f'Próximamente, sin archivo todavía ({len(pending)}):')
        print('\n'.join('  ' + p for p in pending))
    if broken:
        print(f'ENLACES ROTOS ({len(broken)}):')
        print('\n'.join('  ' + b for b in broken))
        return 1
    print('Sin enlaces rotos.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
