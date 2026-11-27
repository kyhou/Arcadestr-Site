import type { Asset, Release } from './releases';

const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
const powershellQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;

export function verificationCommand(asset: Asset, checksums: Release['checksums']) {
  if (!asset.sha256 && !checksums) return;

  if (asset.os === 'windows') {
    const expected = asset.sha256
      ? `$expected = '${asset.sha256}'`
      : String.raw`$expected = @(Get-Content -LiteralPath ${powershellQuote(checksums!.name)} -ErrorAction Stop |
    ForEach-Object {
        if ($_ -match '^([0-9a-fA-F]{64}) [ *](?:\./)?(.+)$' -and $Matches[2] -ceq $file) {
            $Matches[1]
        }
    } | Sort-Object -Unique)`;
    return `$file = ${powershellQuote(asset.name)}
${expected}
$actual = (Get-FileHash -LiteralPath (Join-Path . $file) -Algorithm SHA256 -ErrorAction Stop).Hash

if (@($expected).Count -eq 1 -and $actual -eq @($expected)[0]) {
    'Verification successful'
} else {
    throw 'Verification failed: checksum missing, ambiguous, or different.'
}`;
  }

  const tool = asset.os === 'macos' ? 'shasum -a 256' : 'sha256sum';
  if (asset.sha256) {
    return `printf '%s  %s\\n' '${asset.sha256}' ${shellQuote(`./${asset.name}`)} | ${tool} --check`;
  }
  // Pass only the selected package's entry to the checksum tool.
  return `PACKAGE=${shellQuote(asset.name)} awk '
  substr($0, 1, 64) ~ /^[[:xdigit:]]+$/ && substr($0, 65, 2) ~ /^ [ *]$/ {
    name = substr($0, 67)
    sub(/\\r$/, "", name)
    sub(/^\\.\\//, "", name)
    if (name == ENVIRON["PACKAGE"]) {
      hash = tolower(substr($0, 1, 64))
      if (expected && expected != hash) ambiguous = 1
      expected = hash
    }
  }
  END {
    if (expected && !ambiguous) print expected "  ./" ENVIRON["PACKAGE"]
  }' ${shellQuote(`./${checksums!.name}`)} | ${tool} --check`;
}
