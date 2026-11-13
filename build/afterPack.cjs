// Mette l'icona di Bibo dentro Bibo Tune.exe senza Wine (resedit è JavaScript puro).
const fs = require('fs'); const path = require('path');
const ResEdit = require('resedit');
exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== 'win32') return;
  const exePath = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.exe');
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath));
  const res = ResEdit.NtExecutableResource.from(exe);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const id = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, id, lang, ico.icons.map((i) => i.data));
  // Nome e descrizione nelle proprietà del file, in Gestione attività e nelle app aperte: senza, Windows mostra "Electron".
  const vis = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  const vi = vis.length ? vis[0] : ResEdit.Resource.VersionInfo.createEmpty();
  const vlang = vis.length && vi.lang ? vi.lang : 1033, cp = 1200, ver = ctx.packager.appInfo.version;
  vi.setFileVersion(...ver.split('.').map(Number).concat([0]).slice(0, 4));
  vi.setProductVersion(...ver.split('.').map(Number).concat([0]).slice(0, 4));
  vi.setStringValues({ lang: vlang, codepage: cp }, {
    FileDescription: 'Bibo Tune', ProductName: 'Bibo Tune', InternalName: 'Bibo Tune', OriginalFilename: 'Bibo Tune.exe',
    CompanyName: 'Francesco Argento', LegalCopyright: 'Copyright © Francesco Argento', FileVersion: ver, ProductVersion: ver,
  });
  vi.outputToResourceEntries(res.entries);
  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log('  • icona di Bibo inserita in', path.basename(exePath));
};
