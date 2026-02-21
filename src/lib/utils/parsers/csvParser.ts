type CsvRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function parseCsvFallback(text: string): CsvRow[] {
  const lines = text
    .split(/\r\n|\n|\r/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headerRow = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows: CsvRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const row = headerRow.reduce<CsvRow>((accumulator, header, headerIndex) => {
      accumulator[header] = values[headerIndex] ?? "";
      return accumulator;
    }, {});

    const hasValues = Object.values(row).some((value) => value.trim().length > 0);
    if (hasValues) {
      rows.push(row);
    }
  }

  return rows;
}

async function tryLoadPapaParse() {
  try {
    const dynamicImport = new Function("modulePath", "return import(modulePath);") as (
      modulePath: string
    ) => Promise<unknown>;
    const module = (await dynamicImport("papaparse")) as {
      default?: { parse: (...args: unknown[]) => void };
      parse?: (...args: unknown[]) => void;
    };
    return module.default ?? module;
  } catch {
    return null;
  }
}

export async function parseCSV(file: File): Promise<CsvRow[]> {
  const fileText = await file.text();
  const papa = await tryLoadPapaParse();
  const parse = papa?.parse;

  if (typeof parse !== "function") {
    return parseCsvFallback(fileText);
  }

  return new Promise((resolve, reject) => {
    parse(fileText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (result: { data: CsvRow[] }) => resolve(result.data),
      error: (error: Error) => reject(error),
    });
  });
}
