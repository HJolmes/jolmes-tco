# Zertifikate-Downloads

PDFs der Jolmes-Zertifikate hier ablegen. Dateinamen frei wählbar — anschließend
in `src/App.jsx` im Array `ZERTIFIKATE` das Feld `downloadUrl` setzen, z. B.:

```js
{ id: 'iso9001', label: 'DIN EN ISO 9001 (Qualität)',
  downloadUrl: '/jolmes-tco/zertifikate/iso-9001.pdf' },
```

Alles unter `public/` wird beim Build 1:1 ins `dist/` übernommen.
Wichtig: Der Pfad muss mit dem Vite-`base` (`/jolmes-tco/`) beginnen.
